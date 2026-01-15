//! Groth16 Zero-Knowledge Proof Verifier
//!
//! This module wraps the SDK's BN254 operations to provide Groth16 verification
//! for the Privacy Cash JoinSplit (transaction2) circuit.
//!
//! Rust source: https://github.com/Privacy-Cash/privacy-cash/blob/main/anchor/programs/zkcash/src/groth16.rs
//!
//! ## Verification Equation
//!
//! e(-A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) = 1
//!
//! Where vk_x = IC[0] + Σ(IC[i+1] * input[i])
//!
//! ## Public Inputs
//!
//! The transaction2 circuit has 7 public inputs:
//! 1. root - Merkle tree root
//! 2. publicAmount - extAmount - fee (field element)
//! 3. extDataHash - Hash of external data
//! 4. inputNullifier[0]
//! 5. inputNullifier[1]
//! 6. outputCommitment[0]
//! 7. outputCommitment[1]

const std = @import("std");
const sdk = @import("solana_program_sdk");
const bn254 = sdk.bn254;
const vk_data = @import("vk_transaction2.zig");

/// Size of a Groth16 proof in bytes (256 bytes)
pub const PROOF_SIZE: usize = 256;

/// Number of public inputs for the transaction2 circuit
pub const NUM_PUBLIC_INPUTS: usize = vk_data.NUM_PUBLIC_INPUTS;

/// Groth16 proof structure
pub const Groth16Proof = struct {
    /// π_A: G1 point (64 bytes)
    a: bn254.G1Point,

    /// π_B: G2 point (128 bytes)
    b: bn254.G2Point,

    /// π_C: G1 point (64 bytes)
    c: bn254.G1Point,

    const Self = @This();

    /// Parse proof from bytes (snarkjs big-endian format)
    pub fn fromBytes(bytes: *const [PROOF_SIZE]u8) !Self {
        return .{
            .a = try bn254.G1Point.fromBE(bytes[0..64]),
            .b = bn254.G2Point.new(bytes[64..192].*),
            .c = try bn254.G1Point.fromBE(bytes[192..256]),
        };
    }

    /// Serialize proof to bytes
    pub fn toBytes(self: *const Self) [PROOF_SIZE]u8 {
        var result: [PROOF_SIZE]u8 = undefined;
        @memcpy(result[0..64], &self.a.bytes);
        @memcpy(result[64..192], &self.b.bytes);
        @memcpy(result[192..256], &self.c.bytes);
        return result;
    }
};

/// Verifying key for the transaction2 circuit
///
/// This contains the trusted setup parameters specific to our circuit.
/// In production, these would be the actual values from the ceremony.
pub const TransactionVerifyingKey = struct {
    /// α: G1 point
    alpha: bn254.G1Point,

    /// β: G2 point
    beta: bn254.G2Point,

    /// γ: G2 point
    gamma: bn254.G2Point,

    /// δ: G2 point
    delta: bn254.G2Point,

    /// IC: G1 points (length = NUM_PUBLIC_INPUTS + 1)
    ic: [NUM_PUBLIC_INPUTS + 1]bn254.G1Point,
};

/// Public inputs for the transaction2 proof
pub const TransactionInputs = struct {
    /// Merkle tree root
    root: [32]u8,

    /// publicAmount (field element)
    public_amount: [32]u8,

    /// extDataHash (field element)
    ext_data_hash: [32]u8,

    /// Input nullifiers
    input_nullifier: [2][32]u8,

    /// Output commitments
    output_commitment: [2][32]u8,

    const Self = @This();

    /// Create from components
    pub fn new(
        root: [32]u8,
        public_amount: [32]u8,
        ext_data_hash: [32]u8,
        input_nullifier: [2][32]u8,
        output_commitment: [2][32]u8,
    ) Self {
        return .{
            .root = root,
            .public_amount = public_amount,
            .ext_data_hash = ext_data_hash,
            .input_nullifier = input_nullifier,
            .output_commitment = output_commitment,
        };
    }

    /// Convert to array for verification
    pub fn toArray(self: *const Self) [NUM_PUBLIC_INPUTS][32]u8 {
        return .{
            self.root,
            self.public_amount,
            self.ext_data_hash,
            self.input_nullifier[0],
            self.input_nullifier[1],
            self.output_commitment[0],
            self.output_commitment[1],
        };
    }
};

/// Groth16 verifier for the transaction2 circuit
pub const Groth16Verifier = struct {
    /// Verifying key
    vk: TransactionVerifyingKey,

    const Self = @This();

    /// Create a new verifier with the given key
    pub fn init(vk: TransactionVerifyingKey) Self {
        return .{ .vk = vk };
    }

    /// Verify a proof against public inputs
    ///
    /// Returns true if the proof is valid.
    pub fn verify(
        self: *const Self,
        proof: *const Groth16Proof,
        inputs: *const TransactionInputs,
    ) !bool {
        const public_inputs = inputs.toArray();

        // Step 1: Compute vk_x = IC[0] + Σ(IC[i+1] * input[i])
        var vk_x = self.vk.ic[0];

        for (0..NUM_PUBLIC_INPUTS) |i| {
            // Scalar multiplication: IC[i+1] * input[i]
            const term = try bn254.mulG1Scalar(self.vk.ic[i + 1], public_inputs[i]);
            // Point addition: vk_x += term
            vk_x = try bn254.addG1Points(vk_x, term);
        }

        // Step 2: Negate proof.a for the pairing check
        // Negation of G1 point (x, y) is (x, -y) where -y = p - y mod p
        // Using subtraction: -A = identity - A
        const neg_a = try bn254.subG1Points(bn254.G1Point.identity(), proof.a);

        // Step 3: Prepare pairing input
        // Check: e(-A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) = 1
        var pairing_input: [4 * bn254.ALT_BN128_PAIRING_ELEMENT_SIZE]u8 = undefined;

        // Element 0: (-A, B)
        packPairingElement(&pairing_input, 0, neg_a, proof.b);

        // Element 1: (α, β)
        packPairingElement(&pairing_input, 1, self.vk.alpha, self.vk.beta);

        // Element 2: (vk_x, γ)
        packPairingElement(&pairing_input, 2, vk_x, self.vk.gamma);

        // Element 3: (C, δ)
        packPairingElement(&pairing_input, 3, proof.c, self.vk.delta);

        // Step 4: Execute pairing check
        return try bn254.pairingLE(&pairing_input);
    }
};

/// Pack a G1 and G2 point into pairing input buffer
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

/// Transaction2 verifying key (Privacy Cash)
pub fn transaction2VerifyingKey() !TransactionVerifyingKey {
    var ic: [NUM_PUBLIC_INPUTS + 1]bn254.G1Point = undefined;
    for (vk_data.VK_IC, 0..) |bytes, idx| {
        ic[idx] = try bn254.G1Point.fromBE(bytes[0..]);
    }

    return .{
        .alpha = try bn254.G1Point.fromBE(vk_data.VK_ALPHA[0..]),
        .beta = bn254.G2Point.new(vk_data.VK_BETA),
        .gamma = bn254.G2Point.new(vk_data.VK_GAMMA),
        .delta = bn254.G2Point.new(vk_data.VK_DELTA),
        .ic = ic,
    };
}

// ============================================================
// Tests
// ============================================================

test "Groth16Proof: serialization roundtrip" {
    const original_bytes = [_]u8{0xAB} ** PROOF_SIZE;
    const proof = try Groth16Proof.fromBytes(&original_bytes);
    const serialized = proof.toBytes();

    try std.testing.expectEqual(original_bytes, serialized);
}

test "TransactionInputs: creation" {
    const root = [_]u8{0xAA} ** 32;
    const public_amount = [_]u8{0x01} ** 32;
    const ext_data_hash = [_]u8{0x02} ** 32;
    const input_nullifier = [2][32]u8{
        [_]u8{0xBB} ** 32,
        [_]u8{0xCC} ** 32,
    };
    const output_commitment = [2][32]u8{
        [_]u8{0xDD} ** 32,
        [_]u8{0xEE} ** 32,
    };

    const inputs = TransactionInputs.new(
        root,
        public_amount,
        ext_data_hash,
        input_nullifier,
        output_commitment,
    );

    try std.testing.expectEqual(root, inputs.root);
    try std.testing.expectEqual(public_amount, inputs.public_amount);
}

test "TransactionInputs: toArray" {
    const inputs = TransactionInputs{
        .root = [_]u8{1} ** 32,
        .public_amount = [_]u8{2} ** 32,
        .ext_data_hash = [_]u8{3} ** 32,
        .input_nullifier = .{
            [_]u8{4} ** 32,
            [_]u8{5} ** 32,
        },
        .output_commitment = .{
            [_]u8{6} ** 32,
            [_]u8{7} ** 32,
        },
    };

    const arr = inputs.toArray();

    try std.testing.expectEqual(@as(usize, NUM_PUBLIC_INPUTS), arr.len);
    try std.testing.expectEqual(inputs.root, arr[0]);
}

test "Groth16Verifier: creation" {
    const vk_value = try transaction2VerifyingKey();
    const verifier = Groth16Verifier.init(vk_value);

    try std.testing.expectEqual(vk_value.alpha.bytes, verifier.vk.alpha.bytes);
}
