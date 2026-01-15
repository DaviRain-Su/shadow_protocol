//! Pool State - Privacy Pool Account Structure
//!
//! The PoolState holds the main configuration and state of a privacy pool.
//! Each pool is specific to a token mint and denomination.

const std = @import("std");
const anchor = @import("anchor");
const sdk = @import("solana_program_sdk");

/// Pool configuration (immutable after initialization)
pub const PoolConfig = struct {
    /// Token mint for this pool
    token_mint: sdk.PublicKey,

    /// Fixed denomination for deposits/withdrawals
    /// All deposits must be exactly this amount
    denomination: u64,

    /// Merkle tree depth (typically 20)
    merkle_depth: u8,

    /// Authority that can pause/unpause the pool
    authority: sdk.PublicKey,
};

/// Pool state stored on-chain
///
/// Size: 8 (discriminator) + 32 + 32 + 8 + 32 + 4 + 1 + 1 + 1 + 3 = 122 bytes
pub const PoolState = extern struct {
    /// Account discriminator (set by Anchor)
    discriminator: [8]u8,

    /// Token mint for this pool
    token_mint: sdk.PublicKey,

    /// Pool authority (can pause/unpause)
    authority: sdk.PublicKey,

    /// Fixed denomination for deposits
    denomination: u64,

    /// Current Merkle tree root
    merkle_root: [32]u8,

    /// Number of deposits (next leaf index)
    next_leaf_index: u32,

    /// Merkle tree depth
    merkle_depth: u8,

    /// Whether the pool is paused
    paused: bool,

    /// PDA bump seed
    bump: u8,

    /// Padding for alignment
    _padding: [3]u8,

    const Self = @This();

    /// Account discriminator (comptime constant)
    pub const DISCRIMINATOR: [8]u8 = anchor.accountDiscriminator("PoolState");

    /// Account size in bytes
    pub const SIZE: usize = @sizeOf(Self);

    /// Seeds for PDA derivation
    pub const SEEDS_PREFIX: []const u8 = "shadow_pool";

    /// Initialize a new pool state
    pub fn init(
        token_mint: sdk.PublicKey,
        authority: sdk.PublicKey,
        denomination: u64,
        merkle_depth: u8,
        initial_root: [32]u8,
        bump: u8,
    ) Self {
        return .{
            .discriminator = DISCRIMINATOR,
            .token_mint = token_mint,
            .authority = authority,
            .denomination = denomination,
            .merkle_root = initial_root,
            .next_leaf_index = 0,
            .merkle_depth = merkle_depth,
            .paused = false,
            .bump = bump,
            ._padding = [_]u8{0} ** 3,
        };
    }

    /// Check if the pool can accept deposits
    pub fn canDeposit(self: *const Self) bool {
        if (self.paused) return false;

        const capacity: u32 = @as(u32, 1) << @truncate(self.merkle_depth);
        return self.next_leaf_index < capacity;
    }

    /// Check if the pool can process withdrawals
    pub fn canWithdraw(self: *const Self) bool {
        return !self.paused and self.next_leaf_index > 0;
    }

    /// Get the PDA seeds for this pool
    pub fn pdaSeeds(self: *const Self) [3][]const u8 {
        return .{
            Self.SEEDS_PREFIX,
            &self.token_mint.bytes,
            &[_]u8{self.bump},
        };
    }
};

/// Pool vault (token account holding deposited funds)
pub const PoolVault = struct {
    /// Seeds prefix for vault PDA
    pub const SEEDS_PREFIX: []const u8 = "shadow_vault";

    /// Derive vault PDA
    pub fn derivePda(
        pool_address: sdk.PublicKey,
        program_id: sdk.PublicKey,
    ) struct { address: sdk.PublicKey, bump: u8 } {
        const seeds = [_][]const u8{
            SEEDS_PREFIX,
            &pool_address.bytes,
        };

        return sdk.PublicKey.findProgramAddress(seeds, program_id);
    }
};

// ============================================================
// Tests
// ============================================================

test "PoolState: size" {
    // Ensure the struct has expected size
    try std.testing.expect(PoolState.SIZE > 0);
    try std.testing.expect(PoolState.SIZE < 1024);
}

test "PoolState: init" {
    const mint = sdk.PublicKey.default();
    const authority = sdk.PublicKey.default();
    const root = [_]u8{0} ** 32;

    const pool = PoolState.init(mint, authority, 1_000_000_000, 20, root, 255);

    try std.testing.expectEqual(@as(u64, 1_000_000_000), pool.denomination);
    try std.testing.expectEqual(@as(u8, 20), pool.merkle_depth);
    try std.testing.expectEqual(@as(u32, 0), pool.next_leaf_index);
    try std.testing.expect(!pool.paused);
}

test "PoolState: canDeposit" {
    var pool = PoolState.init(
        sdk.PublicKey.default(),
        sdk.PublicKey.default(),
        1_000_000_000,
        4, // Small depth for testing
        [_]u8{0} ** 32,
        255,
    );

    try std.testing.expect(pool.canDeposit());

    pool.paused = true;
    try std.testing.expect(!pool.canDeposit());

    pool.paused = false;
    pool.next_leaf_index = 16; // 2^4 = 16, at capacity
    try std.testing.expect(!pool.canDeposit());
}

test "PoolState: canWithdraw" {
    var pool = PoolState.init(
        sdk.PublicKey.default(),
        sdk.PublicKey.default(),
        1_000_000_000,
        20,
        [_]u8{0} ** 32,
        255,
    );

    // Empty pool
    try std.testing.expect(!pool.canWithdraw());

    pool.next_leaf_index = 1;
    try std.testing.expect(pool.canWithdraw());

    pool.paused = true;
    try std.testing.expect(!pool.canWithdraw());
}
