//! Nullifier State - Double-Spend Prevention
//!
//! Each withdrawal reveals a nullifier hash. Once used, it cannot be used again.
//! We use two mechanisms:
//! 1. Bloom filter in NullifierState for fast probabilistic checks
//! 2. Individual NullifierAccount PDAs for definitive checks

const std = @import("std");
const anchor = @import("anchor");
const sdk = @import("solana_program_sdk");

/// Bloom filter size in u64 words (1024 * 8 = 8KB)
pub const BLOOM_SIZE_WORDS: usize = 1024;

/// Number of hash functions for Bloom filter
pub const BLOOM_HASH_COUNT: usize = 8;

/// Nullifier state with Bloom filter for fast lookups
///
/// Size: 8 + 32 + 8 + (1024 * 8) + 1 = 8249 bytes ≈ 8.1KB
pub const NullifierState = struct {
    /// Account discriminator
    discriminator: [8]u8,

    /// Associated pool address
    pool: sdk.PublicKey,

    /// Number of nullifiers added
    count: u64,

    /// Bloom filter bits
    bloom_filter: [BLOOM_SIZE_WORDS]u64,

    /// PDA bump seed
    bump: u8,

    const Self = @This();

    /// Account discriminator (comptime constant)
    pub const DISCRIMINATOR: [8]u8 = anchor.accountDiscriminator("NullifierState");

    /// PDA seeds prefix
    pub const SEEDS_PREFIX: []const u8 = "shadow_nullifier_set";

    /// Initialize an empty nullifier set
    pub fn init(pool: sdk.PublicKey, bump: u8) Self {
        return .{
            .discriminator = DISCRIMINATOR,
            .pool = pool,
            .count = 0,
            .bloom_filter = [_]u64{0} ** BLOOM_SIZE_WORDS,
            .bump = bump,
        };
    }

    /// Check if a nullifier might be in the set (probabilistic)
    ///
    /// Returns true if the nullifier MIGHT have been used.
    /// Returns false if the nullifier has DEFINITELY NOT been used.
    pub fn mightContain(self: *const Self, nullifier_hash: [32]u8) bool {
        const indices = computeBloomIndices(nullifier_hash);

        for (indices) |idx| {
            const word_idx = idx / 64;
            const bit_idx: u6 = @truncate(idx % 64);

            if ((self.bloom_filter[word_idx] & (@as(u64, 1) << bit_idx)) == 0) {
                return false;
            }
        }

        return true;
    }

    /// Add a nullifier to the Bloom filter
    ///
    /// Note: Also create a NullifierAccount PDA for definitive tracking.
    pub fn add(self: *Self, nullifier_hash: [32]u8) void {
        const indices = computeBloomIndices(nullifier_hash);

        for (indices) |idx| {
            const word_idx = idx / 64;
            const bit_idx: u6 = @truncate(idx % 64);

            self.bloom_filter[word_idx] |= (@as(u64, 1) << bit_idx);
        }

        self.count += 1;
    }

    /// Estimate false positive rate
    pub fn estimateFalsePositiveRate(self: *const Self) f64 {
        const k: f64 = @floatFromInt(BLOOM_HASH_COUNT);
        const m: f64 = @floatFromInt(BLOOM_SIZE_WORDS * 64);
        const n: f64 = @floatFromInt(self.count);

        const exp_arg = -k * n / m;
        const base = 1.0 - std.math.exp(exp_arg);
        return std.math.pow(f64, base, k);
    }
};

/// Individual nullifier account (PDA per nullifier hash)
///
/// This provides 100% accurate double-spend prevention.
/// Size: 8 + 32 + 32 + 8 + 1 = 81 bytes
pub const NullifierAccount = struct {
    /// Account discriminator
    discriminator: [8]u8,

    /// Associated pool address
    pool: sdk.PublicKey,

    /// The nullifier hash (used as part of PDA seeds)
    nullifier_hash: [32]u8,

    /// Timestamp when this nullifier was used
    used_at: i64,

    /// PDA bump seed
    bump: u8,

    const Self = @This();

    /// Account discriminator (comptime constant)
    pub const DISCRIMINATOR: [8]u8 = anchor.accountDiscriminator("NullifierAccount");

    /// PDA seeds prefix
    pub const SEEDS_PREFIX: []const u8 = "shadow_nullifier";

    /// Account size
    pub const SIZE: usize = @sizeOf(Self);

    /// Initialize a nullifier account
    pub fn init(pool: sdk.PublicKey, nullifier_hash: [32]u8, used_at: i64, bump: u8) Self {
        return .{
            .discriminator = DISCRIMINATOR,
            .pool = pool,
            .nullifier_hash = nullifier_hash,
            .used_at = used_at,
            .bump = bump,
        };
    }

    /// Derive PDA for a nullifier
    pub fn derivePda(
        pool: sdk.PublicKey,
        nullifier_hash: [32]u8,
        program_id: sdk.PublicKey,
    ) struct { address: sdk.PublicKey, bump: u8 } {
        const seeds = [_][]const u8{
            SEEDS_PREFIX,
            &pool.bytes,
            &nullifier_hash,
        };

        return sdk.PublicKey.findProgramAddress(seeds, program_id);
    }
};

/// Compute Bloom filter indices from nullifier hash
fn computeBloomIndices(hash: [32]u8) [BLOOM_HASH_COUNT]usize {
    var indices: [BLOOM_HASH_COUNT]usize = undefined;

    for (0..BLOOM_HASH_COUNT) |i| {
        const offset = i * 2;
        const raw: usize = std.mem.readInt(u16, hash[offset..][0..2], .little);
        indices[i] = raw % (BLOOM_SIZE_WORDS * 64);
    }

    return indices;
}

// ============================================================
// Tests
// ============================================================

test "NullifierState: init" {
    const pool = sdk.PublicKey.default();
    const state = NullifierState.init(pool, 255);

    try std.testing.expectEqual(@as(u64, 0), state.count);
}

test "NullifierState: add and check" {
    const pool = sdk.PublicKey.default();
    var state = NullifierState.init(pool, 255);

    const nullifier = [_]u8{0xAB} ** 32;

    // Should not contain before adding
    try std.testing.expect(!state.mightContain(nullifier));

    // Add it
    state.add(nullifier);

    // Should contain after adding
    try std.testing.expect(state.mightContain(nullifier));
    try std.testing.expectEqual(@as(u64, 1), state.count);
}

test "NullifierState: different nullifiers" {
    const pool = sdk.PublicKey.default();
    var state = NullifierState.init(pool, 255);

    const nullifier1 = [_]u8{0xAB} ** 32;
    const nullifier2 = [_]u8{0xCD} ** 32;

    state.add(nullifier1);

    try std.testing.expect(state.mightContain(nullifier1));
    // nullifier2 should not be in the set (unlikely false positive with sparse filter)
    try std.testing.expect(!state.mightContain(nullifier2));
}

test "NullifierAccount: init" {
    const pool = sdk.PublicKey.default();
    const nullifier_hash = [_]u8{0xAB} ** 32;
    const timestamp: i64 = 1234567890;

    const account = NullifierAccount.init(pool, nullifier_hash, timestamp, 255);

    try std.testing.expectEqual(nullifier_hash, account.nullifier_hash);
    try std.testing.expectEqual(timestamp, account.used_at);
}

test "computeBloomIndices: deterministic" {
    const hash = [_]u8{0xAB} ** 32;

    const indices1 = computeBloomIndices(hash);
    const indices2 = computeBloomIndices(hash);

    try std.testing.expectEqual(indices1, indices2);
}
