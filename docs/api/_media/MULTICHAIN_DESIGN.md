# Px402 多链扩展设计

> 设计目标：解耦链特定实现，支持未来多链扩展

## 当前绑定点分析

### Solana 强绑定项

| 组件 | 绑定内容 | 解耦难度 |
|------|---------|---------|
| **Privacy Cash SDK** | Solana 程序调用 | 中 |
| **Token 标准** | SPL Token / Token2022 | 中 |
| **交易结构** | Solana Transaction | 高 |
| **钱包** | Keypair / PublicKey | 低 |
| **RPC** | Solana JSON-RPC | 低 |

---

## 抽象层设计

### 核心接口

```typescript
/**
 * 隐私支付提供者接口
 * 所有链的隐私实现必须符合此接口
 */
interface PrivacyProvider {
  // 链标识
  readonly chainId: ChainId;

  // ============ 资金池操作 ============

  /**
   * 存款到隐私池
   * @returns 存款凭证（用于后续提款）
   */
  deposit(params: DepositParams): Promise<DepositNote>;

  /**
   * 从隐私池提款
   * @param note 存款凭证
   * @param recipient 收款地址（一次性地址）
   */
  withdraw(params: WithdrawParams): Promise<WithdrawResult>;

  /**
   * 查询隐私余额
   */
  getPrivateBalance(token: TokenId): Promise<bigint>;

  // ============ 证明生成 ============

  /**
   * 生成支付证明（用于 x402 验证）
   */
  generatePaymentProof(params: ProofParams): Promise<PaymentProof>;

  /**
   * 验证支付证明
   */
  verifyPaymentProof(proof: PaymentProof): Promise<boolean>;

  // ============ 地址管理 ============

  /**
   * 生成一次性收款地址
   */
  generateStealthAddress(): Promise<StealthAddress>;

  /**
   * 扫描属于自己的隐身地址
   */
  scanStealthAddresses(viewKey: ViewKey): Promise<StealthAddress[]>;
}

// ============ 通用类型定义 ============

type ChainId =
  | 'solana'
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'polygon';

interface DepositParams {
  token: TokenId;
  amount: bigint;
  // 链特定参数通过 extra 传递
  extra?: Record<string, unknown>;
}

interface DepositNote {
  chainId: ChainId;
  poolAddress: string;
  commitment: string;      // hex
  nullifier: string;       // hex (私密，不上链)
  secret: string;          // hex (私密，不上链)
  leafIndex: number;
  amount: bigint;
  token: TokenId;
  timestamp: number;
}

interface WithdrawParams {
  note: DepositNote;
  recipient: string;       // 收款地址
  relayer?: RelayerConfig; // 可选中继器
}

interface WithdrawResult {
  txHash: string;
  nullifierHash: string;   // 已使用的 nullifier
  recipient: string;
}

interface PaymentProof {
  chainId: ChainId;
  proofType: 'groth16' | 'plonk' | 'stark';
  proof: string;           // hex encoded
  publicInputs: string[];  // hex encoded
  metadata: {
    amount: bigint;
    token: TokenId;
    timestamp: number;
    // 不包含发送者/接收者信息
  };
}

interface StealthAddress {
  address: string;
  ephemeralPubKey: string;
  viewTag?: string;        // 快速扫描优化
}
```

---

## 链特定实现

### 1. Solana 实现 (当前)

```typescript
class SolanaPrivacyProvider implements PrivacyProvider {
  readonly chainId = 'solana' as const;

  private privacyCashSdk: PrivacyCashSDK;

  constructor(config: SolanaConfig) {
    this.privacyCashSdk = new PrivacyCashSDK(config);
  }

  async deposit(params: DepositParams): Promise<DepositNote> {
    // 调用 Privacy Cash SDK
    if (params.token === 'SOL') {
      return await this.privacyCashSdk.deposit(params.amount);
    } else {
      return await this.privacyCashSdk.depositSPL(
        params.token,
        params.amount
      );
    }
  }

  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    return await this.privacyCashSdk.withdraw(
      params.note,
      params.recipient,
      params.relayer
    );
  }

  async generatePaymentProof(params: ProofParams): Promise<PaymentProof> {
    // 使用 snarkjs 生成 Groth16 证明
    const { proof, publicSignals } = await groth16.fullProve(
      params.input,
      WASM_PATH,
      ZKEY_PATH
    );

    return {
      chainId: 'solana',
      proofType: 'groth16',
      proof: serializeProof(proof),
      publicInputs: publicSignals,
      metadata: {
        amount: params.amount,
        token: params.token,
        timestamp: Date.now(),
      },
    };
  }

  // ... 其他方法实现
}
```

### 2. EVM 实现 (未来)

```typescript
class EVMPrivacyProvider implements PrivacyProvider {
  readonly chainId: ChainId;

  // 可选择不同的隐私协议
  private backend:
    | PrivacyPoolsBackend    // 0xbow Privacy Pools
    | RailgunBackend         // RAILGUN
    | TornadoForkBackend;    // Tornado Cash forks

  constructor(config: EVMConfig) {
    this.chainId = config.chainId;
    this.backend = this.selectBackend(config.privacyProtocol);
  }

  private selectBackend(protocol: string) {
    switch (protocol) {
      case 'privacy-pools':
        return new PrivacyPoolsBackend();  // 合规友好
      case 'railgun':
        return new RailgunBackend();       // 专业交易者
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  async deposit(params: DepositParams): Promise<DepositNote> {
    return await this.backend.deposit(params);
  }

  // ... 委托给 backend
}
```

### 3. 跨链实现 (远期)

```typescript
class CrossChainPrivacyProvider implements PrivacyProvider {
  readonly chainId = 'cross-chain' as const;

  private providers: Map<ChainId, PrivacyProvider>;
  private bridgeAdapter: CrossChainBridge;

  /**
   * 跨链隐私转账
   *
   * 流程:
   * 1. 源链提款到中继地址
   * 2. 通过桥转移到目标链
   * 3. 目标链存入隐私池
   * 4. 生成跨链证明
   */
  async crossChainTransfer(params: {
    sourceChain: ChainId;
    targetChain: ChainId;
    note: DepositNote;
    recipient: string;
  }): Promise<CrossChainResult> {
    // 实现跨链隐私转账逻辑
  }
}
```

---

## 各链隐私方案对比

### EVM 生态

| 协议 | 技术 | 合规性 | 状态 | 适用场景 |
|------|------|--------|------|---------|
| **Privacy Pools** (0xbow) | zk-SNARKs + ASP | ✅ 合规友好 | 生产 | 首选方案 |
| **RAILGUN** | zk-SNARKs | ⚠️ 中等 | 生产 | 专业交易 |
| **Cyclone** | zk-SNARKs | ❌ 较低 | 生产 | 多链支持 |

### Solana 生态

| 协议 | 技术 | 合规性 | 状态 | 适用场景 |
|------|------|--------|------|---------|
| **Privacy Cash** | Groth16 | ⚠️ 中等 | 生产 | 当前方案 |
| **Confidential Balances** | 同态加密 + ZKP | ✅ 官方 | 开发中 | 未来迁移 |
| **NOCtura** | Groth16/PLONK | ✅ 合规友好 | 开发中 | 备选方案 |

### 跨链方案

| 协议 | 覆盖链 | 技术 | 状态 |
|------|--------|------|------|
| **COTI** | 70+ 链 | Garbled Circuits | 生产 |
| **Dust Protocol** | Multi-chain | zk-SNARKs | 生产 |

---

## SDK 架构

```
@px402/sdk
├── core/                      # 链无关核心逻辑
│   ├── types.ts              # 通用类型定义
│   ├── proof.ts              # 证明序列化/验证
│   └── note.ts               # 凭证管理
│
├── providers/                 # 链特定实现
│   ├── solana/
│   │   ├── index.ts
│   │   └── privacy-cash.ts   # Privacy Cash 适配
│   │
│   ├── evm/
│   │   ├── index.ts
│   │   ├── privacy-pools.ts  # 0xbow 适配
│   │   └── railgun.ts        # RAILGUN 适配
│   │
│   └── cross-chain/
│       └── index.ts          # 跨链桥接
│
├── x402/                      # x402 协议集成
│   ├── scheme.ts             # PrivacyCashScheme
│   ├── client.ts             # Px402Client
│   └── server.ts             # Px402Server
│
└── index.ts                   # 统一导出
```

---

## 使用示例

### 链无关 API

```typescript
import { Px402Client, createProvider } from '@px402/sdk';

// 自动检测或手动指定链
const provider = createProvider({
  chain: 'solana',                    // 或 'ethereum', 'base' 等
  privacyProtocol: 'privacy-cash',    // 链特定协议
  rpcUrl: 'https://api.mainnet-beta.solana.com',
});

const client = new Px402Client({
  provider,
  defaultMode: 'private',
});

// 统一的 API，底层自动适配不同链
const response = await client.fetch('https://api.agent-b.ai/inference', {
  method: 'POST',
  body: JSON.stringify({ prompt: '...' }),
  payment: {
    maxAmount: '0.01',
    token: 'USDC',    // 自动映射到链特定代币
  },
});
```

### 多链配置

```typescript
const multiChainClient = new Px402Client({
  providers: {
    solana: createProvider({ chain: 'solana', ... }),
    base: createProvider({ chain: 'base', ... }),
  },
  // 根据收款方自动选择链
  chainSelector: (paymentRequest) => {
    return paymentRequest.acceptedChains[0];
  },
});
```

---

## 迁移路径

### Phase 1: Solana MVP (当前)

```
Privacy Cash SDK → SolanaPrivacyProvider → Px402Client
```

- 专注 Solana 生态
- 验证核心概念
- 建立用户基础

### Phase 2: EVM 扩展

```
Privacy Pools (0xbow) → EVMPrivacyProvider → Px402Client
```

- 优先 Base（x402 主要生态）
- 合规友好方案
- 复用 x402 现有基础设施

### Phase 3: 多链统一

```
┌─────────────────────────────────────────────────┐
│                  Px402Client                    │
├─────────────────────────────────────────────────┤
│         PrivacyProvider Interface              │
├──────────┬──────────┬──────────┬───────────────┤
│ Solana   │ Base     │ Ethereum │ Cross-chain   │
│ Privacy  │ Privacy  │ RAILGUN  │ Bridge        │
│ Cash     │ Pools    │          │               │
└──────────┴──────────┴──────────┴───────────────┘
```

---

## 设计原则

### 1. 接口优先

- 先定义 `PrivacyProvider` 接口
- 具体实现可替换
- 新链只需实现接口

### 2. 链特定逻辑隔离

```typescript
// ❌ 不要这样
if (chain === 'solana') {
  // Solana 逻辑
} else if (chain === 'ethereum') {
  // EVM 逻辑
}

// ✅ 应该这样
const provider = providers.get(chain);
await provider.deposit(params);  // 多态调用
```

### 3. 凭证格式统一

```typescript
// 所有链的凭证都使用统一格式
interface DepositNote {
  chainId: ChainId;        // 标识来源链
  // ... 通用字段
  chainSpecific?: unknown; // 链特定扩展
}
```

### 4. 证明系统抽象

```typescript
// 支持不同的 ZK 证明系统
type ProofSystem = 'groth16' | 'plonk' | 'stark';

interface PaymentProof {
  proofType: ProofSystem;
  proof: string;  // 统一序列化格式
}
```

---

## 参考资源

### EVM 隐私协议
- [Privacy Pools (0xbow)](https://www.theblock.co/post/348959/0xbow-privacy-pools-new-cypherpunk-tool-inspired-research-ethereum-founder-vitalik-buterin)
- [RAILGUN](https://www.railgun.org/)
- [Vitalik Privacy Pools Paper](https://www.theblock.co/amp/post/249487/vitalik-buterin-co-authors-paper-on-regulation-friendly-tornado-cash-alternative)

### Solana 隐私协议
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)
- [Solana Confidential Balances](https://www.blocmates.com/news-posts/solana-goes-private-new-zk-tools-let-you-hide-transfers-without-breaking-the-rules)
- [NOCtura](https://bitcoinethereumnews.com/finance/noctura-targets-compliance-ready-privacy-on-solana-with-zk-shield-and-dual-mode-wallet/)

### 跨链隐私
- [COTI Cross-chain Privacy](https://coti.io/)
- [Dust Protocol](https://solanacompass.com/projects/category/research/zk-proofs)
