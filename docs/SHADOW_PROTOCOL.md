# Shadow Protocol - Solana 隐私产品套件

基于 Zig Anchor 框架构建的 Solana 生态隐私解决方案。

## 目录

- [概述](#概述)
- [核心原理](#核心原理)
- [产品矩阵](#产品矩阵)
- [技术架构](#技术架构)
- [实施路线图](#实施路线图)
- [商业模式](#商业模式)

---

## 概述

### 愿景

为 Solana 生态的一切 DeFi 操作加上隐私层，让用户在享受 DeFi 便利的同时保护个人隐私。

### 核心价值

| 特性 | 描述 |
|------|------|
| **隐私交易** | 打断链上地址关联，无法追踪资金流向 |
| **MEV 保护** | 集成 DFlow 订单流拍卖，防止三明治攻击 |
| **最优价格** | 做市商竞价机制确保最佳成交价 |
| **合规友好** | 可选审计接口，支持企业级合规需求 |

### 为什么需要隐私？

```
当前 Solana DeFi 的隐私问题：

┌─────────────────────────────────────────────────────────────────┐
│  问题 1: 资金追踪                                                │
│  ├── 任何人可以看到你的钱包余额                                  │
│  ├── 所有交易记录公开可查                                        │
│  └── 竞争对手/攻击者可以分析你的策略                             │
│                                                                 │
│  问题 2: MEV 攻击                                                │
│  ├── MEV 机器人看到你的大额交易                                  │
│  ├── 三明治攻击导致滑点损失                                      │
│  └── 估计每年数百万美元被 MEV 提取                               │
│                                                                 │
│  问题 3: 身份暴露                                                │
│  ├── 工资、收入公开                                              │
│  ├── 投资策略暴露                                                │
│  └── 可能导致安全风险                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心原理

### Privacy Pool 工作机制

Privacy Pool（隐私池）是整个系统的核心，其原理类似于"神秘储物柜房间"：

```
类比说明：

┌─────────────────────────────────────────────────────────────────┐
│                     神秘储物柜房间                               │
│                                                                 │
│   规则：                                                         │
│   1. 任何人可以往储物柜里放钱                                    │
│   2. 只有知道密码的人才能取走钱                                  │
│   3. 没人知道哪个储物柜是谁的                                    │
│   4. 每个储物柜只能取一次                                        │
│                                                                 │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│   │ 100 │ │ 100 │ │ 100 │ │ 100 │ │ 100 │ │ 100 │  ...        │
│   │ SOL │ │ SOL │ │ SOL │ │ SOL │ │ SOL │ │ SOL │             │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘             │
│                                                                 │
│   外人只能看到：有多少个储物柜                                   │
│   外人不知道：哪个柜子是谁存的，谁会来取哪个柜子                 │
└─────────────────────────────────────────────────────────────────┘
```

### 技术流程

#### 存款 (Deposit)

```
用户操作：
1. 生成两个随机数（只有用户知道）
   • secret = 随机密钥
   • nullifier = 防重复码

2. 计算承诺 (commitment)
   commitment = Hash(secret, nullifier)

3. 发送到链上
   • 转入资金
   • 记录 commitment 到 Merkle 树

链上记录：
✓ 某地址存了 X 金额
✓ commitment 被记录
✗ 没人知道 secret 和 nullifier
```

#### 提款 (Withdraw)

```
用户操作：
1. 用 secret + nullifier 生成 ZK 证明

   证明内容：
   "我知道 Merkle 树中某个 commitment 的原像
    但我不告诉你是哪一个"

2. 计算 nullifierHash = Hash(nullifier)

3. 提交到链上
   • ZK 证明
   • nullifierHash
   • 收款地址（可以是全新钱包）

链上验证：
✓ ZK 证明有效 → 确实有人存过钱
✓ nullifierHash 没用过 → 不是重复取款
✓ 转账到收款地址
✓ 记录 nullifierHash 已使用

结果：
✗ 无法知道对应哪个 commitment
✗ 无法知道是谁取的
✗ 无法关联存款地址和提款地址
```

### ZK 证明的作用

```
普通证明：
"我知道密码是 abc123" → 验证时密码暴露了

ZK 证明（零知识证明）：
"我知道密码，但我不告诉你密码是什么"
→ 通过数学挑战验证，密码不暴露

在隐私池里：
"我知道池子里某个存款的密钥，所以我能取走这笔钱
 但我不告诉你是哪一笔存款"
→ 合约相信你有权取钱，但不知道你是谁
```

### 匿名集 (Anonymity Set)

```
假设池子里有 100 个人各存了 100 SOL：

提款时，链上分析者看到：
• 有人提走了 100 SOL
• 可能来自 100 个存款中的任何一个
• 每个存款的概率 = 1%

池子越大，匿名性越强！
```

---

## 产品矩阵

### 产品全景

```
┌─────────────────────────────────────────────────────────────────┐
│                 Shadow Protocol 产品矩阵                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Shadow Swap │ │ Shadow Lend │ │Shadow Stake │ │Shadow NFT │ │
│  │   隐私交换   │ │   隐私借贷   │ │  隐私质押   │ │  隐私NFT  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Shadow Pay  │ │ Shadow Vote │ │Shadow Perps │ │  Shadow   │ │
│  │   隐私支付   │ │   匿名投票   │ │  隐私永续   │ │  Predict  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1. Shadow Swap - 隐私交换

**整合协议**: DFlow

**解决的问题**:
- 交易被追踪
- MEV 三明治攻击
- 策略暴露

**工作流程**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Shadow Swap 流程                             │
│                                                                 │
│  用户 Wallet A                                                   │
│       │                                                         │
│       │ ① 存入 100 SOL，获得凭证                                 │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  SOL Privacy Pool                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       │ ② 提交隐私交换请求 (ZK Proof + Swap Intent)             │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DFlow Auction                         │   │
│  │   做市商竞价 → 最优价格成交                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       │ ③ USDC 存入输出池                                       │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 USDC Privacy Pool                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       │ ④ 用户用新钱包提款                                      │
│       ▼                                                         │
│  用户 Wallet B (全新，无关联)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**为什么选择 DFlow 而非 Jupiter**:

| 特性 | Jupiter | DFlow |
|------|---------|-------|
| 价格发现 | 路由聚合 | 做市商竞价 |
| MEV 保护 | 有限 | 原生支持 |
| 隐私集成 | 需额外层 | 天然隔离 |
| 执行模型 | 直接 AMM | 拍卖成交 |

---

### 2. Shadow Stake - 隐私质押

**整合协议**: Marinade / JitoSOL / bSOL

**解决的问题**:
- 质押金额公开
- 收益可追踪
- 大户被盯上

**工作流程**:

```
① SOL ──► SOL Privacy Pool
② Privacy Pool ──► Marinade ──► mSOL
③ mSOL ──► mSOL Privacy Pool
④ 收益自动累积在池子里
⑤ 随时提款到新钱包
```

**使用场景**:
- 大户隐私理财
- 匿名获取质押收益
- DAO 财库隐私管理

---

### 3. Shadow Lend - 隐私借贷

**整合协议**: Marginfi / Kamino / Solend

**解决的问题**:
- 抵押品金额公开
- 借款金额公开
- 清算价格公开 → 被清算猎人狙击

**工作流程**:

```
存款: 通过隐私池存入抵押品
借款: 借出的钱进入另一个隐私池
还款: 从隐私池还款
取回: 抵押品进入隐私池，提款到新钱包

结果: 没人知道你的仓位大小和清算价格
```

**使用场景**:
- 大户借贷不想被跟踪
- 防止清算狙击
- 隐私杠杆操作

---

### 4. Shadow Pay - 隐私支付

**整合协议**: Solana Pay

**使用场景**:

#### 场景 1: 隐私商家支付
```
顾客 ──► Privacy Pool ──► 商家隐身地址

• 每次支付生成新的隐身地址
• 商家能收款，但不知道顾客是谁
• 顾客消费记录不被追踪
```

#### 场景 2: 隐私工资发放
```
公司 ──► Privacy Pool ──► 员工们各自提款

• 公司批量存入总工资
• 每个员工收到各自的凭证
• 员工提款到自己的钱包
• 没人知道谁拿了多少
```

---

### 5. Shadow Vote - 匿名投票

**整合协议**: Realms / Squads / SPL Governance

**解决的问题**:
- 投票公开 → 可被贿赂/胁迫
- 大户投票影响市场

**技术方案**:

```
使用 Semaphore 电路（群组成员证明）:

ZK 证明：
"我持有 X 个治理代币，我投了 YES/NO"
"但你不知道我是谁，也不知道我有多少代币"

投票结束后统一解密，公布结果
```

---

### 6. Shadow Perps - 隐私永续合约

**整合协议**: Drift / Jupiter Perps / Zeta

**解决的问题**:
- 仓位大小公开 → 被狙击
- 清算价格公开 → 清算猎人
- 交易策略暴露

**工作流程**:

```
① 用户存入保证金到 Privacy Pool
② 协议 PDA 开仓（链上显示是协议在交易）
③ 用户用 ZK 证明控制仓位（加仓/减仓/平仓）
④ 盈亏结算进入 Privacy Pool
⑤ 用户提款到新钱包

链上看到: 协议有很多仓位
看不到: 哪个用户控制哪个仓位
```

---

### 7. Shadow NFT - 隐私 NFT

**整合协议**: Magic Eden / Tensor

**解决的问题**:
- NFT 收藏公开
- 买卖记录可追踪
- 名人钱包被追踪

**方案 A: 隐私购买**
```
① SOL ──► Privacy Pool
② 用协议 PDA 购买 NFT
③ NFT 进入 "NFT 保险箱"（协议托管）
④ 用 ZK 证明所有权，随时转出
```

**方案 B: 隐身地址接收**
```
• 生成一次性隐身地址
• NFT 发送到隐身地址
• 只有持有私钥的人能找到这个 NFT
```

---

### 8. Shadow Airdrop - 隐私空投

**解决的问题**:
- 领空投暴露主钱包
- 多个钱包领空投会被关联

**技术方案**:

```
ZK 资格证明：
"我是空投白名单中的某个地址"
"但我不告诉你是哪个地址"
"请把空投发到这个新地址"

技术实现：
• 项目方发布白名单 Merkle Root
• 用户证明自己在 Merkle Tree 中
• 领取到新地址，防止关联
```

---

### 9. Shadow Identity - 隐私身份

**使用场景**:

| 场景 | 证明内容 | 不暴露 |
|------|----------|--------|
| 匿名 KYC | "我通过了 KYC 验证" | 姓名、国籍、身份证号 |
| 年龄验证 | "我年满 18 岁" | 出生日期、真实年龄 |
| 资产证明 | "我持有超过 100 SOL" | 具体金额、钱包地址 |

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shadow Protocol 技术栈                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  前端 (用户界面)                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React/Next.js                                           │   │
│  │  @solana/web3.js (钱包连接)                              │   │
│  │  snarkjs (浏览器内 ZK 证明生成)                          │   │
│  │  DFlow SDK (订单提交)                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  链上程序 (Zig Anchor)                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Privacy Pool                                            │   │
│  │  ├── Merkle Tree (存款记录)                              │   │
│  │  └── Nullifier Set (防双花)                              │   │
│  │                                                          │   │
│  │  Groth16 Verifier (ZK 证明验证)                          │   │
│  │  ├── 使用 bn254.zig 曲线操作                             │   │
│  │  └── 验证密钥编译时嵌入                                  │   │
│  │                                                          │   │
│  │  Protocol Adapters (CPI 适配器)                          │   │
│  │  ├── DFlow Adapter                                       │   │
│  │  ├── Marinade Adapter                                    │   │
│  │  ├── Marginfi Adapter                                    │   │
│  │  └── ...                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ZK 电路 (复用现有方案)                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Tornado Cash / Privacy.cash 电路                        │   │
│  │  ├── withdraw.circom (主电路)                            │   │
│  │  ├── merkleTree.circom (Merkle 证明)                     │   │
│  │  └── poseidon.circom (ZK-friendly hash)                  │   │
│  │                                                          │   │
│  │  预编译产物                                               │   │
│  │  ├── withdraw.wasm (WASM 证明生成)                       │   │
│  │  ├── withdraw.zkey (proving key)                         │   │
│  │  └── verification_key.json → Zig 常量                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心模块

#### Privacy Pool

```zig
pub fn PrivacyPool(comptime TokenType: type) type {
    return struct {
        pub const Config = struct {
            token_mint: sol.PublicKey,
            denominations: []const u64,  // 支持的金额档位
            merkle_depth: u8,            // 树深度，决定容量
        };

        /// 存款
        pub fn deposit(
            ctx: anchor.Context(DepositAccounts),
            amount: u64,
            commitment: [32]u8,
        ) !void {
            // 1. 转移代币到池子
            // 2. 添加 commitment 到 Merkle 树
            // 3. 发射事件
        }

        /// 提款
        pub fn withdraw(
            ctx: anchor.Context(WithdrawAccounts),
            proof: Groth16Proof,
            nullifier_hash: [32]u8,
            recipient: sol.PublicKey,
        ) !void {
            // 1. 验证 ZK 证明
            // 2. 检查 nullifier 未使用
            // 3. 记录 nullifier
            // 4. 转账给接收者
        }
    };
}
```

#### Groth16 Verifier

```zig
pub fn VerifyingKey(comptime num_public_inputs: usize) type {
    return struct {
        alpha: bn254.G1Point,
        beta: bn254.G2Point,
        gamma: bn254.G2Point,
        delta: bn254.G2Point,
        ic: [num_public_inputs + 1]bn254.G1Point,

        /// 验证 Groth16 证明
        pub fn verify(
            self: *const Self,
            proof: *const Proof,
            public_inputs: *const [num_public_inputs][32]u8,
        ) !bool {
            // 1. 计算 vk_x = IC[0] + Σ(IC[i+1] * input[i])
            // 2. Pairing check: e(-A,B) * e(α,β) * e(vk_x,γ) * e(C,δ) = 1
            // 3. 使用 bn254 syscall 高效验证
        }
    };
}
```

### Gas 费用处理

由于 Solana gas 费用极低（~$0.0001），采用 **协议补贴模式**：

```
方案: 协议 PDA 作为 fee payer

优势:
• 用户无需在新钱包预存 gas
• 完全隐私（无需从旧钱包转 gas）
• 费用从提款金额自动扣除

实现:
• 协议 Treasury 预存 SOL
• 每次提款扣除小额 gas 费（~0.00001 SOL）
• 协议收入补充 gas 基金
```

### 技术复用

```
核心库 (所有产品共用):
├── Privacy Pool
├── ZK Verifier
├── Merkle Tree
└── Nullifier Set

各产品只需添加:
├── 特定协议的 CPI 适配器
└── 定制化的前端 UI
```

---

## 实施路线图

### Phase 1: 核心基础 (4-6 周)

```
目标: 完成基础设施，支持 Shadow Swap

任务:
├── [ ] Privacy Pool 实现 (SOL/USDC/主流代币)
├── [ ] Groth16 Verifier (基于 bn254.zig)
├── [ ] verification_key.json → Zig 转换器
├── [ ] Merkle Tree 账户结构
├── [ ] Nullifier Set 管理
├── [ ] DFlow CPI 适配器
├── [ ] 基础测试
└── [ ] Devnet 部署

产出: Shadow Swap MVP
```

### Phase 2: 收益类产品 (3-4 周)

```
目标: 扩展到质押和支付场景

任务:
├── [ ] Shadow Stake
│   ├── Marinade CPI 适配器
│   ├── JitoSOL CPI 适配器
│   └── mSOL/JitoSOL Privacy Pool
│
├── [ ] Shadow Pay (基础版)
│   ├── 隐私转账
│   └── 批量存款 (工资发放)
│
└── [ ] 前端 UI
    ├── 钱包连接
    ├── 存款/提款界面
    ├── snarkjs 集成
    └── 凭证管理
```

### Phase 3: 高级 DeFi (4-6 周)

```
目标: 覆盖借贷和衍生品

任务:
├── [ ] Shadow Lend
│   ├── Marginfi CPI 适配器
│   ├── 抵押品隐私存入
│   └── 借款隐私输出
│
└── [ ] Shadow Perps
    ├── Drift CPI 适配器
    ├── 仓位代理管理
    └── 盈亏隐私结算
```

### Phase 4: 社交/治理 (2-3 周)

```
目标: 扩展到非金融场景

任务:
├── [ ] Shadow Vote
│   ├── Semaphore 电路集成
│   └── Realms CPI 适配器
│
├── [ ] Shadow Airdrop
│   └── 白名单 Merkle 证明
│
└── [ ] Shadow Identity
    └── 选择性披露证明
```

### Phase 5: 安全与发布 (2-3 周)

```
任务:
├── [ ] 安全审计
├── [ ] Bug Bounty 计划
├── [ ] Mainnet 部署
├── [ ] 文档完善
└── [ ] 社区建设
```

---

## 商业模式

### 收入来源

| 来源 | 描述 | 费率 |
|------|------|------|
| **协议费** | 每次隐私操作收取费用 | 0.1-0.3% |
| **质押收益分成** | Shadow Stake 收益提成 | 5-10% |
| **企业订阅** | Shadow Pay 企业版 | $500/月 |
| **高级功能** | 更高额度、优先提款、API | 按需定价 |

### 市场规模估算

```
Solana DeFi TVL: ~$5B
假设 5% 流量经过隐私层: $250M
0.2% 协议费: $500K/年

企业订阅:
100 家 × $500/月 = $600K/年

总潜在收入: ~$1.1M/年 (保守估计)
```

---

## 产品优先级

| 优先级 | 产品 | 整合协议 | 价值主张 |
|--------|------|----------|----------|
| ⭐⭐⭐ | Shadow Swap | DFlow | 隐私 + MEV保护 + 最优价格 |
| ⭐⭐⭐ | Shadow Stake | Marinade/Jito | 隐私理财，大户首选 |
| ⭐⭐⭐ | Shadow Pay | Solana Pay | 隐私工资/支付 |
| ⭐⭐ | Shadow Lend | Marginfi | 防清算狙击 |
| ⭐⭐ | Shadow Perps | Drift | 隐藏交易策略 |
| ⭐ | Shadow Vote | Realms | 匿名治理 |
| ⭐ | Shadow NFT | Magic Eden | 名人隐私收藏 |

---

## 相关资源

### 参考实现

- [Tornado Cash Circuits](https://github.com/tornadocash/tornado-core) - ZK 电路
- [Privacy.cash](https://github.com/Privacy-Cash/privacy-cash) - Solana 隐私池
- [Light Protocol Groth16](https://github.com/Lightprotocol/groth16-solana) - Groth16 验证器
- [DFlow Protocol](https://dflow.net/) - 订单流拍卖

### 内部文档

- [ANCHOR_COMPATIBILITY.md](./ANCHOR_COMPATIBILITY.md) - Anchor 兼容性
- [bn254.zig](../src/bn254.zig) - BN254 曲线操作
- [mcl.zig](../src/mcl.zig) - MCL 库绑定

---

## 附录: ZK 电路复用说明

### 不需要重新设计电路

```
我们复用的部分 (已有，直接用):
├── withdraw.circom (主电路)
├── merkleTree.circom (Merkle 证明)
├── poseidon.circom (ZK-friendly hash)
├── Trusted Setup (Powers of Tau)
└── snarkjs 工具链

我们需要实现的部分:
├── Zig Groth16 Verifier (验证证明)
├── Merkle Tree 账户结构 (链上状态)
├── Nullifier Set 管理 (防双花)
├── CPI 适配器 (协议集成)
└── 前端 SDK (用户界面)
```

### 电路编译流程

```bash
# 1. 获取 Tornado Cash 电路
git clone https://github.com/tornadocash/tornado-core
cd tornado-core/circuits

# 2. 编译电路
circom withdraw.circom --r1cs --wasm --sym

# 3. Trusted Setup
snarkjs groth16 setup withdraw.r1cs pot12_final.ptau withdraw_0000.zkey
snarkjs zkey contribute withdraw_0000.zkey withdraw_final.zkey

# 4. 导出验证密钥
snarkjs zkey export verificationkey withdraw_final.zkey verification_key.json

# 5. 转换为 Zig 常量 (我们提供工具)
./vk2zig verification_key.json > verifying_key.zig
```
