# Px402

> Private x402 Protocol — Agent-to-Agent 隐私支付协议

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 概述

Px402 将 [x402](https://www.x402.org/) HTTP 原生支付协议与 [Privacy Cash](https://github.com/Privacy-Cash/privacy-cash-sdk) 隐私池技术结合，为 AI Agent 之间的匿名微支付提供基础设施。

**核心洞察**: x402 解决了「怎么付」，Px402 解决「被谁看到付」

## 为什么需要 Px402?

当前 AI Agent 支付生态的问题：

| 场景 | 问题 |
|------|------|
| **AI 情报市场** | 链上可见 A→B 支付，竞争对手知道你在用谁的数据 |
| **AI 模型推理** | 暴露技术选型，商业机密泄露 |
| **Agent 联盟协作** | 合作关系公开，被竞争对手复制 |

## 差异化定位

| 协议 | 公开支付 | 隐私支付 | HTTP 原生 | Agent 优化 |
|------|---------|---------|----------|-----------|
| x402 (Coinbase) | ✅ | ❌ | ✅ | ✅ |
| h402 (BitGPT) | ✅ | ❌* | ✅ | ✅ |
| Privacy Cash | ❌ | ✅ | ❌ | ❌ |
| **Px402** | ✅ | ✅ | ✅ | ✅ |

> *h402 宣传有隐私功能，但实际代码中尚未实现

## 架构

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

## 核心特性

### 双模式支付

```typescript
// 标准 x402 (公开)
await agent.pay(apiEndpoint, { mode: 'public' });

// 隐私 x402 (通过 Privacy Cash)
await agent.pay(apiEndpoint, { mode: 'private' });
```

### 一次性收款地址

- 卖方 Agent 为每笔交易生成临时地址
- 交易完成后，资金转入隐私池
- 链上无法关联「谁买了谁的服务」

### 零知识支付证明

| 模式 | HTTP Header | 链上可见性 |
|------|-------------|-----------|
| 标准 x402 | `X-Payment: tx_hash` | 完全公开 |
| Px402 | `X-Payment: zk_proof` | 仅证明有效性 |

## 快速开始

> 🚧 开发中 — 以下为目标 API 设计

```typescript
import { Px402Client, createProvider } from '@px402/sdk';

const provider = createProvider({
  chain: 'solana',
  privacyProtocol: 'privacy-cash',
});

const client = new Px402Client({
  provider,
  defaultMode: 'private',
});

// 自动处理隐私支付流程
const response = await client.fetch('https://api.agent-b.ai/inference', {
  method: 'POST',
  body: JSON.stringify({ prompt: '...' }),
  payment: { maxAmount: '0.01 USDC' },
});
```

## 路线图

| Phase | 内容 | 状态 |
|-------|------|------|
| **1** | 协议桥接层 (Solana) | ⏳ Planned |
| **2** | Agent SDK | ⏳ Planned |
| **3** | 隐私中继网络 | ⏳ Planned |
| **4** | EVM 扩展 (Base/Ethereum) | ⏳ Planned |
| **5** | 多链统一 | ⏳ Planned |

详见 [ROADMAP.md](ROADMAP.md)

## 文档

| 文档 | 描述 |
|------|------|
| [PX402_VISION.md](docs/PX402_VISION.md) | 产品愿景与架构设计 |
| [MARKET_ANALYSIS.md](docs/MARKET_ANALYSIS.md) | 市场分析报告 |
| [MULTICHAIN_DESIGN.md](docs/MULTICHAIN_DESIGN.md) | 多链扩展设计 |
| [AGENTS.md](AGENTS.md) | AI 编码规范 |

## 技术栈

- **隐私层**: Privacy Cash (Solana), Privacy Pools (EVM)
- **支付协议**: x402
- **证明系统**: Groth16 / PLONK
- **链支持**: Solana (MVP), Base/Ethereum (Phase 4)

## 参考资源

### 协议
- [x402 Official](https://www.x402.org/)
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)
- [Privacy Pools (0xbow)](https://privacypools.com/)

### 研究
- [DWF Labs: Inside x402](https://www.dwf-labs.com/research/inside-x402-how-a-forgotten-http-code-becomes-the-future-of-autonomous-payments)
- [Vitalik: Privacy Pools Paper](https://www.theblock.co/amp/post/249487/vitalik-buterin-co-authors-paper-on-regulation-friendly-tornado-cash-alternative)

## License

MIT
