# Px402 市场分析报告

> 调研日期: 2026-01-17

## 核心结论

**市场空白是真实的** — 目前没有同时具备「HTTP 原生支付」和「隐私支付」能力的 AI Agent 支付协议。

---

## 竞争格局

### 能力矩阵

| 协议 | HTTP 原生 | 隐私支付 | Agent 优化 | 多链支持 | 状态 |
|------|----------|---------|-----------|---------|------|
| **x402** (Coinbase) | ✅ | ❌ | ✅ | ✅ | 生产就绪 |
| **h402** (BitGPT) | ✅ | ❌* | ✅ | ✅ | 开发中 |
| **AP2** (Google) | ✅ | ❌ | ✅ | ✅ | 生产就绪 |
| **COTI** | ❌ | ✅ | ✅ | ✅ | 生产就绪 |
| **Privacy Cash** | ❌ | ✅ | ❌ | Solana | 生产就绪 |
| **Px402** (新) | ✅ | ✅ | ✅ | Solana | 规划中 |

> *h402 宣传有 ZK 隐私功能，但实际代码中尚未实现

### 竞争格局图

```
                    HTTP 原生支付
                         │
            ┌────────────┼────────────┐
            │            │            │
        x402/AP2      h402         Px402 (新)
        (Coinbase)   (BitGPT)      (我们)
            │            │            │
隐私支付    ❌           ❌*          ✅
            │            │            │
        规划中        声称有        目标实现
                    但未实现

                    隐私基础设施
                         │
            ┌────────────┴────────────┐
            │                         │
          COTI                   Privacy Cash
     (Garbled Circuits)          (ZK Proofs)
            │                         │
HTTP 原生支付 ❌                      ❌
```

---

## 详细竞品分析

### 1. x402 (Coinbase + Cloudflare)

**概述**: HTTP 原生支付协议标准，复活 HTTP 402 状态码

**优势**:
- 行业标准，Coinbase + Cloudflare 背书
- 生态系统成熟（3500万+ 交易，$1000万+ 交易量）
- Google AP2 集成
- 多链支持（EVM, Solana）

**劣势**:
- **没有隐私支付功能**
- 所有交易链上公开可查

**隐私路线图**:
> "x402 is evolving, with ideas like... privacy features"
> — 仍在规划阶段，尚无具体实现

**参考**:
- [x402 Official](https://www.x402.org/)
- [GitHub: coinbase/x402](https://github.com/coinbase/x402)
- [Coinbase Documentation](https://docs.cdp.coinbase.com/x402/welcome)

---

### 2. h402 (BitGPT)

**概述**: x402 超集，增加多链支持和扩展生命周期

**宣传的功能**:
- ZK 证明和数据主权
- 隐私保护代理层
- 多链支持（EVM, Solana, Bitcoin, Lightning）

**实际情况**:
- GitHub 代码中**没有隐私支付实现**
- 只实现了 `exact` scheme（固定金额支付）
- 路线图计划 `upto`、`streamed`、`subscription`，**不涉及匿名特性**

**关键发现**:
> "网页明确指出核心特性为 No fees, No middlemen, No chargebacks"
> "**未提及零知识证明、隐私保护或匿名交易的实现细节**"

**参考**:
- [h402 Official](https://h402.xyz/)
- [GitHub: bit-gpt/h402](https://github.com/bit-gpt/h402)
- [BitGPT](https://bitgpt.xyz/)

---

### 3. Google AP2 (Agent Payments Protocol)

**概述**: Google AI Agent 支付协议，与 A2A (Agent2Agent) 配合

**定位**:
- A2A: Agent 间通信协议
- AP2: Agent 支付能力
- x402: 底层支付实现

**特点**:
- 企业级背书
- 与 Google AI 生态深度集成
- 支持传统支付 + 加密支付

**劣势**:
- **没有隐私支付功能**
- 依赖 x402，继承其局限性

**参考**:
- [Google A2A Protocol](https://developers.google.com/agent-to-agent)
- [AP2 Integration](https://eco.com/support/en/articles/12328618-what-is-agent2agent-x402-the-complete-guide-to-ai-agent-payment-protocol)

---

### 4. COTI

**概述**: Layer 2 隐私基础设施，使用 Garbled Circuits 技术

**核心技术**:
- Garbled Circuits（比 FHE 快 3000x，轻 250x）
- 可编程隐私
- 跨链隐私（70+ 区块链网络）

**AI Agent 能力**:
- COTI Agents 平台（已上线主网）
- Google for Startups 支持
- AI Agent 可隐私交易和交互

**合作伙伴**:
- 以色列央行（数字谢克尔）
- 欧洲央行（数字欧元）
- 沙特阿拉伯 AI 和区块链中心
- HoudiniPay（隐私支付）

**劣势**:
- **不是 HTTP 原生支付协议**
- 与 x402 没有集成
- 定位是隐私计算层，不是支付协议层

**参考**:
- [COTI Official](https://coti.io/)
- [COTI Agents](https://medium.com/cotinetwork/coti-agents-is-live-on-coti-mainnet-with-google-startup-backing-e833be72d04b)
- [COTI 2026 Roadmap](https://coincodex.com/article/78950/coti-reveals-privacy-focused-2026-roadmap-building-on-2025-momentum/)

---

### 5. Privacy Cash

**概述**: Solana 链上隐私池，ZK 证明隐私存取款

**核心功能**:
- `deposit()` / `withdraw()` - SOL 隐私存取
- `depositSPL()` / `withdrawSPL()` - SPL 代币隐私存取
- 支持 USDC、USDT

**技术特点**:
- Zigtur 安全审计
- ZK 证明（Groth16）
- Merkle Tree 承诺存储

**劣势**:
- **不是 HTTP 原生支付协议**
- 没有 Agent 优化
- 仅支持 Solana

**参考**:
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)

---

## 市场数据

### x402 生态数据（2025）

| 指标 | 数值 |
|------|------|
| 总交易数 | 3500万+ |
| 总交易量 | $1000万+ |
| 周交易增长 | 1000%（Sep-Oct 2025）|
| 结算速度 | 400ms (Solana) |
| 交易成本 | ~$0.00025 (Solana) |

### AI Agent 市场预测

| 来源 | 预测 |
|------|------|
| Franklin Templeton | $1T Agent-driven DeFi by 2030 |
| 行业共识 | 2026 年 AI + 支付 + 区块链融合 |

---

## Px402 差异化定位

### 核心价值主张

**"x402 解决了「怎么付」，Px402 解决「被谁看到付」"**

### 功能对比

| 功能 | x402 | h402 | Px402 |
|------|------|------|-------|
| HTTP 402 原生 | ✅ | ✅ | ✅ |
| 公开支付 | ✅ | ✅ | ✅ |
| 隐私支付 | ❌ | ❌* | ✅ |
| ZK 支付证明 | ❌ | ❌ | ✅ |
| 一次性收款地址 | ❌ | ❌ | ✅ |
| Agent SDK | ✅ | ✅ | ✅ |

### 目标场景

1. **AI 情报市场** - 隐藏数据购买关系
2. **AI 模型推理市场** - 保护技术选型隐私
3. **去中心化 Agent 联盟** - 隐藏协作网络拓扑

---

## 风险评估

### 竞争风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| h402 实现隐私功能 | 中 | 高 | 先发优势，深度集成 Privacy Cash |
| x402 官方加隐私 scheme | 中 | 高 | 差异化定位，专注 Agent 场景 |
| COTI 做 HTTP 支付集成 | 低 | 中 | 技术栈不同，Solana 专注 |

### 时间窗口

**当前状态**: 市场空白明确，竞品尚未实现隐私支付

**建议**: 尽快推出 MVP，建立先发优势

---

## 参考资源

### 协议文档
- [x402 Whitepaper](https://www.x402.org/x402-whitepaper.pdf)
- [x402 on Solana](https://solana.com/x402/what-is-x402)

### 行业分析
- [DWF Labs: Inside x402](https://www.dwf-labs.com/research/inside-x402-how-a-forgotten-http-code-becomes-the-future-of-autonomous-payments)
- [Chainalysis: AI and Crypto](https://www.chainalysis.com/blog/ai-and-crypto-agentic-payments/)
- [TheStreet: $1T AI Agent Economy](https://www.thestreet.com/crypto/innovation/this-crypto-protocol-could-power-the-1t-ai-agent-economy)

### 技术资源
- [GitHub: coinbase/x402](https://github.com/coinbase/x402)
- [GitHub: bit-gpt/h402](https://github.com/bit-gpt/h402)
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)
