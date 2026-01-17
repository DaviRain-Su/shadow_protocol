# Px402 技术实现详解

## 核心问题解答

### Q1: 是否需要开发 Solana 链上程序？

**答案: 不需要**

| 组件 | 链上程序 | 说明 |
|------|---------|------|
| **x402** | ❌ 不需要 | 纯 HTTP 协议，使用原生 SOL/SPL 转账 |
| **Privacy Cash** | ✅ 已有 | 隐私池程序已部署，我们只调用 SDK |
| **Px402** | ❌ 不需要 | SDK 层桥接，无需新链上程序 |

**结论**: Px402 是 **纯 SDK/服务端** 实现，复用现有链上基础设施。

---

### Q2: x402 在 Solana 上的实现标准

#### 协议流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    x402 标准流程 (Solana)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                              Server                     │
│    │                                   │                        │
│    │ ─────── GET /api/resource ──────► │                        │
│    │                                   │                        │
│    │ ◄─── 402 Payment Required ─────── │                        │
│    │      {                            │                        │
│    │        "x402Version": 1,          │                        │
│    │        "scheme": "exact",         │                        │
│    │        "network": "solana",       │                        │
│    │        "payTo": "recipient_addr", │                        │
│    │        "maxAmount": "10000",      │                        │
│    │        "asset": "USDC"            │                        │
│    │      }                            │                        │
│    │                                   │                        │
│    │ ──── SOL/SPL Transfer (链上) ───► │ (直接转账到 payTo)     │
│    │                                   │                        │
│    │ ─── GET /api/resource ──────────► │                        │
│    │     X-Payment: {signature/proof}  │                        │
│    │                                   │                        │
│    │ ◄───── 200 OK + Response ──────── │ (验证链上交易后响应)   │
│    │                                   │                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 关键点

1. **无需智能合约**: 使用原生 SOL 转账或 SPL Token Transfer
2. **验证方式**: 服务端通过 RPC 查询链上交易确认
3. **Scheme 系统**: 可扩展的支付方案（exact, upto, streaming...）
4. **Facilitator 可选**: 可自建验证逻辑或使用第三方 facilitator

#### 现有 SDK

| SDK | 特点 |
|-----|------|
| `@x402/svm` | Coinbase 官方 Solana 实现 |
| `x402-solana` | 社区实现，框架无关 |
| `rapid402-sdk` | Facilitator 模式 |

---

### Q3: 如何组合 Privacy Cash 和 x402

#### 核心思路

创建新的 x402 **Scheme**: `private-exact`

```typescript
// 标准 x402 scheme
{
  "scheme": "exact",           // 公开转账
  "payTo": "merchant_address"
}

// Px402 private scheme
{
  "scheme": "private-exact",   // 隐私转账
  "payTo": "stealth_address",  // 一次性地址
  "privacyPool": "privacy-cash"
}
```

---

## 技术架构

### 整体流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Px402 隐私支付流程                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐                      ┌──────────────────────────┐│
│  │   Agent A (买方)  │                      │   Agent B (卖方 API)     ││
│  └────────┬─────────┘                      └────────────┬─────────────┘│
│           │                                             │              │
│           │  [准备阶段 - 一次性]                          │              │
│           │  ┌─────────────────────┐                    │              │
│           │  │ 1. 存入隐私池        │                    │              │
│           │  │    deposit(USDC)    │                    │              │
│           │  │    → 获得 Note      │                    │              │
│           │  └─────────────────────┘                    │              │
│           │                                             │              │
│           │  [支付阶段 - 每次请求]                        │              │
│           │                                             │              │
│           │ ────────── GET /inference ─────────────────►│              │
│           │                                             │              │
│           │ ◄──────── 402 Payment Required ─────────────│              │
│           │           {                                 │              │
│           │             scheme: "private-exact",        │              │
│           │             payTo: <stealth_address>,       │ 每次生成新地址│
│           │             amount: "10000"                 │              │
│           │           }                                 │              │
│           │                                             │              │
│           │  ┌─────────────────────┐                    │              │
│           │  │ 2. 隐私提款          │                    │              │
│           │  │    withdraw(         │                    │              │
│           │  │      note,           │                    │              │
│           │  │      stealth_addr,   │  链上: 隐私池→一次性地址         │
│           │  │      relayer         │  无法追踪来源      │              │
│           │  │    )                 │                    │              │
│           │  │    → 获得 ZK Proof   │                    │              │
│           │  └─────────────────────┘                    │              │
│           │                                             │              │
│           │ ────────── GET /inference ─────────────────►│              │
│           │            X-Payment: {                     │              │
│           │              proof: <zk_proof>,             │              │
│           │              nullifier: <hash>              │              │
│           │            }                                │              │
│           │                                             │              │
│           │ ◄───────── 200 OK + Response ───────────────│ 验证 ZK 证明 │
│           │                                             │ 或验证链上转账│
│           │                                             │              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 隐私保护原理

```
链上可见:
  ┌─────────────┐         ┌─────────────┐
  │ 隐私池 Vault │ ──────► │ 一次性地址   │
  └─────────────┘         └─────────────┘
       ↑                        │
       │                        ↓
  看不到是谁存的         每次不同，无法关联

链上不可见:
  • Agent A 的身份
  • 具体哪笔存款被使用
  • Agent A 和 Agent B 的商业关系
```

---

## SDK 设计

### 1. Server SDK (收款方)

```typescript
// @px402/server

import { createPrivatePaymentMiddleware } from '@px402/server';

// Express/Next.js 中间件
app.use('/api/paid-endpoint', createPrivatePaymentMiddleware({
  // 支持的 scheme
  schemes: ['exact', 'private-exact'],

  // 定价
  price: {
    amount: '10000',  // 0.01 USDC (6 decimals)
    asset: 'USDC',
  },

  // 隐私模式配置
  privacy: {
    enabled: true,
    // 为每个请求生成一次性地址
    generateStealthAddress: async () => {
      return await generateEphemeralKeypair();
    },
    // 验证 ZK 证明或链上转账
    verifyPayment: async (proof, stealthAddress) => {
      // 方案 A: 验证 ZK 证明
      if (proof.type === 'zk') {
        return await verifyZKProof(proof);
      }
      // 方案 B: 验证链上转账到一次性地址
      return await verifyOnChainTransfer(stealthAddress, proof.signature);
    },
  },
}));

// 处理函数
app.post('/api/paid-endpoint', async (req, res) => {
  // 到达这里说明支付已验证
  const result = await doExpensiveComputation(req.body);
  res.json(result);
});
```

### 2. Client SDK (付款方)

```typescript
// @px402/client

import { Px402Client } from '@px402/client';
import { SolanaPrivacyProvider } from '@px402/solana';

// 初始化
const provider = new SolanaPrivacyProvider({
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  wallet: keypair,
  privacyCash: {
    programId: 'PRIVACY_CASH_PROGRAM_ID',
  },
});

const client = new Px402Client({
  provider,
  defaultMode: 'private',  // 或 'public'
});

// 预存资金到隐私池（一次性操作）
await client.depositToPrivacyPool({
  amount: '1000000',  // 1 USDC
  token: 'USDC',
});

// 发起隐私支付请求
const response = await client.fetch('https://api.agent-b.ai/inference', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello' }),
  payment: {
    mode: 'private',      // 使用隐私模式
    maxAmount: '100000',  // 最多支付 0.1 USDC
  },
});

console.log(await response.json());
```

### 3. 核心 Scheme 实现

```typescript
// @px402/scheme-private-exact

import { PrivacyCashSDK } from 'privacy-cash-sdk';

export class PrivateExactScheme implements X402Scheme {
  readonly name = 'private-exact';

  private privacyCash: PrivacyCashSDK;
  private notes: Map<string, DepositNote>;  // 本地存储的存款凭证

  constructor(config: PrivateExactConfig) {
    this.privacyCash = new PrivacyCashSDK(config);
    this.notes = new Map();
  }

  /**
   * 创建支付
   * 1. 从隐私池提款到一次性地址
   * 2. 生成支付证明
   */
  async createPayment(
    requirements: PaymentRequirements
  ): Promise<PaymentPayload> {
    const { payTo, amount, asset } = requirements;

    // 选择一个有足够余额的 note
    const note = this.selectNote(asset, BigInt(amount));
    if (!note) {
      throw new Error('Insufficient balance in privacy pool');
    }

    // 执行隐私提款
    const withdrawResult = await this.privacyCash.withdraw({
      note,
      recipient: payTo,  // 一次性地址
      amount: BigInt(amount),
    });

    // 构造支付证明
    return {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: {
        // 不包含发送者信息
        signature: withdrawResult.signature,
        nullifierHash: withdrawResult.nullifierHash,
        // 可选: ZK 证明
        proof: withdrawResult.proof,
      },
    };
  }

  /**
   * 验证支付（服务端调用）
   */
  async verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<boolean> {
    const { signature, nullifierHash } = payload.payload;

    // 方案 A: 验证链上转账
    const tx = await this.connection.getTransaction(signature);
    if (!tx) return false;

    // 检查转账目标是否是要求的一次性地址
    const transfer = parseTransferInstruction(tx);
    if (transfer.destination !== requirements.payTo) return false;
    if (transfer.amount < BigInt(requirements.amount)) return false;

    // 方案 B: 验证 ZK 证明（更强隐私）
    // return await verifyGroth16Proof(payload.payload.proof);

    return true;
  }
}
```

---

## 关键技术决策

### 验证方式选择

| 方式 | 隐私级别 | 实现复杂度 | 验证速度 |
|------|---------|-----------|---------|
| **链上转账验证** | 中 | 低 | 400-800ms |
| **ZK 证明验证** | 高 | 高 | 取决于证明大小 |

**建议**: MVP 阶段使用链上转账验证，后续迭代支持 ZK 证明。

### 一次性地址生成

```typescript
// 服务端为每个请求生成临时地址
async function generateStealthAddress(): Promise<StealthAddress> {
  // 方案 A: 简单的临时 Keypair
  const ephemeral = Keypair.generate();

  // 方案 B: 使用 Diffie-Hellman 派生（更安全）
  // const { publicKey, privateKey } = deriveStealthAddress(masterKey, nonce);

  return {
    address: ephemeral.publicKey.toBase58(),
    privateKey: ephemeral.secretKey,  // 服务端保存，用于后续转入主账户
  };
}
```

### 资金归集

```typescript
// 服务端后台任务：将一次性地址的资金归集到主账户
async function collectFunds() {
  const stealthAddresses = await db.getUnclaimedStealthAddresses();

  for (const addr of stealthAddresses) {
    const balance = await getBalance(addr.address);
    if (balance > 0) {
      // 转到主收款地址或存入隐私池
      await transfer(addr.privateKey, mainWallet, balance);
      await db.markAsClaimed(addr.id);
    }
  }
}
```

---

## 开发路径

### Phase 1: 基础实现

```
Week 1-2:
├── 实现 PrivateExactScheme
├── 集成 Privacy Cash SDK
├── 链上转账验证
└── 基础测试

Week 3-4:
├── Server SDK (@px402/server)
├── Client SDK (@px402/client)
├── Express/Next.js 中间件
└── 端到端测试
```

### Phase 2: 增强隐私

```
├── ZK 证明验证（可选）
├── 一次性地址优化
├── 中继器支持
└── 更多 scheme 支持
```

---

## 不需要开发的部分

| 组件 | 原因 |
|------|------|
| Solana 链上程序 | 复用 Privacy Cash 和原生 SPL Transfer |
| ZK 电路 | 复用 Privacy Cash 的 Groth16 电路 |
| 钱包适配器 | 使用标准 @solana/web3.js |
| Facilitator 服务 | 自建验证逻辑，可选使用第三方 |

---

## 参考资源

### x402 实现
- [x402 Official](https://www.x402.org/)
- [Coinbase x402 GitHub](https://github.com/coinbase/x402)
- [Solana x402 Guide](https://solana.com/developers/guides/getstarted/intro-to-x402)
- [rapid402 SDK](https://github.com/rapid402/rapid402-sdk)

### Privacy Cash
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)
- [nullifier.cash](https://nullifier.cash/) - 相关隐私协议参考

### ZK 技术
- [Solana Groth16 Verifier](https://github.com/Lightprotocol/groth16-solana)
- [snarkjs](https://github.com/iden3/snarkjs) - 浏览器端证明生成
