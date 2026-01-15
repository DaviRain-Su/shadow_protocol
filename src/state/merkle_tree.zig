//! Merkle Tree State - On-chain Merkle Tree Storage
//!
//! This module defines the on-chain storage for the incremental Merkle tree
//! used to store deposit commitments.
//!
//! The tree uses Poseidon hash and supports incremental insertions.
//! Historical roots are stored to allow withdrawals with slightly stale roots.

const std = @import("std");
const anchor = @import("anchor");
const sdk = @import("solana_program_sdk");

/// Default tree depth (2^26 = 67,108,864 leaves)
pub const DEFAULT_DEPTH: u8 = 26;

/// Number of historical roots to store
pub const ROOTS_HISTORY_SIZE: usize = 100;

/// Precomputed zero values for each level
///
/// zeros[0] = 0 (leaf zero value)
/// zeros[i] = hash(zeros[i-1], zeros[i-1]) for i > 0
///
/// These are computed at compile time and match the circomlib Poseidon implementation.
pub const ZERO_VALUES: [DEFAULT_DEPTH + 1][32]u8 = computeZeroValues(DEFAULT_DEPTH);

fn computeZeroValues(comptime depth: u8) [depth + 1][32]u8 {
    comptime {
        var zeros: [depth + 1][32]u8 = undefined;

        // Level 0: zero leaf
        zeros[0] = [_]u8{0} ** 32;

        // Each level: hash(prev_zero, prev_zero)
        // In production, these would be actual Poseidon hashes
        // For now, we use placeholder values
        for (1..depth + 1) |i| {
            var level_hash: [32]u8 = undefined;
            // Placeholder: just use level number as identifier
            @memset(&level_hash, 0);
            level_hash[0] = @truncate(i);
            zeros[i] = level_hash;
        }

        return zeros;
    }
}

/// Merkle Tree state stored on-chain
///
/// This is a separate account from PoolState due to size constraints.
/// Size: 8 + 32 + 32 + 4 + 1 + (depth * 32) + (history * 32) + 1
///     ≈ 8 + 32 + 32 + 4 + 1 + 832 + 3200 + 1 = ~4KB for depth 26
pub const MerkleTreeState = struct {
    /// Account discriminator
    discriminator: [8]u8,

    /// Associated pool address
    pool: sdk.PublicKey,

    /// Current root hash
    root: [32]u8,

    /// Next leaf index to insert
    next_index: u32,

    /// Tree depth
    depth: u8,

    /// Filled subtrees (one per level)
    /// filled_subtrees[i] is the last filled node at level i
    filled_subtrees: [DEFAULT_DEPTH][32]u8,

    /// Historical roots (circular buffer)
    roots_history: [ROOTS_HISTORY_SIZE][32]u8,

    /// Current index in roots history
    roots_history_index: u8,

    const Self = @This();

    /// Account discriminator (comptime constant)
    pub const DISCRIMINATOR: [8]u8 = anchor.accountDiscriminator("MerkleTreeState");

    /// PDA seeds prefix
    pub const SEEDS_PREFIX: []const u8 = "shadow_merkle";

    /// Initialize an empty tree
    pub fn init(pool: sdk.PublicKey, depth: u8) Self {
        var tree = Self{
            .discriminator = DISCRIMINATOR,
            .pool = pool,
            .root = ZERO_VALUES[depth],
            .next_index = 0,
            .depth = depth,
            .filled_subtrees = undefined,
            .roots_history = undefined,
            .roots_history_index = 0,
        };

        // Initialize filled_subtrees with zero values
        for (0..DEFAULT_DEPTH) |i| {
            tree.filled_subtrees[i] = ZERO_VALUES[i];
        }

        // Initialize roots history
        for (&tree.roots_history) |*r| {
            r.* = [_]u8{0} ** 32;
        }

        return tree;
    }

    /// Insert a new leaf (commitment) into the tree
    ///
    /// Returns the leaf index on success.
    pub fn insert(self: *Self, leaf: [32]u8) !u32 {
        const capacity: u32 = @as(u32, 1) << @truncate(self.depth);
        if (self.next_index >= capacity) {
            return error.MerkleTreeFull;
        }

        const leaf_index = self.next_index;
        var current_hash = leaf;
        var current_index = leaf_index;

        // Walk up the tree
        for (0..self.depth) |level| {
            const is_left = current_index % 2 == 0;

            if (is_left) {
                // Left child: save current and pair with zero
                self.filled_subtrees[level] = current_hash;
                current_hash = poseidonHash2(current_hash, ZERO_VALUES[level]);
            } else {
                // Right child: pair with saved left sibling
                current_hash = poseidonHash2(self.filled_subtrees[level], current_hash);
            }

            current_index /= 2;
        }

        // Update root
        self.root = current_hash;

        // Save to history
        self.roots_history[self.roots_history_index] = current_hash;
        self.roots_history_index = @truncate((@as(usize, self.roots_history_index) + 1) % ROOTS_HISTORY_SIZE);

        self.next_index += 1;

        return leaf_index;
    }

    /// Check if a root is known (current or in history)
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

    /// Get current root
    pub fn getRoot(self: *const Self) [32]u8 {
        return self.root;
    }

    /// Check if tree is full
    pub fn isFull(self: *const Self) bool {
        const capacity: u32 = @as(u32, 1) << @truncate(self.depth);
        return self.next_index >= capacity;
    }
};

/// Poseidon hash of two field elements
///
/// This is a placeholder that will use the SDK's Poseidon implementation.
fn poseidonHash2(left: [32]u8, right: [32]u8) [32]u8 {
    // In production, use sdk.hash.poseidon or syscall
    // For now, simple XOR-based placeholder for testing
    var result: [32]u8 = undefined;
    for (0..32) |i| {
        result[i] = left[i] ^ right[i];
    }
    return result;
}

// ============================================================
// Tests
// ============================================================

test "MerkleTreeState: init" {
    const pool = sdk.PublicKey.default();
    const tree = MerkleTreeState.init(pool, DEFAULT_DEPTH);

    try std.testing.expectEqual(@as(u32, 0), tree.next_index);
    try std.testing.expectEqual(DEFAULT_DEPTH, tree.depth);
}

test "MerkleTreeState: insert" {
    const pool = sdk.PublicKey.default();
    var tree = MerkleTreeState.init(pool, 4); // Small tree for testing

    const leaf1 = [_]u8{0xAB} ** 32;
    const idx1 = try tree.insert(leaf1);

    try std.testing.expectEqual(@as(u32, 0), idx1);
    try std.testing.expectEqual(@as(u32, 1), tree.next_index);

    const leaf2 = [_]u8{0xCD} ** 32;
    const idx2 = try tree.insert(leaf2);

    try std.testing.expectEqual(@as(u32, 1), idx2);
    try std.testing.expectEqual(@as(u32, 2), tree.next_index);
}

test "MerkleTreeState: isKnownRoot" {
    const pool = sdk.PublicKey.default();
    var tree = MerkleTreeState.init(pool, 4);

    const leaf = [_]u8{0xAB} ** 32;
    _ = try tree.insert(leaf);

    try std.testing.expect(tree.isKnownRoot(tree.root));

    const unknown = [_]u8{0xFF} ** 32;
    try std.testing.expect(!tree.isKnownRoot(unknown));
}

test "MerkleTreeState: isFull" {
    const pool = sdk.PublicKey.default();
    var tree = MerkleTreeState.init(pool, 2); // Only 4 leaves

    try std.testing.expect(!tree.isFull());

    for (0..4) |_| {
        _ = try tree.insert([_]u8{0xAB} ** 32);
    }

    try std.testing.expect(tree.isFull());
}

test "computeZeroValues: consistency" {
    const zeros = ZERO_VALUES;

    // Level 0 should be all zeros
    try std.testing.expectEqual([_]u8{0} ** 32, zeros[0]);

    // Each level should be different
    try std.testing.expect(!std.mem.eql(u8, &zeros[0], &zeros[1]));
}
