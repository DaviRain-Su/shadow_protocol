//! Shadow Protocol - Privacy Pool for Solana
//!
//! A zero-knowledge proof based privacy solution for Solana blockchain.
//! This library provides the core data structures and verification logic
//! for implementing privacy pools similar to Tornado Cash on Solana.
//!
//! ## Architecture
//!
//! The protocol consists of:
//! - **Privacy Pool**: Holds deposited funds and manages the Merkle tree
//! - **Merkle Tree**: Stores deposit commitments (depth 26, 67M+ deposits)
//! - **Nullifier Set**: Prevents double-spending via Bloom filter + PDA
//! - **Groth16 Verifier**: Validates ZK proofs using bn254 syscalls
//!
//! ## Usage
//!
//! ```zig
//! const shadow = @import("shadow_protocol");
//!
//! // Deposit: user generates commitment = hash(nullifier, secret)
//! // and adds it to the Merkle tree
//!
//! // Withdraw: user generates ZK proof and reveals nullifier hash
//! // to claim funds without linking to deposit
//! ```
//!
//! ## References
//!
//! - [Privacy Cash](https://github.com/Privacy-Cash/privacy-cash)
//! - [Tornado Cash](https://github.com/tornadocash/tornado-core)

const std = @import("std");

// Re-export state modules
pub const state = @import("state/mod.zig");

// Re-export verifier modules
pub const verifier = @import("verifier/groth16.zig");

// Type aliases for convenience
pub const PoolState = state.PoolState;
pub const MerkleTreeState = state.MerkleTreeState;
pub const NullifierState = state.NullifierState;
pub const Groth16Verifier = verifier.Groth16Verifier;

/// Protocol constants
pub const MERKLE_DEPTH: u8 = 26;
pub const MERKLE_CAPACITY: u32 = 1 << MERKLE_DEPTH; // 67,108,864 deposits
pub const ROOTS_HISTORY_SIZE: usize = 100;
pub const BLOOM_SIZE_WORDS: usize = 1024; // 64KB Bloom filter

/// Protocol error codes (Anchor compatible, starting at 6000)
pub const ErrorCode = enum(u32) {
    /// Merkle tree is full, cannot accept more deposits
    MerkleTreeFull = 6000,
    /// The nullifier has already been used
    NullifierAlreadyUsed = 6001,
    /// The provided Merkle root is not known
    InvalidRoot = 6002,
    /// The ZK proof verification failed
    InvalidProof = 6003,
    /// Pool is currently paused
    PoolPaused = 6004,
    /// Invalid denomination amount
    InvalidDenomination = 6005,
    /// Insufficient funds in pool
    InsufficientFunds = 6006,
    /// Invalid commitment format
    InvalidCommitment = 6007,
    /// Invalid nullifier hash format
    InvalidNullifierHash = 6008,
    /// Arithmetic overflow
    ArithmeticOverflow = 6009,
};

/// Convert a public key to a field element (32 bytes)
pub fn pubkeyToField(pubkey: [32]u8) [32]u8 {
    return pubkey;
}

/// Convert a u64 to a field element (little-endian padded to 32 bytes)
pub fn u64ToField(value: u64) [32]u8 {
    var result = [_]u8{0} ** 32;
    std.mem.writeInt(u64, result[0..8], value, .little);
    return result;
}

test {
    std.testing.refAllDecls(@This());
}
