# Px402: Private x402 Protocol

> Agent-to-Agent 隐私支付协议 - 为 AI Agent 经济构建隐私基础设施

## 概述

Px402 是一个将 [x402](https://www.x402.org/) HTTP 原生支付协议与 [Privacy Cash](https://github.com/Privacy-Cash/privacy-cash-sdk) 隐私池技术结合的创新协议，专为 AI Agent 之间的匿名微支付设计。

### 核心洞察

**x402 解决了「怎么付」，但没解决「被谁看到付」**

---

## x402 vs Privacy Cash

| 特性 | x402 | Privacy Cash |
|------|------|--------------|
| **透明度** | 链上公开可查 | 隐私/匿名 |
| **协议层** | HTTP 原生 (402状态码) | Solana 程序 |
| **适用场景** | 标准 API 付费 | 敏感商业关系 |
| **交易成本** | ~$0.00025 (Solana) | 稍高（中继器费用）|
| **结算速度** | 400ms | 类似 |

### 互补性分析

- **x402**: 提供 HTTP 原生支付体验，Agent 可无缝调用付费 API
- **Privacy Cash**: 提供链上隐私保护，打断地址关联
- **Px402**: 结合两者优势，实现「无缝 + 隐私」的 Agent 支付

---

## 产品定位

### 与现有生态的差异化

| 协议 | 公开支付 | 隐私支付 | HTTP 原生 | Agent 优化 |
|------|---------|---------|----------|-----------|
| x402 | ✅ | ❌ | ✅ | ✅ |
| Privacy Cash | ❌ | ✅ | ❌ | ❌ |
| **Px402** | ✅ | ✅ | ✅ | ✅ |

### 市场空白

- x402 在 Solana 上已有 **3500万+ 交易**，**$1000万+ 交易量**
- Google A2A 协议缺少支付层，x402 正在填补
- **目前没有隐私 Agent 支付方案** — 这是明确的市场空白

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent A (买方)                           │
│  ┌─────────────┐                                            │
│  │ 隐私资金池   │◄── Privacy Cash Deposit                   │
│  │ (屏蔽身份)   │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐     HTTP 402      ┌─────────────────────┐ │
│  │ Px402 Client │ ──────────────►  │ Agent B (卖方 API)   │ │
│  │              │ ◄────────────── │                       │ │
│  │  • 隐私模式   │   Payment Proof  │ ┌─────────────────┐  │ │
│  │  • 标准模式   │                  │ │ 匿名收款地址     │  │ │
│  └─────────────┘                  │ │ (一次性)         │  │ │
│                                    │ └─────────────────┘  │ │
│                                    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 支付流程

1. **Agent A** 向隐私资金池存入资金（Privacy Cash Deposit）
2. **Agent A** 请求 **Agent B** 的付费 API
3. **Agent B** 返回 HTTP 402 + 支付要求（含一次性收款地址）
4. **Agent A** 通过 Px402 Client 发起隐私支付
5. **Agent A** 附带支付证明重新请求 API
6. **Agent B** 验证支付证明，返回服务结果

---

## 核心创新点

### 1. 双模式支付

```typescript
// 标准 x402 (公开)
await agent.pay(apiEndpoint, { mode: 'public' });

// 隐私 x402 (通过 Privacy Cash)
await agent.pay(apiEndpoint, {
  mode: 'private',
  relayer: 'privacy-cash'
});
```

开发者可根据场景选择：
- **公开模式**: 低成本、高速度、适合非敏感交易
- **隐私模式**: 匿名支付、适合敏感商业关系

### 2. 一次性收款地址

- 卖方 Agent 为每笔交易生成临时地址
- 交易完成后，资金转入隐私池
- 链上无法关联「谁买了谁的服务」

### 3. 支付证明零知识化

| 模式 | HTTP Header | 链上可见性 |
|------|-------------|-----------|
| 标准 x402 | `X-Payment: tx_hash_visible` | 完全公开 |
| Px402 | `X-Payment: zk_proof` | 仅证明有效性 |

---

## 应用场景

### 场景 1: AI 情报市场

```
Agent A (对冲基金 AI) 需要购买市场情报
Agent B (数据分析 AI) 提供预测服务

问题: 如果链上可见 A→B 的支付，竞争对手就知道 A 在使用 B 的数据
解决: 通过 Px402，支付关系完全隐藏
```

### 场景 2: AI 模型推理市场

```
Agent A 需要调用私有 LLM 推理
Agent B 运行专有微调模型

问题: A 不想暴露自己在使用什么模型（商业机密）
解决: 匿名支付，保护技术选型隐私
```

### 场景 3: 去中心化 AI Agent 联盟

```
多个 Agent 协作完成任务，互相调用服务:
  - Agent 1: 数据清洗
  - Agent 2: 模型推理
  - Agent 3: 结果验证

问题: 合作关系公开会被竞争对手复制
解决: Px402 隐藏整个协作网络拓扑
```

---

## 技术实现路径

### Phase 1: 协议桥接层

将 Privacy Cash 封装为 x402 兼容的支付方案。

```typescript
class PrivacyCashScheme implements X402Scheme {
  async createPayment(amount: number, recipient: string) {
    // 1. 从隐私池提取
    const withdrawal = await privacyCash.withdraw(amount, tempAddress);
    // 2. 生成 ZK 证明
    const proof = await generatePaymentProof(withdrawal);
    return { proof, commitment: withdrawal.commitment };
  }

  async verifyPayment(proof: PaymentProof) {
    // 卖方验证支付有效，但不知道买方身份
    return await verifyZKProof(proof);
  }
}
```

**交付物**:
- `@px402/scheme-privacy-cash`: x402 Scheme 实现
- Privacy Cash SDK 集成适配器

### Phase 2: Agent SDK

提供开箱即用的 Agent 支付 SDK。

```typescript
import { Px402Agent } from '@px402/agent-sdk';

const agent = new Px402Agent({
  wallet: keypair,
  privacyPool: 'privacy-cash',
  defaultMode: 'private'
});

// 自动处理隐私支付流程
const response = await agent.fetch('https://api.agent-b.ai/inference', {
  method: 'POST',
  body: JSON.stringify({ prompt: '...' }),
  payment: { maxAmount: '0.01 USDC' }
});
```

**交付物**:
- `@px402/agent-sdk`: Agent 端 SDK
- `@px402/server-sdk`: 服务端 SDK（收款验证）
- 示例项目和文档

### Phase 3: 隐私中继网络

构建去中心化的隐私中继基础设施。

- 多个中继器分散化
- 防止单点故障和审查
- 类似 Tor 的洋葱路由支付

**交付物**:
- 中继器节点软件
- 中继器激励机制设计
- 网络治理框架

---

## 参考资源

### x402 Protocol
- [x402 Official](https://www.x402.org/)
- [Coinbase x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 on Solana](https://solana.com/x402/what-is-x402)
- [GitHub: coinbase/x402](https://github.com/coinbase/x402)

### Privacy Cash
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)

### 研究报告
- [DWF Labs: Inside x402](https://www.dwf-labs.com/research/inside-x402-how-a-forgotten-http-code-becomes-the-future-of-autonomous-payments)
