# Shadow Protocol - 技术实现指南

本文档提供 Shadow Protocol 的详细技术实现规范。

## 目录

- [核心数据结构](#核心数据结构)
- [Groth16 Verifier 实现](#groth16-verifier-实现)
- [Privacy Pool 实现](#privacy-pool-实现)
- [CPI 适配器](#cpi-适配器)
- [前端集成](#前端集成)
- [安全考虑](#安全考虑)

---

## 核心数据结构

### Merkle Tree

用于存储所有存款的 commitment。

```zig
//! Merkle Tree for Privacy Pool
//!
//! 深度 20 = 支持 2^20 = 1,048,576 笔存款

const std = @import("std");
const anchor = @import("sol_anchor_zig");
const sol = anchor.sdk;

pub const MERKLE_DEPTH: u8 = 20;
pub const MERKLE_CAPACITY: u32 = 1 << MERKLE_DEPTH;

/// 预计算的零值 (每层的默认哈希)
pub const ZERO_VALUES: [MERKLE_DEPTH + 1][32]u8 = comptime blk: {
    var zeros: [MERKLE_DEPTH + 1][32]u8 = undefined;
    zeros[0] = [_]u8{0} ** 32;  // 叶子零值
    for (1..MERKLE_DEPTH + 1) |i| {
        zeros[i] = poseidonHash2(zeros[i-1], zeros[i-1]);
    }
    break :blk zeros;
};

pub const MerkleTree = struct {
    /// 当前根哈希
    root: [32]u8,

    /// 下一个叶子索引
    next_index: u32,

    /// 每层最后填充的节点 (用于增量更新)
    filled_subtrees: [MERKLE_DEPTH][32]u8,

    /// 历史根 (用于验证旧的存款)
    /// 保留最近 100 个根
    roots_history: [100][32]u8,
    roots_history_index: u8,

    const Self = @This();

    /// 初始化空树
    pub fn init() Self {
        var tree = Self{
            .root = ZERO_VALUES[MERKLE_DEPTH],
            .next_index = 0,
            .filled_subtrees = undefined,
            .roots_history = undefined,
            .roots_history_index = 0,
        };

        // 初始化 filled_subtrees 为零值
        inline for (0..MERKLE_DEPTH) |i| {
            tree.filled_subtrees[i] = ZERO_VALUES[i];
        }

        return tree;
    }

    /// 插入新叶子
    pub fn insert(self: *Self, leaf: [32]u8) !u32 {
        if (self.next_index >= MERKLE_CAPACITY) {
            return error.MerkleTreeFull;
        }

        const leaf_index = self.next_index;
        var current_hash = leaf;
        var current_index = leaf_index;

        // 从叶子向上更新路径
        inline for (0..MERKLE_DEPTH) |level| {
            const is_left = current_index % 2 == 0;

            if (is_left) {
                // 左节点：保存当前值，与零值配对
                self.filled_subtrees[level] = current_hash;
                current_hash = poseidonHash2(current_hash, ZERO_VALUES[level]);
            } else {
                // 右节点：与保存的左兄弟配对
                current_hash = poseidonHash2(self.filled_subtrees[level], current_hash);
            }

            current_index /= 2;
        }

        // 更新根
        self.root = current_hash;

        // 保存到历史
        self.roots_history[self.roots_history_index] = current_hash;
        self.roots_history_index = (self.roots_history_index + 1) % 100;

        self.next_index += 1;

        return leaf_index;
    }

    /// 检查根是否有效 (当前或历史)
    pub fn isKnownRoot(self: *const Self, root: [32]u8) bool {
        if (std.mem.eql(u8, &root, &self.root)) {
            return true;
        }

        for (self.roots_history) |hist_root| {
            if (std.mem.eql(u8, &root, &hist_root)) {
                return true;
            }
        }

        return false;
    }
};

/// Poseidon 哈希 (ZK-friendly)
fn poseidonHash2(left: [32]u8, right: [32]u8) [32]u8 {
    // 实际实现需要 Poseidon 库
    // 这里使用 Solana 的 syscall 或 Poseidon Zig 实现
    var input: [64]u8 = undefined;
    @memcpy(input[0..32], &left);
    @memcpy(input[32..64], &right);
    return sol.hash.poseidon(&input);
}
```

### Nullifier Set

防止双花的核心数据结构。

```zig
//! Nullifier Set - 防止重复提款
//!
//! 使用 Bloom Filter + Sparse Merkle Tree 组合
//! - Bloom Filter: 快速检查 (O(1))
//! - SMT: 确定性验证

pub const NullifierSet = struct {
    /// Bloom Filter (快速查找)
    bloom_filter: [1024]u64,

    /// 已使用的 nullifier 数量
    count: u64,

    const Self = @This();

    pub fn init() Self {
        return .{
            .bloom_filter = [_]u64{0} ** 1024,
            .count = 0,
        };
    }

    /// 检查 nullifier 是否已使用
    pub fn contains(self: *const Self, nullifier_hash: [32]u8) bool {
        const indices = computeBloomIndices(nullifier_hash);

        for (indices) |idx| {
            const word_idx = idx / 64;
            const bit_idx: u6 = @truncate(idx % 64);
            if ((self.bloom_filter[word_idx] & (@as(u64, 1) << bit_idx)) == 0) {
                return false;
            }
        }

        return true;  // 可能存在 (需要二次确认)
    }

    /// 插入 nullifier
    pub fn insert(self: *Self, nullifier_hash: [32]u8) !void {
        if (self.contains(nullifier_hash)) {
            return error.NullifierAlreadyUsed;
        }

        const indices = computeBloomIndices(nullifier_hash);

        for (indices) |idx| {
            const word_idx = idx / 64;
            const bit_idx: u6 = @truncate(idx % 64);
            self.bloom_filter[word_idx] |= (@as(u64, 1) << bit_idx);
        }

        self.count += 1;
    }

    fn computeBloomIndices(hash: [32]u8) [8]u16 {
        var indices: [8]u16 = undefined;
        for (0..8) |i| {
            const offset = i * 4;
            indices[i] = std.mem.readInt(u16, hash[offset..][0..2], .little) % (1024 * 64);
        }
        return indices;
    }
};
```

---

## Groth16 Verifier 实现

### 验证密钥结构

```zig
//! Groth16 Verifying Key
//!
//! 从 snarkjs 导出的 verification_key.json 转换而来
//! 所有点都是编译时常量，不占用链上存储

const bn254 = @import("bn254.zig");

/// Tornado Cash withdraw 电路的验证密钥
/// Public inputs: root, nullifierHash, recipient, relayer, fee (5 个)
pub const WithdrawVerifyingKey = struct {
    pub const NUM_PUBLIC_INPUTS = 5;

    /// Alpha point (G1)
    pub const alpha: bn254.G1Point = comptime parseG1(
        "20491192805390485299153009773594534940189261866228447918068658471970481763042",
        "9383485363053290200918347156157836566562967994039712273449902621266178545958",
    );

    /// Beta point (G2)
    pub const beta: bn254.G2Point = comptime parseG2(
        // x0, x1, y0, y1 coordinates
        "6375614351688725206403948262868962793625744043794305715222011528459656738731",
        "4252822878758300859123897981450591353533073413197771768651442665752259397132",
        "10505242626370262277552901082094356697409835680220590971873171140371331206856",
        "21847035105528745403288232691147584728191162732299865338377159692350059136679",
    );

    /// Gamma point (G2)
    pub const gamma: bn254.G2Point = comptime parseG2(
        "10857046999023057135944570762232829481370756359578518086990519993285655852781",
        "11559732032986387107991004021392285783925812861821192530917403151452391805634",
        "8495653923123431417604973247489272438418190587263600148770280649306958101930",
        "4082367875863433681332203403145435568316851327593401208105741076214120093531",
    );

    /// Delta point (G2)
    pub const delta: bn254.G2Point = comptime parseG2(
        // ... delta coordinates from verification_key.json
    );

    /// IC points (G1) - NUM_PUBLIC_INPUTS + 1 个点
    pub const ic: [NUM_PUBLIC_INPUTS + 1]bn254.G1Point = .{
        comptime parseG1("...", "..."),  // IC[0]
        comptime parseG1("...", "..."),  // IC[1]
        comptime parseG1("...", "..."),  // IC[2]
        comptime parseG1("...", "..."),  // IC[3]
        comptime parseG1("...", "..."),  // IC[4]
        comptime parseG1("...", "..."),  // IC[5]
    };
};
```

### 验证逻辑

```zig
//! Groth16 Verification
//!
//! 验证等式: e(A, B) = e(α, β) · e(vk_x, γ) · e(C, δ)
//! 使用 Solana bn254 syscall，消耗 < 200k CU

pub const Groth16Proof = struct {
    a: bn254.G1Point,  // π_A
    b: bn254.G2Point,  // π_B
    c: bn254.G1Point,  // π_C

    /// 从 bytes 解析 (snarkjs 格式)
    pub fn fromBytes(bytes: []const u8) !Groth16Proof {
        if (bytes.len != 256) return error.InvalidProofSize;
        return .{
            .a = try bn254.G1Point.fromBE(bytes[0..64]),
            .b = bn254.G2Point.new(bytes[64..192].*),
            .c = try bn254.G1Point.fromBE(bytes[192..256]),
        };
    }
};

pub fn verify(
    comptime VK: type,
    proof: *const Groth16Proof,
    public_inputs: *const [VK.NUM_PUBLIC_INPUTS][32]u8,
) !bool {
    // 1. 计算 vk_x = IC[0] + Σ(IC[i+1] * input[i])
    var vk_x = VK.ic[0];

    inline for (0..VK.NUM_PUBLIC_INPUTS) |i| {
        const term = try bn254.mulG1Scalar(VK.ic[i + 1], public_inputs[i]);
        vk_x = try bn254.addG1Points(vk_x, term);
    }

    // 2. 准备 pairing 输入
    // 验证: e(-A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) = 1
    var pairing_input: [4 * bn254.ALT_BN128_PAIRING_ELEMENT_SIZE]u8 = undefined;

    // -A (negate proof.a)
    const neg_a = try negateG1(proof.a);

    // 打包 4 对 pairing 元素
    packPairingElement(&pairing_input, 0, neg_a, proof.b);
    packPairingElement(&pairing_input, 1, VK.alpha, VK.beta);
    packPairingElement(&pairing_input, 2, vk_x, VK.gamma);
    packPairingElement(&pairing_input, 3, proof.c, VK.delta);

    // 3. 执行 pairing check
    return try bn254.pairingLE(&pairing_input);
}

fn negateG1(point: bn254.G1Point) !bn254.G1Point {
    // G1 negation: (x, y) -> (x, p - y)
    // BN254 prime: p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
    var result = point;
    // 取反 y 坐标
    result.bytes[32..64].* = subtractFromPrime(point.bytes[32..64].*);
    return result;
}

fn packPairingElement(
    buf: []u8,
    index: usize,
    g1: bn254.G1Point,
    g2: bn254.G2Point,
) void {
    const offset = index * bn254.ALT_BN128_PAIRING_ELEMENT_SIZE;
    @memcpy(buf[offset..][0..64], &g1.bytes);
    @memcpy(buf[offset + 64..][0..128], &g2.bytes);
}
```

---

## Privacy Pool 实现

### 账户结构

```zig
//! Privacy Pool Program
//!
//! 支持任意 SPL Token 的隐私池

const anchor = @import("sol_anchor_zig");
const sol = anchor.sdk;

/// 池子状态
pub const PoolState = struct {
    /// 池子管理员
    authority: sol.PublicKey,

    /// Token Mint
    token_mint: sol.PublicKey,

    /// 面额 (每笔存款金额)
    denomination: u64,

    /// Merkle 树根
    merkle_root: [32]u8,

    /// 下一个叶子索引
    next_leaf_index: u32,

    /// 是否暂停
    paused: bool,

    /// Bump seed
    bump: u8,
};

/// Merkle 树数据账户 (单独账户，更大)
pub const MerkleTreeAccount = struct {
    /// 关联的池子
    pool: sol.PublicKey,

    /// 完整的 Merkle 树数据
    tree: MerkleTree,
};

/// Nullifier 集合账户
pub const NullifierSetAccount = struct {
    /// 关联的池子
    pool: sol.PublicKey,

    /// Nullifier 数据
    nullifiers: NullifierSet,
};
```

### 指令实现

```zig
pub const ShadowPool = struct {

    // ============================================================
    // 存款指令
    // ============================================================

    pub const DepositAccounts = anchor.Accounts(struct {
        /// 存款人
        depositor: anchor.Signer,

        /// 池子状态
        pool: anchor.Account(PoolState, .{
            .has_one = .{ .token_mint = "token_mint" },
        }),

        /// Merkle 树
        merkle_tree: anchor.Account(MerkleTreeAccount, .{
            .has_one = .{ .pool = "pool" },
        }),

        /// 存款人的 Token 账户
        depositor_ata: anchor.TokenAccount(.{
            .authority = "depositor",
            .mint = "token_mint",
        }),

        /// 池子的 Token 金库
        pool_vault: anchor.TokenAccount(.{
            .authority = "pool",
            .mint = "token_mint",
        }),

        /// Token Mint
        token_mint: anchor.Account(anchor.Mint(.{}), .{}),

        /// Token Program
        token_program: anchor.Program(anchor.token.TOKEN_PROGRAM_ID),
    });

    pub fn deposit(
        ctx: anchor.Context(DepositAccounts),
        commitment: [32]u8,
    ) !void {
        const pool = ctx.accounts.pool;

        // 检查池子未暂停
        if (pool.data.paused) {
            return error.PoolPaused;
        }

        // 转移代币到池子
        try anchor.token.transfer(
            ctx.accounts.depositor_ata,
            ctx.accounts.pool_vault,
            ctx.accounts.depositor,
            pool.data.denomination,
            null,  // 用户签名
        );

        // 插入 commitment 到 Merkle 树
        const leaf_index = try ctx.accounts.merkle_tree.data.tree.insert(commitment);

        // 更新池子根
        ctx.accounts.pool.data.merkle_root = ctx.accounts.merkle_tree.data.tree.root;
        ctx.accounts.pool.data.next_leaf_index = ctx.accounts.merkle_tree.data.tree.next_index;

        // 发射事件
        ctx.emit(DepositEvent, .{
            .commitment = commitment,
            .leaf_index = leaf_index,
            .timestamp = sol.clock.get().unix_timestamp,
        });
    }

    // ============================================================
    // 提款指令
    // ============================================================

    pub const WithdrawAccounts = anchor.Accounts(struct {
        /// 池子状态
        pool: anchor.Account(PoolState, .{}),

        /// Merkle 树
        merkle_tree: anchor.Account(MerkleTreeAccount, .{
            .has_one = .{ .pool = "pool" },
        }),

        /// Nullifier 集合
        nullifier_set: anchor.Account(NullifierSetAccount, .{
            .has_one = .{ .pool = "pool" },
        }),

        /// 池子金库
        pool_vault: anchor.TokenAccount(.{}),

        /// 池子 PDA (签名者)
        pool_authority: anchor.UncheckedAccount,

        /// 接收者的 Token 账户
        /// 可以是任何地址，不需要签名
        recipient_ata: anchor.TokenAccount(.{}),

        /// Fee Payer (协议 PDA，支付 gas)
        fee_payer: anchor.Account(FeePayerState, .{
            .seeds = &.{.{ .literal = "fee_payer" }},
        }),

        /// Token Program
        token_program: anchor.Program(anchor.token.TOKEN_PROGRAM_ID),
    });

    pub fn withdraw(
        ctx: anchor.Context(WithdrawAccounts),
        proof: Groth16Proof,
        root: [32]u8,
        nullifier_hash: [32]u8,
        recipient: sol.PublicKey,
        relayer: sol.PublicKey,
        fee: u64,
    ) !void {
        const pool = ctx.accounts.pool;

        // 1. 验证根是有效的（当前或历史）
        if (!ctx.accounts.merkle_tree.data.tree.isKnownRoot(root)) {
            return error.InvalidRoot;
        }

        // 2. 检查 nullifier 未使用
        if (ctx.accounts.nullifier_set.data.nullifiers.contains(nullifier_hash)) {
            return error.NullifierAlreadyUsed;
        }

        // 3. 准备公开输入
        const public_inputs: [5][32]u8 = .{
            root,
            nullifier_hash,
            pubkeyToField(recipient),
            pubkeyToField(relayer),
            u64ToField(fee),
        };

        // 4. 验证 ZK 证明
        if (!try verify(WithdrawVerifyingKey, &proof, &public_inputs)) {
            return error.InvalidProof;
        }

        // 5. 记录 nullifier
        try ctx.accounts.nullifier_set.data.nullifiers.insert(nullifier_hash);

        // 6. 计算实际转账金额
        const amount = pool.data.denomination - fee;

        // 7. 转账给接收者
        try anchor.token.transfer(
            ctx.accounts.pool_vault,
            ctx.accounts.recipient_ata,
            ctx.accounts.pool_authority,
            amount,
            &pool.pda_seeds(),
        );

        // 8. 如果有 relayer 费用，转给 relayer
        if (fee > 0) {
            // ... 转给 relayer
        }

        // 9. 发射事件
        ctx.emit(WithdrawEvent, .{
            .nullifier_hash = nullifier_hash,
            .recipient = recipient,
            .amount = amount,
            .timestamp = sol.clock.get().unix_timestamp,
        });
    }
};

// 辅助函数
fn pubkeyToField(pubkey: sol.PublicKey) [32]u8 {
    return pubkey.bytes;
}

fn u64ToField(value: u64) [32]u8 {
    var result = [_]u8{0} ** 32;
    std.mem.writeInt(u64, result[0..8], value, .little);
    return result;
}
```

---

## CPI 适配器

### DFlow Adapter

```zig
//! DFlow CPI Adapter
//!
//! 集成 DFlow 订单流拍卖

pub const DFlowAdapter = struct {
    pub const PROGRAM_ID = sol.PublicKey.comptimeFromBase58(
        "DFLoW1111111111111111111111111111111111111"
    );

    /// 提交订单到 DFlow 拍卖
    pub fn submitOrder(
        source_ata: *const anchor.TokenAccount,
        dest_ata: *const anchor.TokenAccount,
        authority: *const sol.PublicKey,
        signer_seeds: []const []const u8,
        input_amount: u64,
        min_output: u64,
    ) !u64 {
        // 构建 DFlow swap 指令
        const ix_data = encodeSwapInstruction(.{
            .amount_in = input_amount,
            .minimum_amount_out = min_output,
        });

        const ix = sol.instruction.Instruction{
            .program_id = &PROGRAM_ID,
            .accounts = &[_]sol.instruction.AccountMeta{
                .{ .pubkey = source_ata.key(), .is_signer = false, .is_writable = true },
                .{ .pubkey = dest_ata.key(), .is_signer = false, .is_writable = true },
                .{ .pubkey = authority, .is_signer = true, .is_writable = false },
                // ... 其他必要账户
            },
            .data = ix_data,
        };

        // 执行 CPI
        try ix.invokeSigned(
            &[_]sol.account.Account.Info{
                source_ata.to_account_info(),
                dest_ata.to_account_info(),
                // ...
            },
            &[_][]const []const u8{signer_seeds},
        );

        // 返回输出金额
        return dest_ata.amount;
    }
};
```

### Marinade Adapter

```zig
//! Marinade CPI Adapter
//!
//! 集成 Marinade 流动性质押

pub const MarinadeAdapter = struct {
    pub const PROGRAM_ID = sol.PublicKey.comptimeFromBase58(
        "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
    );

    /// 存入 SOL，获得 mSOL
    pub fn deposit(
        sol_source: *const sol.account.Account.Info,
        msol_dest: *const anchor.TokenAccount,
        authority: *const sol.PublicKey,
        signer_seeds: []const []const u8,
        amount: u64,
    ) !u64 {
        // ... Marinade deposit CPI
    }

    /// 解质押 mSOL
    pub fn unstake(
        msol_source: *const anchor.TokenAccount,
        sol_dest: *const sol.account.Account.Info,
        authority: *const sol.PublicKey,
        signer_seeds: []const []const u8,
        amount: u64,
    ) !void {
        // ... Marinade unstake CPI
    }
};
```

---

## 前端集成

### snarkjs 证明生成

```typescript
// frontend/src/lib/prover.ts

import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';

// 电路文件路径
const WASM_PATH = '/circuits/withdraw.wasm';
const ZKEY_PATH = '/circuits/withdraw_final.zkey';

// Poseidon 哈希
let poseidon: any;

export async function initPoseidon() {
  poseidon = await buildPoseidon();
}

export function poseidonHash(inputs: bigint[]): bigint {
  return poseidon.F.toObject(poseidon(inputs));
}

// 生成 commitment
export function generateCommitment(): {
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
} {
  const nullifier = randomBigInt(31);
  const secret = randomBigInt(31);
  const commitment = poseidonHash([nullifier, secret]);

  return { nullifier, secret, commitment };
}

// 生成 nullifier hash
export function generateNullifierHash(nullifier: bigint): bigint {
  return poseidonHash([nullifier]);
}

// 生成 Merkle proof
export function generateMerkleProof(
  tree: MerkleTree,
  leafIndex: number
): {
  pathElements: bigint[];
  pathIndices: number[];
} {
  // ... 从 Merkle 树生成路径
}

// 生成 ZK 证明
export async function generateWithdrawProof(
  // Private inputs
  nullifier: bigint,
  secret: bigint,
  pathElements: bigint[],
  pathIndices: number[],
  // Public inputs
  root: bigint,
  recipient: string,
  relayer: string,
  fee: bigint,
): Promise<{
  proof: Uint8Array;
  publicInputs: bigint[];
}> {
  const input = {
    // Private
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    pathElements: pathElements.map(e => e.toString()),
    pathIndices,

    // Public
    root: root.toString(),
    nullifierHash: poseidonHash([nullifier]).toString(),
    recipient: addressToField(recipient).toString(),
    relayer: addressToField(relayer).toString(),
    fee: fee.toString(),
  };

  // 生成证明
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    WASM_PATH,
    ZKEY_PATH
  );

  return {
    proof: formatProofForSolana(proof),
    publicInputs: publicSignals.map(s => BigInt(s)),
  };
}

// 转换证明格式
function formatProofForSolana(proof: any): Uint8Array {
  const result = new Uint8Array(256);

  // π_A (G1, 64 bytes, big-endian)
  result.set(g1ToBytesBE(proof.pi_a), 0);

  // π_B (G2, 128 bytes, big-endian)
  result.set(g2ToBytesBE(proof.pi_b), 64);

  // π_C (G1, 64 bytes, big-endian)
  result.set(g1ToBytesBE(proof.pi_c), 192);

  return result;
}

// G1 点转换为大端字节
function g1ToBytesBE(point: string[]): Uint8Array {
  const x = BigInt(point[0]);
  const y = BigInt(point[1]);

  const result = new Uint8Array(64);
  result.set(bigintToBytesBE(x, 32), 0);
  result.set(bigintToBytesBE(y, 32), 32);

  return result;
}

// 辅助函数
function randomBigInt(bytes: number): bigint {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return BigInt('0x' + Buffer.from(arr).toString('hex'));
}

function addressToField(address: string): bigint {
  // Solana 地址转换为 field element
  const bytes = bs58.decode(address);
  return BigInt('0x' + Buffer.from(bytes).toString('hex'));
}
```

### 凭证管理

```typescript
// frontend/src/lib/note.ts

export interface DepositNote {
  poolAddress: string;
  nullifier: string;  // bigint 的 hex 表示
  secret: string;     // bigint 的 hex 表示
  commitment: string; // bigint 的 hex 表示
  leafIndex: number;
  timestamp: number;
}

// 序列化凭证为字符串 (用户保存)
export function serializeNote(note: DepositNote): string {
  const data = JSON.stringify(note);
  return Buffer.from(data).toString('base64');
}

// 反序列化凭证
export function deserializeNote(noteString: string): DepositNote {
  const data = Buffer.from(noteString, 'base64').toString();
  return JSON.parse(data);
}

// 生成存款凭证
export function createDepositNote(
  poolAddress: string,
  nullifier: bigint,
  secret: bigint,
  commitment: bigint,
  leafIndex: number,
): DepositNote {
  return {
    poolAddress,
    nullifier: nullifier.toString(16),
    secret: secret.toString(16),
    commitment: commitment.toString(16),
    leafIndex,
    timestamp: Date.now(),
  };
}
```

---

## 安全考虑

### 1. 密码学安全

```
• ZK 电路审计: 使用经过审计的 Tornado Cash 电路
• Trusted Setup: 使用 Zcash Powers of Tau ceremony
• 哈希函数: Poseidon (ZK-friendly, 经过充分研究)
• 曲线安全: BN254 (128-bit 安全性)
```

### 2. 智能合约安全

```
• 重入攻击: 使用 checks-effects-interactions 模式
• 整数溢出: Zig 原生检查
• 访问控制: 仔细验证所有签名者
• 升级性: 考虑可升级代理模式
```

### 3. 隐私保护

```
• 匿名集大小: 池子越大越安全
• 时间关联: 建议存款后等待一段时间再提款
• 金额关联: 使用固定面额，避免金额追踪
• RPC 隐私: 建议使用私有 RPC 节点
```

### 4. 合规考虑

```
• 可选审计接口: 允许授权方查询特定交易
• 地理限制: 可根据需要限制特定地区
• 黑名单: 支持阻止已知恶意地址
```

---

## 附录

### A. 验证密钥转换工具

```bash
#!/bin/bash
# vk2zig.sh - 将 verification_key.json 转换为 Zig 代码

# 使用方法:
# ./vk2zig.sh verification_key.json > verifying_key.zig

node << 'EOF'
const fs = require('fs');
const vk = JSON.parse(fs.readFileSync(process.argv[2]));

console.log('// Auto-generated from verification_key.json');
console.log('const bn254 = @import("bn254.zig");');
console.log('');
console.log('pub const WithdrawVerifyingKey = struct {');
console.log(`    pub const NUM_PUBLIC_INPUTS = ${vk.IC.length - 1};`);
console.log('');

// Alpha
console.log('    pub const alpha = bn254.G1Point.new(.{');
console.log(`        .x = ${formatField(vk.vk_alpha_1[0])},`);
console.log(`        .y = ${formatField(vk.vk_alpha_1[1])},`);
console.log('    });');

// ... 其他点

console.log('};');

function formatField(value) {
  // 转换为 32 字节的大端表示
  const bn = BigInt(value);
  const hex = bn.toString(16).padStart(64, '0');
  const bytes = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push('0x' + hex.slice(i, i + 2));
  }
  return `.{ ${bytes.join(', ')} }`;
}
EOF
```

### B. 测试向量

```zig
// 测试用的已知正确值
test "groth16: verify known proof" {
    const proof = Groth16Proof{
        .a = bn254.G1Point.fromHex("..."),
        .b = bn254.G2Point.fromHex("..."),
        .c = bn254.G1Point.fromHex("..."),
    };

    const public_inputs = [5][32]u8{
        // root
        hexToBytes("..."),
        // nullifierHash
        hexToBytes("..."),
        // recipient
        hexToBytes("..."),
        // relayer
        hexToBytes("..."),
        // fee
        hexToBytes("..."),
    };

    const result = try verify(WithdrawVerifyingKey, &proof, &public_inputs);
    try std.testing.expect(result == true);
}
```
