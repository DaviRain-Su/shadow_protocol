# Story: Phase 3 - Privacy Relay Network

> 实现隐私中继网络，支持匿名支付路由

## 目标

1. 实现 `@px402/relay` - 中继节点核心
2. 中继消息协议设计
3. 节点发现与路由
4. 激励机制基础

---

## 技术决策

### 包结构

```
packages/
├── core/                    # @px402/core (Phase 1 ✅)
├── solana/                  # @px402/solana (Phase 1 ✅)
├── client/                  # @px402/client (Phase 2 ✅)
├── server/                  # @px402/server (Phase 2 ✅)
│
└── relay/                   # @px402/relay - 中继网络
    ├── src/
    │   ├── node.ts          # RelayNode 主类
    │   ├── protocol.ts      # 消息协议
    │   ├── router.ts        # 路由器
    │   ├── peer.ts          # 节点发现
    │   ├── incentive.ts     # 激励机制
    │   ├── types.ts         # 类型定义
    │   └── index.ts
    └── package.json
```

### 中继协议设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│ Relay Node  │────►│   Server    │
│  (Agent A)  │◄────│  (匿名路由)  │◄────│  (Agent B)  │
└─────────────┘     └─────────────┘     └─────────────┘
        │                  │                    │
        │    Encrypted     │    Encrypted       │
        │    Request       │    Request         │
        └──────────────────┴────────────────────┘
```

### 消息格式

```typescript
interface RelayMessage {
  id: string;                    // 消息 ID
  type: 'request' | 'response';  // 消息类型
  version: number;               // 协议版本

  // 加密层
  encryptedPayload: string;      // 加密的请求/响应
  ephemeralKey: string;          // 临时公钥

  // 路由信息
  nextHop?: string;              // 下一跳节点 (洋葱路由)
  ttl: number;                   // 生存时间

  // 激励
  fee: string;                   // 中继费用
  feeToken: string;              // 费用代币
}
```

### API 设计

#### 中继节点

```typescript
import { RelayNode } from '@px402/relay';

const node = new RelayNode({
  port: 8402,
  privateKey: myKey,
  bootstrapPeers: ['relay1.px402.network:8402'],
  incentiveConfig: {
    minFee: '1000',  // lamports
    feeToken: 'SOL',
  },
});

// 启动节点
await node.start();

// 监听事件
node.on('relay', (msg) => console.log('Relayed:', msg.id));
node.on('payment', (amount) => console.log('Earned:', amount));
```

#### 客户端使用中继

```typescript
import { Px402Client } from '@px402/client';
import { RelayTransport } from '@px402/relay';

const client = new Px402Client({
  provider,
  transport: new RelayTransport({
    relayNodes: ['relay1.px402.network:8402'],
    hops: 3,  // 洋葱路由层数
  }),
});

// 通过中继发送请求
const response = await client.fetch('https://api.agent-b.ai/data', {
  payment: { maxAmount: '1000000' },
  relay: { enabled: true },
});
```

---

## 实现计划

### Step 1: @px402/relay 包初始化

**文件**: `packages/relay/package.json`, `packages/relay/tsconfig.json`

**验收标准**:
- [x] 包结构创建完成
- [x] 依赖配置正确

---

### Step 2: 类型定义

**文件**: `packages/relay/src/types.ts`

**验收标准**:
- [x] RelayMessage 类型定义
- [x] RelayNode 配置类型
- [x] 路由类型定义
- [x] 激励类型定义

---

### Step 3: 消息协议

**文件**: `packages/relay/src/protocol.ts`

**验收标准**:
- [x] 消息编码/解码
- [x] 加密/解密
- [x] 消息验证
- [x] 洋葱路由封装

---

### Step 4: 节点发现

**文件**: `packages/relay/src/peer.ts`

**验收标准**:
- [x] PeerManager 类
- [x] 节点注册/注销
- [x] 心跳机制
- [x] 节点评分

---

### Step 5: 路由器

**文件**: `packages/relay/src/router.ts`

**验收标准**:
- [x] Router 类
- [x] 路由选择算法
- [x] 负载均衡
- [x] 故障转移

---

### Step 6: 激励机制

**文件**: `packages/relay/src/incentive.ts`

**验收标准**:
- [x] IncentiveManager 类
- [x] 费用计算
- [x] 支付验证
- [x] 收益追踪

---

### Step 7: 中继节点核心

**文件**: `packages/relay/src/node.ts`

**验收标准**:
- [x] RelayNode 类
- [x] 消息处理
- [x] 连接管理
- [x] 事件系统

---

### Step 8: 客户端中继传输

**文件**: `packages/relay/src/transport.ts`

**验收标准**:
- [x] RelayTransport 类
- [x] 与 Px402Client 集成
- [x] 多跳路由
- [x] 重试逻辑

---

### Step 9: 单元测试

**验收标准**:
- [x] Protocol 测试 (25)
- [x] Peer 测试 (23)
- [x] Router 测试 (19)
- [x] Incentive 测试 (24)
- [x] Node 测试 (23)
- [x] Transport 测试 (11)
- [x] 测试覆盖率 > 80%

---

## 验收标准汇总

### 功能验收

- [x] `@px402/relay` 包构建成功
- [x] RelayNode 可启动监听
- [x] 消息加密传输正确
- [x] 洋葱路由工作正常
- [x] 节点发现功能正常
- [x] 激励机制基础完成
- [x] 与 Px402Client 集成

### 质量验收

- [x] TypeScript 严格模式无错误
- [x] ESLint 无警告
- [x] 单元测试通过
- [x] 测试覆盖率 > 80%

### 文档验收

- [x] README.md 更新
- [x] API 文档生成 (TypeScript .d.ts)
- [x] CHANGELOG.md 更新

---

## 完成状态

- Start date: 2026-01-17
- Completion date: 2026-01-17
- Status: ✅ Completed

### 实现摘要

**@px402/relay (125 tests)**
- `types.ts` - 中继类型定义 (RelayMessage, PeerInfo, Route, IncentiveRecord)
- `protocol.ts` - 消息协议 (加密/解密, 洋葱路由, 消息验证)
- `peer.ts` - PeerManager (节点发现, 评分, 心跳)
- `router.ts` - Router (路由选择, 策略, 负载均衡)
- `incentive.ts` - IncentiveManager (费用计算, 支付验证, 收益追踪)
- `node.ts` - RelayNode (核心节点, 消息处理, 事件系统)
- `transport.ts` - RelayTransport (客户端中继传输)

**核心功能**
- NaCl box 加密 (curve25519-xsalsa20-poly1305)
- 洋葱路由多层加密
- 基于评分的节点选择
- 四种路由策略 (lowest-fee, highest-reputation, balanced, random)
- 费用计算和验证
- 节点心跳和超时管理

**测试覆盖**
- Protocol 测试 (25)
- Peer 测试 (23)
- Router 测试 (19)
- Incentive 测试 (24)
- Node 测试 (23)
- Transport 测试 (11)
- 总计: 125 new tests (266 total)
