/**
 * @px402/core - Core Types
 * Chain-agnostic type definitions for Px402 protocol
 */

// ============ Chain & Token Identifiers ============

/**
 * Supported chain identifiers
 */
export type ChainId = 'solana' | 'ethereum' | 'base' | 'arbitrum' | 'polygon';

/**
 * Token identifier (mint address or symbol)
 */
export type TokenId = string;

// ============ Deposit Note ============

/**
 * Deposit note - proof of deposit into privacy pool
 * Contains both public and private data
 */
export interface DepositNote {
  /** Chain identifier */
  chainId: ChainId;
  /** Privacy pool address */
  poolAddress: string;
  /** Commitment hash (public) */
  commitment: string;
  /** Nullifier (private - used to prevent double spending) */
  nullifier: string;
  /** Secret (private - needed for withdrawal) */
  secret: string;
  /** Merkle tree leaf index */
  leafIndex: number;
  /** Deposit amount in smallest unit */
  amount: bigint;
  /** Token identifier */
  token: TokenId;
  /** Deposit timestamp (unix ms) */
  timestamp: number;
}

// ============ Deposit Operations ============

/**
 * Parameters for depositing into privacy pool
 */
export interface DepositParams {
  /** Token to deposit */
  token: TokenId;
  /** Amount to deposit in smallest unit */
  amount: bigint;
}

/**
 * Result of a successful deposit
 */
export interface DepositResult {
  /** Transaction hash */
  txHash: string;
  /** Deposit note */
  note: DepositNote;
}

// ============ Withdraw Operations ============

/**
 * Parameters for withdrawing from privacy pool
 */
export interface WithdrawParams {
  /** Deposit note to spend */
  note: DepositNote;
  /** Recipient address */
  recipient: string;
  /** Optional relayer for fee payment */
  relayer?: RelayerConfig;
}

/**
 * Result of a successful withdrawal
 */
export interface WithdrawResult {
  /** Transaction hash */
  txHash: string;
  /** Nullifier hash (used to mark note as spent) */
  nullifierHash: string;
  /** Recipient address */
  recipient: string;
}

// ============ Relayer ============

/**
 * Relayer configuration for anonymous transactions
 */
export interface RelayerConfig {
  /** Relayer API URL */
  url: string;
  /** Relayer fee in smallest unit */
  fee: bigint;
}

// ============ Payment Proof ============

/**
 * Proof type enumeration
 */
export type ProofType = 'groth16' | 'plonk' | 'transfer';

/**
 * Payment proof for x402 verification
 * Proves payment was made without revealing sender
 */
export interface PaymentProof {
  /** Chain where payment was made */
  chainId: ChainId;
  /** Type of proof */
  proofType: ProofType;
  /** Proof data (hex or signature) */
  proof: string;
  /** Public inputs for ZK proof verification */
  publicInputs?: string[];
  /** Payment metadata */
  metadata: PaymentMetadata;
}

/**
 * Payment metadata included in proof
 */
export interface PaymentMetadata {
  /** Payment amount in smallest unit */
  amount: bigint;
  /** Token identifier */
  token: TokenId;
  /** Payment timestamp (unix ms) */
  timestamp: number;
}

// ============ Stealth Address ============

/**
 * One-time stealth address for receiving payments
 */
export interface StealthAddress {
  /** The stealth address */
  address: string;
  /** Ephemeral public key (for deriving) */
  ephemeralPubKey?: string;
  /** View tag for efficient scanning */
  viewTag?: string;
}

// ============ Pool Info ============

/**
 * Privacy pool information
 */
export interface PoolInfo {
  /** Pool address */
  address: string;
  /** Supported token */
  token: TokenId;
  /** Fixed deposit amount (if applicable) */
  denomination?: bigint;
  /** Total deposits count */
  depositCount: number;
  /** Chain identifier */
  chainId: ChainId;
}

// ============ Error Types ============

/**
 * Px402 error codes
 */
export enum Px402ErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_NOTE = 'INVALID_NOTE',
  NOTE_ALREADY_SPENT = 'NOTE_ALREADY_SPENT',
  INVALID_PROOF = 'INVALID_PROOF',
  RELAYER_ERROR = 'RELAYER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
}

/**
 * Px402 error class
 */
export class Px402Error extends Error {
  constructor(
    public readonly code: Px402ErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'Px402Error';
  }
}
