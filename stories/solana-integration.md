# Story: Solana End-to-End Integration

> 打通 Solana 端到端支付流程，修复安全漏洞

## 目标

1. 修复支付验证安全漏洞
2. 添加 Nullifier 注册表防止双花
3. 集成 RelayTransport 到客户端
4. 创建完整的端到端测试

---

## 问题分析

### 当前状态

```
Client (Px402Client)        Server (middleware)      Chain (Solana)
       │                           │                        │
       ├─ fetch() ─────────────────▶│                        │
       │◀── 402 PaymentRequirements ┤                        │
       │                           │                        │
       ├─ generatePaymentProof() ──────────────────────────▶│
       │◀───── txHash ─────────────────────────────────────┤
       │                           │                        │
       ├─ fetch() + X-Payment ─────▶│                        │
       │                           ├─ verify() ────────────▶│
       │                           │◀─ tx exists ──────────┤
       │◀── 200 OK ────────────────┤                        │
```

### 安全漏洞

| 问题 | 严重性 | 影响 |
|-----|--------|-----|
| 无 Nullifier 追踪 | 🔴 严重 | 可双花攻击 |
| 未验证接收方 | 🔴 严重 | 资金可能发送到错误地址 |
| 未解析交易指令 | 🟡 中等 | 无法确认是 Privacy Cash 提款 |
| Relay 未集成 | 🟡 中等 | 无 IP 隐私保护 |

---

## 实现计划

### Step 1: NullifierRegistry

**文件**: `packages/server/src/nullifier.ts`

创建 Nullifier 注册表防止双花:

```typescript
interface NullifierRegistry {
  register(nullifier: string): Promise<boolean>; // false if already exists
  isUsed(nullifier: string): Promise<boolean>;
  getUsageInfo(nullifier: string): Promise<NullifierInfo | null>;
}
```

**验收标准**:
- [x] NullifierRegistry 接口定义
- [x] MemoryNullifierRegistry 实现
- [x] 支持过期清理
- [x] 单元测试 (14 tests)

---

### Step 2: 修复 PrivateCashScheme 验证

**文件**: `packages/solana/src/scheme.ts`

修复 verifyPayment():
1. 验证接收方地址
2. 检查 Nullifier 是否已使用
3. 解析交易指令确认是 Privacy Cash 提款

**验收标准**:
- [x] 验证接收方地址匹配
- [x] Nullifier 双花检查
- [x] 交易金额验证
- [x] 单元测试

---

### Step 3: 集成 RelayTransport

**文件**: `packages/client/src/client.ts`

添加可选的 Relay 传输支持:

```typescript
const client = new Px402Client({
  provider,
  transport: new RelayTransport({
    relayNodes: ['relay1.px402.network:8402'],
    hops: 3,
  }),
});
```

**验收标准**:
- [x] 客户端支持 Transport 接口
- [x] RelayTransport 可选配置
- [x] 通过 Relay 发送支付 (transport routing)
- [x] 单元测试

---

### Step 4: 端到端集成测试

**文件**: `packages/solana/src/__tests__/integration.test.ts`

创建完整的端到端测试:
1. 客户端发起请求
2. 服务端返回 402
3. 客户端创建支付
4. 服务端验证支付
5. 返回内容

**验收标准**:
- [x] 完整流程测试 (19 tests)
- [x] Mock 场景测试
- [x] 错误处理测试 (insufficient amount, wrong token, wrong scheme)
- [x] Transport 集成测试

---

### Step 5: Relayer Fee Support (Bonus)

**文件**: `packages/solana/src/scheme.ts`, `packages/core/src/provider.ts`

添加中继器费用支持:
- 默认 relayer 配置
- requirements.extra 中继器覆盖
- 费用计算和包含在支付中

**验收标准**:
- [x] SchemeRelayerConfig 配置
- [x] 通过 requirements.extra 覆盖
- [x] 费用包含在支付载荷中
- [x] 单元测试 (4 tests)

---

## 完成状态

- Start date: 2026-01-17
- Completion date: 2026-01-17
- Status: ✅ Complete

## 测试统计

| Package | Tests |
|---------|-------|
| @px402/core | 51 |
| @px402/server | 45 |
| @px402/client | 31 |
| @px402/solana | 47 |
| @px402/relay | 125 |
| **Total** | **299** |
