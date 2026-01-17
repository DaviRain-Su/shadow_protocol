# ERC-8004 与 x402 标准解析

## 标准定位

| 标准 | 定位 | 解决的问题 |
|------|------|-----------|
| **ERC-8004** | AI Agent 身份/声誉/验证 | 信任问题 - "这个 Agent 可信吗？" |
| **x402** | HTTP 原生支付协议 | 支付问题 - "怎么付款？" |

**两者是互补关系，不是替代关系。**

---

## ERC-8004: Trustless Agents

> 创建日期: 2025-08-13
> 作者: Marco De Rossi (MetaMask), Davide Crapis (Ethereum Foundation), Jordan Ellis (Google), Erik Reppel (Coinbase)
> 状态: Draft

### 三大核心注册表

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERC-8004 架构                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Identity        │  │ Reputation      │  │ Validation      │ │
│  │ Registry        │  │ Registry        │  │ Registry        │ │
│  │                 │  │                 │  │                 │ │
│  │ • ERC-721 NFT   │  │ • AuthFeedback  │  │ • TEE Oracle    │ │
│  │ • AgentCard     │  │ • 0-100 评分    │  │ • zkML 证明     │ │
│  │ • CAIP-10 地址  │  │ • x402 支付证明 │  │ • 质押验证      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Identity Registry (身份注册表)

```typescript
// Agent 身份 = ERC-721 NFT
interface AgentIdentity {
  agentId: uint256;           // NFT Token ID
  agentAddress: string;       // CAIP-10 格式地址
  agentURI: string;           // → /.well-known/agent-card.json
}

// Agent Card (链下 JSON)
interface AgentCard {
  name: string;
  description: string;
  endpoints: Endpoint[];      // API 端点列表
  x402Config?: X402Config;    // x402 支付配置
  supportedTrustModels: string[];
}
```

### 2. Reputation Registry (声誉注册表)

```typescript
// 反馈事件 (链上)
event AuthFeedback(
  uint256 indexed agentId,
  address indexed client,
  uint8 score,              // 0-100
  bytes32 paymentProof,     // x402 支付证明 (可选)
  string label,
  string offchainURI
);

// 只有实际交易方才能提交反馈
// 可通过 x402 支付证明验证真实性
```

### 3. Validation Registry (验证注册表)

```typescript
// 验证请求
struct ValidationRequest {
  uint256 agentId;
  bytes32 dataHash;         // 待验证数据的哈希
  address validator;        // 验证器合约
}

// 验证响应
struct ValidationResponse {
  uint256 requestId;
  uint8 score;              // 0-100
  bytes proof;              // ZK 证明或 TEE 签名
}

// 验证方式:
// - TEE Oracle: 可信执行环境
// - zkML: 零知识机器学习证明
// - Staked Inference: 质押再执行
```

---

## x402 协议

### 协议流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    x402 支付流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                              Server                     │
│    │                                   │                        │
│    │ ─────── GET /api/endpoint ──────► │                        │
│    │                                   │                        │
│    │ ◄────── 402 Payment Required ──── │                        │
│    │         PaymentRequirements       │                        │
│    │                                   │                        │
│    │ ──────── Execute Payment ───────► │ (链上转账)             │
│    │                                   │                        │
│    │ ─────── GET /api/endpoint ──────► │                        │
│    │         X-Payment: <proof>        │                        │
│    │                                   │                        │
│    │ ◄───────── 200 OK ────────────── │                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### PaymentRequirements

```typescript
interface PaymentRequirements {
  x402Version: 1;
  scheme: 'exact' | 'upto' | 'private-exact';  // Px402 扩展
  network: 'ethereum' | 'base' | 'solana';
  payTo: string;              // 收款地址
  maxAmountRequired: string;  // 最大金额 (wei/lamports)
  asset: string;              // 代币地址或 'native'
  extra?: {
    // Scheme 特定参数
  };
}
```

### X-Payment Header

```typescript
interface PaymentPayload {
  x402Version: 1;
  scheme: string;
  network: string;
  payload: {
    signature?: string;       // 交易签名
    txHash?: string;          // 交易哈希
    proof?: string;           // ZK 证明 (Px402)
  };
}
```

---

## ERC-8004 + x402 集成

### 完整 Agent 交互流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 ERC-8004 + x402 完整交互流程                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent A (买方)                           Agent B (卖方)                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 1: 发现与验证 (ERC-8004)                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       │ 1.1 查询 Identity Registry                                     │
│       │     → 获取 Agent B 的 AgentCard                                │
│       │                                                                 │
│       │ 1.2 查询 Reputation Registry                                   │
│       │     → 检查 Agent B 的评分和历史                                 │
│       │                                                                 │
│       │ 1.3 查询 Validation Registry (可选)                            │
│       │     → 验证 Agent B 的 TEE/zkML 证明                            │
│       │                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: 支付与服务 (x402)                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       │ 2.1 请求 Agent B 的 API                                        │
│       │     GET https://agent-b.ai/inference                           │
│       │                                         │                       │
│       │ 2.2 收到 402 + PaymentRequirements ◄────│                       │
│       │                                                                 │
│       │ 2.3 执行支付 (标准或隐私模式)                                   │
│       │     → Px402: 通过 Privacy Cash 隐私支付                        │
│       │                                                                 │
│       │ 2.4 重试请求 + X-Payment                                       │
│       │     → 获取服务响应                                              │
│       │                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 3: 反馈 (ERC-8004 Reputation)                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       │ 3.1 提交 AuthFeedback                                          │
│       │     → 附带 x402 支付证明                                        │
│       │     → 评分 + 标签                                               │
│       │                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### AgentCard 中的 x402 配置

```json
{
  "name": "InferenceAgent",
  "description": "Private LLM inference service",
  "endpoints": [
    {
      "path": "/inference",
      "method": "POST",
      "x402": {
        "enabled": true,
        "schemes": ["exact", "private-exact"],
        "pricing": {
          "base": "10000",
          "asset": "USDC",
          "network": "solana"
        }
      }
    }
  ],
  "supportedTrustModels": ["reputation", "tee-attestation"]
}
```

---

## Px402 与 ERC-8004 集成设计

### 扩展 AgentCard

```typescript
interface Px402AgentCard extends AgentCard {
  px402Config: {
    // 支持的隐私模式
    privacyModes: ('public' | 'private')[];

    // 隐私池配置
    privacyPools: {
      solana?: {
        provider: 'privacy-cash';
        programId: string;
      };
      ethereum?: {
        provider: 'privacy-pools' | 'railgun';
        contractAddress: string;
      };
    };

    // 是否接受 ZK 支付证明
    acceptZKProofs: boolean;
  };
}
```

### 隐私声誉反馈

```typescript
// 问题: 标准 AuthFeedback 会暴露 client 地址
// 解决: 使用 ZK 证明提交匿名反馈

interface PrivateFeedback {
  agentId: uint256;
  score: uint8;
  // 证明: "我确实与此 Agent 交易过，但不透露我是谁"
  zkProof: {
    // 证明内容:
    // 1. 我拥有一个有效的 x402 支付凭证
    // 2. 支付目标是 agentId 对应的地址
    // 3. 支付金额在合理范围内
    proof: bytes;
    publicInputs: [agentId, scoreCommitment];
  };
}
```

---

## 标准对比

| 方面 | ERC-8004 | x402 | Px402 (我们) |
|------|----------|------|-------------|
| **链** | Ethereum/EVM | 多链 | Solana → 多链 |
| **功能** | 身份/声誉/验证 | 支付 | 隐私支付 |
| **隐私** | 公开 | 公开 | ZK 隐私 |
| **状态** | Draft | 生产 | 规划中 |

### 互补关系

```
ERC-8004 (信任层)
    ↓
    ├── 发现 Agent
    ├── 验证信誉
    └── 选择服务提供者
           ↓
x402 / Px402 (支付层)
    ↓
    ├── 公开支付 (x402)
    └── 隐私支付 (Px402)
           ↓
ERC-8004 (反馈层)
    ↓
    └── 提交声誉反馈
```

---

## Px402 路线图更新

### 新增: ERC-8004 集成 (Phase 6)

| 任务 | 优先级 |
|------|--------|
| AgentCard 扩展支持 | 高 |
| Identity Registry 集成 | 中 |
| 隐私声誉反馈 (ZK) | 低 |
| Validation Registry 集成 | 低 |

---

## 参考资源

### ERC-8004
- [ERC-8004 EIP](https://eips.ethereum.org/EIPS/eip-8004)
- [8004.org](https://8004.org/)
- [Backpack: ERC-8004 Explained](https://learn.backpack.exchange/articles/erc-8004-explained)
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004)

### x402
- [x402.org](https://www.x402.org/)
- [Coinbase x402 Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [GitHub: coinbase/x402](https://github.com/coinbase/x402)

### 集成分析
- [How ERC-8004 Complements x402](https://www.weex.com/news/detail/unlocking-the-future-how-erc-8004-complements-x402-in-building-trust-for-ai-agents-205447)
- [ERC-8004 + x402 Analysis](https://medium.com/@gwrx2005/erc-8004-and-the-ethereum-ai-agent-economy-technical-economic-and-policy-analysis-3134290b24d1)
