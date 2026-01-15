//! State Module - On-chain Account Structures
//!
//! This module defines all the account structures stored on-chain.
//! These structures are used by the Privacy Pool program.

const std = @import("std");

pub const pool = @import("pool.zig");
pub const merkle_tree = @import("merkle_tree.zig");
pub const nullifier = @import("nullifier.zig");

// Re-export main types
pub const PoolState = pool.PoolState;
pub const PoolConfig = pool.PoolConfig;
pub const MerkleTreeState = merkle_tree.MerkleTreeState;
pub const NullifierState = nullifier.NullifierState;
pub const NullifierAccount = nullifier.NullifierAccount;

// Re-export constants
pub const ZERO_VALUES = merkle_tree.ZERO_VALUES;

/// Protocol-wide constants
pub const MERKLE_DEPTH: u8 = 20;
pub const MERKLE_CAPACITY: u32 = 1 << MERKLE_DEPTH;
pub const ROOTS_HISTORY_SIZE: usize = 100;
pub const BLOOM_SIZE_WORDS: usize = 1024;

test {
    std.testing.refAllDecls(@This());
}
