# Px402 Roadmap

## Phase 1: 协议桥接层 (Solana MVP)

- Status: ✅ Completed
- Completed: 2026-01-17
- Packages:
  - `@px402/core` - 核心类型和接口 (51 tests)
  - `@px402/solana` - Solana Privacy Cash 集成 (28 tests)
- Scope:
  - [x] 定义 `PrivacyProvider` 抽象接口
  - [x] 实现 `SolanaPrivacyProvider` (Privacy Cash 适配)
  - [x] 实现 `PrivateCashScheme` (x402 Scheme)
  - [x] 基础单元测试 (79 tests passing)

## Phase 2: Agent SDK

- Status: ⏳ Planned
- Scope:
  - `@px402/core` 链无关核心逻辑
  - `@px402/solana` Solana 提供者
  - `@px402/client` Agent 客户端 SDK
  - `@px402/server` 服务端 SDK
  - 双模式支付（public/private）
  - 一次性收款地址生成
  - 示例项目

## Phase 3: 隐私中继网络

- Status: ⏳ Planned
- Scope:
  - 中继器节点设计
  - 去中心化中继网络
  - 激励机制
  - 网络治理

## Phase 4: EVM 扩展

- Status: ⏳ Planned
- Scope:
  - `@px402/evm` EVM 提供者
  - Privacy Pools (0xbow) 集成 - 合规友好
  - RAILGUN 集成 - 备选方案
  - Base 链优先（x402 主要生态）
  - Ethereum / Arbitrum / Polygon 支持

## Phase 5: 多链统一

- Status: ⏳ Planned
- Scope:
  - 统一凭证格式
  - 跨链证明验证
  - 链自动选择器
  - 跨链隐私转账（远期）

## Phase 6: ERC-8004 集成

- Status: ⏳ Planned
- Scope:
  - AgentCard 扩展支持 Px402 配置
  - Identity Registry 集成
  - 隐私声誉反馈（ZK 证明）
  - Validation Registry 集成（TEE/zkML）

---

## 设计文档

| 文档 | 描述 |
|------|------|
| [PX402_VISION.md](docs/PX402_VISION.md) | 产品愿景与架构 |
| [MARKET_ANALYSIS.md](docs/MARKET_ANALYSIS.md) | 市场分析报告 |
| [MULTICHAIN_DESIGN.md](docs/MULTICHAIN_DESIGN.md) | 多链扩展设计 |
| [TECHNICAL_IMPLEMENTATION.md](docs/TECHNICAL_IMPLEMENTATION.md) | 技术实现详解 |
| [ERC8004_X402_STANDARDS.md](docs/ERC8004_X402_STANDARDS.md) | ERC-8004 与 x402 标准解析 |
