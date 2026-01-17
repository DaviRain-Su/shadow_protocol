/**
 * @px402/relayer - Type Definitions
 */

// ============ Relayer Types ============

/**
 * Relayer configuration
 */
export interface RelayerConfig {
  /** Solana RPC endpoint */
  rpcUrl: string;
  /** Privacy Cash program ID */
  programId: string;
  /** Relayer keypair (for signing transactions) */
  secretKey: Uint8Array;
  /** Relayer fee in lamports */
  fee: bigint;
  /** Network: mainnet, devnet, testnet, localnet */
  network?: 'mainnet' | 'devnet' | 'testnet' | 'localnet';
}

/**
 * Deposit request
 */
export interface DepositRequest {
  /** Commitment hash */
  commitment: string;
  /** Deposit amount in lamports */
  amount: bigint;
  /** Asset type: 0 = SOL, 1 = USDC */
  assetType: number;
  /** User's public key */
  userPubkey: string;
}

/**
 * Withdraw request
 */
export interface WithdrawRequest {
  /** ZK proof */
  proof?: ZkProof;
  /** Merkle root */
  root: string;
  /** Nullifier hash */
  nullifier: string;
  /** Recipient address */
  recipient: string;
  /** Amount to withdraw */
  amount: bigint;
  /** Asset type */
  assetType: number;
}

/**
 * ZK Proof structure (Groth16)
 */
export interface ZkProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  protocol: string;
  curve: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

// ============ Indexer Types ============

/**
 * Indexed note (encrypted UTXO)
 */
export interface IndexedNote {
  /** Commitment hash */
  commitment: string;
  /** Leaf index in Merkle tree */
  leafIndex: number;
  /** Encrypted note data */
  encryptedData: string;
  /** Block slot when deposited */
  slot: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Merkle tree state
 */
export interface MerkleTreeState {
  /** Current root */
  root: string;
  /** Next leaf index */
  nextIndex: number;
  /** Root history for verification */
  rootHistory: string[];
  /** All leaves (commitments) */
  leaves: string[];
}

/**
 * Nullifier state
 */
export interface NullifierState {
  /** Set of used nullifiers */
  used: Set<string>;
  /** Mapping of nullifier -> transaction signature */
  txMap: Map<string, string>;
}

/**
 * Indexer event
 */
export interface IndexerEvent {
  type: 'deposit' | 'withdraw' | 'transfer';
  commitment?: string;
  nullifier?: string;
  signature: string;
  slot: number;
  timestamp: number;
}

// ============ API Response Types ============

/**
 * Merkle root response
 */
export interface MerkleRootResponse {
  root: string;
  leafCount: number;
  lastUpdated: string;
}

/**
 * Pool info response
 */
export interface PoolInfoResponse {
  programId: string;
  poolAccount: string;
  merkleAccount: string;
  nullifierAccount: string;
  treeTokenAccount: string;
}

/**
 * Status response
 */
export interface StatusResponse {
  found: boolean;
  status: 'pending' | 'confirmed' | 'finalized' | 'not_found';
  confirmations?: number;
  err?: unknown;
  slot?: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  network: string;
  rpcConnected: boolean;
  lastBlockSlot?: number;
  merkleRoot?: string;
  leafCount?: number;
}
