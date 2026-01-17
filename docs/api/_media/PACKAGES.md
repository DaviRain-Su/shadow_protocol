# Px402 组件文档

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Px402 Protocol                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐│
│  │ @px402/client│   │ @px402/server│   │    @px402/relayer       ││
│  │  (买方 SDK)  │   │  (卖方 SDK)  │   │  (中继/索引服务)         ││
│  └──────┬───────┘   └──────┬───────┘   └───────────┬──────────────┘│
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            │                                        │
│                   ┌────────┴────────┐                              │
│                   │  @px402/solana  │                              │
│                   │ (Privacy Cash)  │                              │
│                   └────────┬────────┘                              │
│                            │                                        │
│                   ┌────────┴────────┐                              │
│                   │   @px402/core   │                              │
│                   │  (核心类型定义)  │                              │
│                   └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## @px402/core

**核心类型定义包**

### 主要类型

```typescript
// x402 协议核心接口
interface X402Scheme {
  name: string;
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerificationResult>;
  createPayment(requirements: PaymentRequirements): Promise<PaymentPayload>;
}

// 支付要求 (服务端返回)
interface PaymentRequirements {
  x402Version: number;
  scheme: string;           // 'private-exact' | 'exact'
  network: string;          // 'solana' | 'ethereum'
  payTo: string;            // 收款地址
  maxAmountRequired: string; // 金额 (最小单位)
  asset: string;            // 'SOL' | 'USDC'
  description?: string;
}

// 支付载荷 (客户端发送)
interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    proof: string;         // ZK 证明
    nullifierHash: string; // 防双花
    recipient: string;
    amount: string;
  };
}
```

---

## @px402/server

**x402 服务端 SDK - Express 中间件**

### 安装

```bash
pnpm add @px402/server
```

### 核心功能

1. **HTTP 402 响应处理**
2. **支付验证中间件**
3. **Nullifier 注册表 (防双花)**

### 使用示例

```typescript
import express from 'express';
import { createRequirePayment, MemoryNullifierRegistry } from '@px402/server';
import { PrivateCashScheme } from '@px402/solana';

const app = express();

// 1. 创建隐私支付方案
const scheme = new PrivateCashScheme({
  provider: myProvider,
  rpcUrl: 'https://api.devnet.solana.com',
  nullifierRegistry: new MemoryNullifierRegistry({ ttl: 3600000 }),
});

// 2. 创建支付中间件
const requirePayment = createRequirePayment({
  schemes: [scheme],
  onPaymentVerified: (req, result) => {
    console.log('Payment verified:', result);
  },
});

// 3. 免费端点
app.get('/api/free', (req, res) => {
  res.json({ message: 'Free content' });
});

// 4. 付费端点
app.get('/api/premium',
  requirePayment({
    amount: '50000000',      // 0.05 SOL
    token: 'SOL',
    recipient: 'YOUR_WALLET',
    description: 'Premium API access',
  }),
  (req, res) => {
    res.json({ secret: 'Premium content!' });
  }
);
```

### x402 兼容性

| Header | 用途 |
|--------|------|
| `X-Payment` | 客户端发送支付证明 |
| `X-Payment-Requirements` | 服务端返回支付要求 |
| `X-402-Version` | 协议版本号 |
| `WWW-Authenticate: X402` | 标准认证头 |

---

## @px402/client

**x402 客户端 SDK**

### 安装

```bash
pnpm add @px402/client
```

### 使用示例

```typescript
import { Px402Client } from '@px402/client';
import { PrivateCashScheme, SolanaPrivacyProvider } from '@px402/solana';

// 1. 初始化 Provider
const provider = new SolanaPrivacyProvider({
  rpcUrl: 'https://api.devnet.solana.com',
  secretKey: yourSecretKey,
});
await provider.initialize();

// 2. 存款到隐私池
await provider.deposit('500000000', 'SOL'); // 0.5 SOL

// 3. 创建客户端
const client = new Px402Client({
  schemes: [new PrivateCashScheme({ provider, rpcUrl })],
  autoPayEnabled: true,
  defaultMode: 'private',
});

// 4. 请求付费 API (自动处理 402)
const response = await client.fetch('https://api.example.com/premium');
console.log(await response.json());
```

### 支付流程

```
1. fetch() 发起请求
2. 收到 HTTP 402 + 支付要求
3. 自动创建 ZK 支付证明
4. 重新请求 (带 X-Payment header)
5. 收到 HTTP 200 + 内容
```

---

## @px402/solana

**Solana Privacy Cash 集成**

### 安装

```bash
pnpm add @px402/solana
```

### 核心组件

#### SolanaPrivacyProvider

```typescript
import { SolanaPrivacyProvider } from '@px402/solana';

const provider = new SolanaPrivacyProvider({
  rpcUrl: 'https://api.devnet.solana.com',
  secretKey: yourKeypair.secretKey,
  programId: 'PRIVACY_CASH_PROGRAM_ID', // 可选
});

await provider.initialize();

// 存款
const { note } = await provider.deposit('500000000', 'SOL');
console.log('Commitment:', note.commitment);

// 生成支付证明
const proof = await provider.generatePaymentProof({
  amount: '50000000',
  recipient: recipientAddress,
  note: note,
});

// 查询余额
const balance = await provider.getPrivateBalance();
```

#### PrivateCashScheme

```typescript
import { PrivateCashScheme } from '@px402/solana';

const scheme = new PrivateCashScheme({
  provider: myProvider,
  rpcUrl: 'https://api.devnet.solana.com',
  nullifierRegistry: myRegistry,
  skipOnChainVerification: false, // 生产环境设为 false
});

// 实现 X402Scheme 接口
await scheme.verify(payload, requirements);
await scheme.createPayment(requirements);
```

---

## @px402/relayer

**Privacy Cash 中继/索引服务**

### 安装

```bash
pnpm add @px402/relayer
```

### 核心功能

1. **Merkle 树索引** - 跟踪所有 commitments
2. **Nullifier 注册** - 防止双花
3. **交易中继** - 匿名提交交易

### 使用示例

```typescript
import { PrivacyCashRelayer, PrivacyCashIndexer } from '@px402/relayer';
import { Keypair } from '@solana/web3.js';

// 1. 创建 Relayer
const relayer = new PrivacyCashRelayer({
  rpcUrl: 'http://localhost:8899',
  programId: 'YOUR_PROGRAM_ID',
  secretKey: Keypair.generate().secretKey,
  fee: BigInt(1000000), // 0.001 SOL 手续费
  network: 'localnet',
});

await relayer.initialize();

// 2. 获取 Merkle 根
const root = relayer.getMerkleRoot();

// 3. 检查 nullifier
const isUsed = relayer.isNullifierUsed(nullifierHash);

// 4. 获取 Merkle 证明
const indexer = relayer.getIndexer();
const proof = indexer.getMerkleProof(commitment);
```

### REST API

启动 Relayer 服务器：

```typescript
import { createRelayerServer } from '@px402/relayer';

const server = createRelayerServer(relayer, { port: 3501 });
```

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/stats` | GET | 统计数据 |
| `/merkle-root` | GET | 当前 Merkle 根 |
| `/merkle-proof/:commitment` | GET | 获取 Merkle 证明 |
| `/nullifier/:hash` | GET | 检查 nullifier |
| `/deposit` | POST | 注册存款 |
| `/withdraw` | POST | 提交提款 |

---

## @px402/relay (可选/未来)

**P2P 匿名路由网络**

> 这是更高级的匿名层，类似 Tor 的洋葱路由。当前实现中未使用。

### 功能

- 洋葱加密 (多层加密)
- P2P 节点发现
- 路由选择策略
- 激励机制

---

## 包依赖关系

```
@px402/core          <- 基础类型
    ↑
@px402/solana        <- Privacy Cash 集成
    ↑
@px402/client        <- 客户端 SDK
@px402/server        <- 服务端 SDK
@px402/relayer       <- 中继服务
```

## 快速开始

```bash
# 安装所有依赖
pnpm install

# 运行 Demo
pnpm --filter @px402/demo start

# 运行 E2E 测试
pnpm --filter @px402/example-basic e2e:relayer
```
