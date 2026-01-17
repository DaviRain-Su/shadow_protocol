/**
 * @px402/relayer - Privacy Cash Relayer Service
 *
 * Transaction relay for anonymous payment submissions.
 * Based on privacy-amm relayer from titan_framework.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  SystemProgram,
} from '@solana/web3.js';
import type {
  RelayerConfig,
  DepositRequest,
  WithdrawRequest,
  TransactionResult,
  ZkProof,
} from './types.js';
import { PrivacyCashIndexer } from './indexer.js';

// ============ Constants ============

/**
 * Privacy Cash instruction discriminators
 * Must match the on-chain program
 */
const INSTRUCTIONS = {
  Initialize: 0,
  Deposit: 1,
  Withdraw: 2,
  Transact: 3, // Privacy Cash uses "transact" for transfers
};

/**
 * Default relayer fee (0.001 SOL = 1,000,000 lamports)
 */
const DEFAULT_FEE = BigInt(1_000_000);

// ============ Utility Functions ============

/**
 * Convert decimal string to 32-byte little-endian array
 */
function decimalTo32Bytes(decimal: string | bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let value = typeof decimal === 'string' ? BigInt(decimal) : decimal;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(value & 0xFFn);
    value >>= 8n;
  }
  return bytes;
}

/**
 * Convert number to 8-byte little-endian array (u64)
 */
function numberTo8Bytes(num: bigint | number): Uint8Array {
  const bytes = new Uint8Array(8);
  let value = typeof num === 'number' ? BigInt(num) : num;
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number(value & 0xFFn);
    value >>= 8n;
  }
  return bytes;
}

/**
 * Concatenate Uint8Arrays
 */
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Format ZK proof to bytes (256 bytes for Groth16)
 */
function formatProofBytes(proof: ZkProof): Uint8Array {
  // G1 point to 64 bytes
  function g1ToBytes(point: [string, string]): Uint8Array {
    const bytes = new Uint8Array(64);
    const x = BigInt(point[0]);
    const y = BigInt(point[1]);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number((x >> BigInt(i * 8)) & 0xFFn);
      bytes[32 + i] = Number((y >> BigInt(i * 8)) & 0xFFn);
    }
    return bytes;
  }

  // G2 point to 128 bytes
  function g2ToBytes(point: [[string, string], [string, string]]): Uint8Array {
    const bytes = new Uint8Array(128);
    const coords = [
      BigInt(point[0][0]),
      BigInt(point[0][1]),
      BigInt(point[1][0]),
      BigInt(point[1][1]),
    ];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i < 32; i++) {
        bytes[c * 32 + i] = Number((coords[c] >> BigInt(i * 8)) & 0xFFn);
      }
    }
    return bytes;
  }

  return concat(
    g1ToBytes(proof.pi_a),
    g2ToBytes(proof.pi_b),
    g1ToBytes(proof.pi_c)
  );
}

// ============ Relayer Class ============

/**
 * Privacy Cash Relayer
 *
 * Submits transactions on behalf of users for anonymous payments.
 */
export class PrivacyCashRelayer {
  private config: RelayerConfig;
  private connection: Connection;
  private keypair: Keypair;
  private programId: PublicKey;
  private indexer: PrivacyCashIndexer;

  // PDAs
  private merkleAccountPDA: PublicKey | null = null;
  private treeTokenAccountPDA: PublicKey | null = null;
  private globalConfigPDA: PublicKey | null = null;

  constructor(config: RelayerConfig) {
    this.config = {
      ...config,
      fee: config.fee || DEFAULT_FEE,
    };
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.keypair = Keypair.fromSecretKey(config.secretKey);
    this.programId = new PublicKey(config.programId);
    this.indexer = new PrivacyCashIndexer({
      rpcUrl: config.rpcUrl,
      programId: config.programId,
    });
  }

  /**
   * Initialize the relayer
   */
  async initialize(): Promise<void> {
    // Derive PDAs
    [this.merkleAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('merkle_tree')],
      this.programId
    );

    [this.treeTokenAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('tree_token')],
      this.programId
    );

    [this.globalConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_config')],
      this.programId
    );

    // Start indexer
    await this.indexer.start();

    console.log(`[Relayer] Initialized`);
    console.log(`[Relayer] Program: ${this.programId.toBase58()}`);
    console.log(`[Relayer] Relayer pubkey: ${this.keypair.publicKey.toBase58()}`);
  }

  /**
   * Stop the relayer
   */
  stop(): void {
    this.indexer.stop();
  }

  // ============ Transaction Handlers ============

  /**
   * Submit a deposit transaction
   */
  async deposit(request: DepositRequest): Promise<TransactionResult> {
    try {
      // Build deposit instruction data
      const instructionData = concat(
        new Uint8Array([INSTRUCTIONS.Deposit]),
        decimalTo32Bytes(request.commitment),
        numberTo8Bytes(request.amount),
        new Uint8Array([request.assetType])
      );

      // Build transaction
      const result = await this.buildAndSendTransaction(instructionData, [
        { pubkey: new PublicKey(request.userPubkey), isSigner: false, isWritable: false },
        { pubkey: this.merkleAccountPDA!, isSigner: false, isWritable: true },
        { pubkey: this.treeTokenAccountPDA!, isSigner: false, isWritable: true },
        { pubkey: this.globalConfigPDA!, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      // Update indexer
      this.indexer.addCommitment(request.commitment);

      return {
        success: true,
        signature: result.signature,
        explorerUrl: this.getExplorerUrl(result.signature),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit a withdrawal transaction
   */
  async withdraw(request: WithdrawRequest): Promise<TransactionResult> {
    try {
      // Check nullifier hasn't been used
      if (this.indexer.isNullifierUsed(request.nullifier)) {
        return {
          success: false,
          error: 'Nullifier already used (double-spend attempt)',
        };
      }

      // Verify Merkle proof if provided
      const currentRoot = this.indexer.getMerkleRoot();
      if (request.root !== currentRoot) {
        // Check if root is in history (TODO: implement root history)
        console.warn('[Relayer] Root mismatch, using current root');
      }

      // Build withdraw instruction data
      const instructionData = concat(
        new Uint8Array([INSTRUCTIONS.Withdraw]),
        decimalTo32Bytes(currentRoot),
        decimalTo32Bytes(request.nullifier),
        numberTo8Bytes(request.amount),
        new Uint8Array([request.assetType])
      );

      // Build accounts
      const accounts = [
        { pubkey: this.merkleAccountPDA!, isSigner: false, isWritable: true },
        { pubkey: this.treeTokenAccountPDA!, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(request.recipient), isSigner: false, isWritable: true },
        { pubkey: this.globalConfigPDA!, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      // Add proof data if ZK proof provided
      if (request.proof) {
        const proofBytes = formatProofBytes(request.proof);
        // Append proof to instruction data
        // (actual format depends on Privacy Cash program)
      }

      const result = await this.buildAndSendTransaction(instructionData, accounts);

      // Register nullifier
      this.indexer.registerNullifier(request.nullifier, result.signature);

      return {
        success: true,
        signature: result.signature,
        explorerUrl: this.getExplorerUrl(result.signature),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============ Query Methods ============

  /**
   * Get current Merkle root
   */
  getMerkleRoot(): string {
    return this.indexer.getMerkleRoot();
  }

  /**
   * Get Merkle proof for commitment
   */
  getMerkleProof(commitment: string): { path: string[]; indices: number[] } | null {
    return this.indexer.getMerkleProof(commitment);
  }

  /**
   * Check if nullifier is used
   */
  isNullifierUsed(nullifier: string): boolean {
    return this.indexer.isNullifierUsed(nullifier);
  }

  /**
   * Get relayer stats
   */
  getStats(): {
    relayerPubkey: string;
    fee: string;
    leafCount: number;
    nullifierCount: number;
  } {
    const indexerStats = this.indexer.getStats();
    return {
      relayerPubkey: this.keypair.publicKey.toBase58(),
      fee: this.config.fee.toString(),
      leafCount: indexerStats.leafCount,
      nullifierCount: indexerStats.nullifierCount,
    };
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<{
    found: boolean;
    status: string;
    confirmations?: number;
    err?: unknown;
  }> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      if (!status.value) {
        return { found: false, status: 'not_found' };
      }
      return {
        found: true,
        status: status.value.confirmationStatus || 'unknown',
        confirmations: status.value.confirmations || undefined,
        err: status.value.err,
      };
    } catch (error) {
      return { found: false, status: 'error' };
    }
  }

  // ============ Private Methods ============

  /**
   * Build and send a transaction
   */
  private async buildAndSendTransaction(
    instructionData: Uint8Array,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[]
  ): Promise<{ signature: string }> {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

    // Create instruction
    const instruction = new TransactionInstruction({
      programId: this.programId,
      keys: accounts.map(acc => ({
        pubkey: acc.pubkey,
        isSigner: acc.isSigner,
        isWritable: acc.isWritable,
      })),
      data: Buffer.from(instructionData),
    });

    // Build transaction with compute budget
    const transaction = new Transaction({
      feePayer: this.keypair.publicKey,
      recentBlockhash: blockhash,
    });

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })
    );
    transaction.add(instruction);

    // Sign and send
    transaction.sign(this.keypair);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      }
    );

    // Wait for confirmation
    await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return { signature };
  }

  /**
   * Get explorer URL for transaction
   */
  private getExplorerUrl(signature: string): string {
    const network = this.config.network || 'devnet';
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  }

  /**
   * Get the indexer instance
   */
  getIndexer(): PrivacyCashIndexer {
    return this.indexer;
  }

  /**
   * Get relayer public key
   */
  getPublicKey(): string {
    return this.keypair.publicKey.toBase58();
  }

  /**
   * Get relayer fee
   */
  getFee(): bigint {
    return this.config.fee;
  }
}

/**
 * Create a Privacy Cash relayer
 */
export function createRelayer(config: RelayerConfig): PrivacyCashRelayer {
  return new PrivacyCashRelayer(config);
}
