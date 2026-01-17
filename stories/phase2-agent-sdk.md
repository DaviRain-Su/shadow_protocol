# Story: Phase 2 - Agent SDK

> 实现 Agent 客户端和服务端 SDK，支持双模式支付

## 目标

1. 实现 `@px402/client` - Agent 客户端 SDK
2. 实现 `@px402/server` - 服务端中间件
3. 双模式支付 (public/private)
4. 示例项目

---

## 技术决策

### 包结构

```
packages/
├── core/                    # @px402/core (Phase 1 ✅)
├── solana/                  # @px402/solana (Phase 1 ✅)
├── client/                  # @px402/client - 客户端 SDK
│   ├── src/
│   │   ├── client.ts       # Px402Client 主类
│   │   ├── http.ts         # HTTP 402 处理
│   │   ├── types.ts        # 类型定义
│   │   └── index.ts
│   └── package.json
│
├── server/                  # @px402/server - 服务端 SDK
│   ├── src/
│   │   ├── middleware.ts   # Express/通用中间件
│   │   ├── verifier.ts     # 支付验证器
│   │   ├── types.ts        # 类型定义
│   │   └── index.ts
│   └── package.json
│
└── examples/               # 示例项目
    └── basic/
        ├── client.ts       # 客户端示例
        ├── server.ts       # 服务端示例
        └── demo.ts         # 内存演示
```

### API 设计

#### 客户端 API

```typescript
import { Px402Client } from '@px402/client';
import { SolanaPrivacyProvider } from '@px402/solana';

const provider = new SolanaPrivacyProvider({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: myKeypair,
});

const client = new Px402Client({
  provider,
  defaultMode: 'private', // 'public' | 'private'
});

// 自动处理 402 支付
const response = await client.fetch('https://api.example.com/data', {
  payment: {
    maxAmount: '1000000', // lamports
    token: 'SOL',
  },
});
```

#### 服务端 API

```typescript
import express from 'express';
import { px402Middleware, requirePayment } from '@px402/server';
import { PrivateCashScheme } from '@px402/solana';

const app = express();

// 全局中间件
app.use(px402Middleware({
  schemes: [new PrivateCashScheme(config)],
}));

// 路由级别收费
app.get('/api/data', requirePayment({
  amount: '1000000',
  token: 'SOL',
  recipient: 'MyWalletAddress',
}), (req, res) => {
  res.json({ data: 'premium content' });
});
```

---

## 实现计划

### Step 1: @px402/client 包初始化

**文件**: `packages/client/package.json`, `packages/client/tsconfig.json`

**验收标准**:
- [x] 包结构创建完成
- [x] 依赖配置正确

---

### Step 2: Px402Client 核心类

**文件**: `packages/client/src/client.ts`

**验收标准**:
- [x] Px402Client 类实现完整
- [x] 支持 public/private 模式
- [x] 自动处理 402 响应

---

### Step 3: HTTP 402 处理逻辑

**文件**: `packages/client/src/http.ts`

**验收标准**:
- [x] 正确解析 402 响应头
- [x] 正确构造支付 header
- [x] 支持重试逻辑

---

### Step 4: @px402/server 包初始化

**文件**: `packages/server/package.json`, `packages/server/tsconfig.json`

**验收标准**:
- [x] 包结构创建完成
- [x] 依赖配置正确

---

### Step 5: 支付验证器

**文件**: `packages/server/src/verifier.ts`

**验收标准**:
- [x] 支付验证逻辑正确
- [x] 支持多种 scheme
- [x] 错误处理完善

---

### Step 6: 服务端中间件

**文件**: `packages/server/src/middleware.ts`

**验收标准**:
- [x] Express 中间件工作正常
- [x] 402 响应格式正确
- [x] 支付验证集成

---

### Step 7: 示例项目

**文件**: `examples/basic/`

**验收标准**:
- [x] 客户端示例可运行
- [x] 服务端示例可运行
- [x] 端到端流程正确

---

### Step 8: 单元测试

**验收标准**:
- [x] Client 测试 (31 tests)
- [x] Server 测试 (31 tests)
- [x] 集成测试
- [x] 测试覆盖率 > 80%

---

## 验收标准汇总

### 功能验收

- [x] `@px402/client` 包构建成功
- [x] `@px402/server` 包构建成功
- [x] Px402Client 自动处理 402 支付
- [x] 服务端中间件正确验证支付
- [x] 双模式 (public/private) 工作正常
- [x] 示例项目可运行

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

**@px402/client (31 tests)**
- `types.ts` - 客户端类型定义 (PaymentMode, PaymentOptions, Px402RequestInit)
- `http.ts` - HTTP 402 处理 (parsePaymentRequirements, createPaymentHeader, is402Response)
- `client.ts` - Px402Client 主类 (自动 402 支付处理)

**@px402/server (31 tests)**
- `types.ts` - 服务端类型定义 (ExpressHandler, RequirePaymentOptions)
- `verifier.ts` - PaymentVerifier (支付验证器)
- `middleware.ts` - Express 中间件 (px402Middleware, requirePayment, send402Response)

**examples/basic**
- `server.ts` - Express 服务端示例
- `client.ts` - Px402Client 客户端示例
- `demo.ts` - 内存演示脚本

**测试覆盖**
- HTTP 工具测试 (19)
- Client 测试 (12)
- Verifier 测试 (17)
- Middleware 测试 (14)
- 总计: 62 new tests (141 total)
