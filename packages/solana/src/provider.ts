/**
 * @px402/solana - Solana Privacy Provider
 * Implementation of PrivacyProvider for Solana using Privacy Cash
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import type {
  PrivacyProvider,
  GenerateProofParams,
  DepositParams,
  DepositResult,
  DepositNote,
  WithdrawParams,
  WithdrawResult,
  PaymentProof,
  StealthAddress,
  PoolInfo,
  TokenId,
  Px402Error,
  Px402ErrorCode,
} from '@px402/core';
import {
  PrivacyCashAdapter,
  type PrivacyCashConfig,
} from './privacy-cash.js';

// ============ Types ============

/**
 * Solana provider configuration
 */
export interface SolanaProviderConfig {
  /** Solana RPC endpoint */
  rpcUrl: string;
  /** Wallet keypair */
  wallet: Keypair;
  /** Privacy Cash configuration */
  privacyCash?: Partial<PrivacyCashConfig>;
  /** Network: mainnet, devnet, testnet */
  network?: 'mainnet' | 'devnet' | 'testnet';
}

// ============ Provider Implementation ============

/**
 * Solana Privacy Provider
 * Implements PrivacyProvider using Privacy Cash SDK
 */
export class SolanaPrivacyProvider implements PrivacyProvider {
  readonly chainId = 'solana' as const;

  private adapter: PrivacyCashAdapter;
  private notes: Map<string, DepositNote> = new Map();
  private spentNullifiers: Set<string> = new Set();
  private initialized = false;
  private config: SolanaProviderConfig;

  constructor(config: SolanaProviderConfig) {
    this.config = config;
    this.adapter = new PrivacyCashAdapter({
      rpcUrl: config.rpcUrl,
      wallet: config.wallet,
      network: config.network || 'devnet',
      ...config.privacyCash,
    });
  }

  /**
   * Initialize the provider
   * Must be called before using other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.adapter.initialize();
    this.initialized = true;
  }

  /**
   * Ensure provider is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SolanaPrivacyProvider not initialized. Call initialize() first.');
    }
  }

  // ============ Pool Operations ============

  async deposit(params: DepositParams): Promise<DepositResult> {
    this.ensureInitialized();

    const result = await this.adapter.deposit(params.token, params.amount);

    const note: DepositNote = {
      chainId: 'solana',
      poolAddress: result.poolAddress,
      commitment: result.commitment,
      nullifier: result.nullifier,
      secret: result.secret,
      leafIndex: result.leafIndex,
      amount: params.amount,
      token: params.token,
      timestamp: Date.now(),
    };

    await this.saveNote(note);

    return {
      txHash: result.signature,
      note,
    };
  }

  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    this.ensureInitialized();

    const result = await this.adapter.withdraw(
      params.note,
      params.recipient,
      params.relayer
    );

    // Mark note as spent
    this.spentNullifiers.add(params.note.nullifier);
    await this.deleteNote(params.note.commitment);

    return {
      txHash: result.signature,
      nullifierHash: result.nullifierHash,
      recipient: params.recipient,
    };
  }

  async getPrivateBalance(token: TokenId): Promise<bigint> {
    this.ensureInitialized();

    // Sum up all unspent notes for the token
    const notes = await this.getUnspentNotes();
    return notes
      .filter((n) => n.token === token)
      .reduce((sum, n) => sum + n.amount, 0n);
  }

  async getPools(token?: TokenId): Promise<PoolInfo[]> {
    this.ensureInitialized();

    const pools = await this.adapter.getPools();

    let filtered = pools;
    if (token) {
      filtered = pools.filter((p) => p.token === token || p.token === 'SOL');
    }

    return filtered.map((p) => ({
      address: p.address,
      token: p.token,
      denomination: p.denomination,
      depositCount: p.depositCount,
      chainId: 'solana' as const,
    }));
  }

  // ============ Proof Generation ============

  async generatePaymentProof(params: GenerateProofParams): Promise<PaymentProof> {
    this.ensureInitialized();

    // Execute withdrawal to generate proof (with optional relayer)
    const result = await this.withdraw({
      note: params.note,
      recipient: params.recipient,
      relayer: params.relayer,
    });

    return {
      chainId: 'solana',
      proofType: 'transfer',
      proof: result.txHash,
      metadata: {
        amount: params.amount,
        token: params.note.token,
        timestamp: Date.now(),
      },
    };
  }

  async verifyPaymentProof(proof: PaymentProof): Promise<boolean> {
    this.ensureInitialized();

    if (proof.chainId !== 'solana') {
      return false;
    }

    // Verify by checking transaction on chain
    try {
      const connection = this.adapter.getConnection();
      const tx = await connection.getTransaction(proof.proof, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return false;
      }

      // Transaction exists and is confirmed
      // Parse transaction to verify amount
      const verificationResult = this.parseAndVerifyTransaction(tx, proof);
      return verificationResult.valid;
    } catch {
      return false;
    }
  }

  /**
   * Parse transaction and verify payment details
   */
  private parseAndVerifyTransaction(
    tx: {
      meta: {
        preBalances: number[];
        postBalances: number[];
        err: unknown;
      } | null;
      transaction: {
        message: {
          getAccountKeys(): { get(index: number): PublicKey | undefined };
          compiledInstructions: Array<{
            programIdIndex: number;
            accountKeyIndexes: number[];
            data: Uint8Array;
          }>;
        };
      };
    },
    proof: PaymentProof
  ): { valid: boolean; reason?: string } {
    // Check transaction succeeded
    if (tx.meta?.err) {
      return { valid: false, reason: 'Transaction failed' };
    }

    if (!tx.meta) {
      return { valid: false, reason: 'Transaction metadata not available' };
    }

    // Parse balance changes to verify transfer amount
    const { preBalances, postBalances } = tx.meta;

    // Verify amount if specified in metadata
    if (proof.metadata?.amount) {
      // Calculate total outgoing amount from sender (first account typically)
      const senderBalanceChange = preBalances[0] - postBalances[0];

      // Account for transaction fees (typically 5000 lamports)
      const minExpectedChange = proof.metadata.amount;

      if (BigInt(senderBalanceChange) < minExpectedChange) {
        return {
          valid: false,
          reason: `Amount mismatch: expected at least ${minExpectedChange}`,
        };
      }
    }

    // Verify token if specified
    if (proof.metadata?.token && proof.metadata.token !== 'SOL') {
      // For SPL tokens, we need to parse token transfer instructions
      // This is a simplified check - full implementation would parse
      // the token program instructions
      const accountKeys = tx.transaction.message.getAccountKeys();
      const hasTokenInstruction = tx.transaction.message.compiledInstructions.some((ix) => {
        const programId = accountKeys.get(ix.programIdIndex)?.toBase58();
        // SPL Token program IDs
        return (
          programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ||
          programId === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
        );
      });

      if (!hasTokenInstruction) {
        return { valid: false, reason: 'Expected SPL token transfer not found' };
      }
    }

    return { valid: true };
  }

  // ============ Address Management ============

  async generateStealthAddress(): Promise<StealthAddress> {
    // Generate ephemeral keypair for one-time address
    const ephemeral = Keypair.generate();

    return {
      address: ephemeral.publicKey.toBase58(),
      ephemeralPubKey: ephemeral.publicKey.toBase58(),
    };
  }

  // ============ Note Management ============

  async getNotes(): Promise<DepositNote[]> {
    return Array.from(this.notes.values());
  }

  async getUnspentNotes(): Promise<DepositNote[]> {
    const notes = await this.getNotes();
    return notes.filter((n) => !this.spentNullifiers.has(n.nullifier));
  }

  async saveNote(note: DepositNote): Promise<void> {
    this.notes.set(note.commitment, note);
  }

  async deleteNote(commitment: string): Promise<void> {
    this.notes.delete(commitment);
  }

  async isNoteSpent(commitment: string): Promise<boolean> {
    const note = this.notes.get(commitment);
    if (!note) return true;

    // Check local cache first
    if (this.spentNullifiers.has(note.nullifier)) {
      return true;
    }

    // Check on-chain if initialized
    if (this.initialized) {
      try {
        const isUsed = await this.adapter.isNullifierUsed(note.nullifier);
        if (isUsed) {
          this.spentNullifiers.add(note.nullifier);
        }
        return isUsed;
      } catch {
        return false;
      }
    }

    return false;
  }

  // ============ Utility Methods ============

  /**
   * Find a suitable note for a payment
   */
  async findNoteForPayment(
    token: TokenId,
    amount: bigint
  ): Promise<DepositNote | undefined> {
    const notes = await this.getUnspentNotes();
    return notes.find((n) => n.token === token && n.amount >= amount);
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): PrivacyCashAdapter {
    return this.adapter;
  }

  /**
   * Export notes for backup
   */
  async exportNotes(): Promise<string> {
    const notes = await this.getNotes();
    const serializable = notes.map((n) => ({
      ...n,
      amount: n.amount.toString(),
    }));
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Import notes from backup
   */
  async importNotes(json: string): Promise<number> {
    const data = JSON.parse(json) as Array<Record<string, unknown>>;
    let count = 0;

    for (const item of data) {
      const note: DepositNote = {
        chainId: 'solana',
        poolAddress: item.poolAddress as string,
        commitment: item.commitment as string,
        nullifier: item.nullifier as string,
        secret: item.secret as string,
        leafIndex: item.leafIndex as number,
        amount: BigInt(item.amount as string),
        token: item.token as string,
        timestamp: item.timestamp as number,
      };
      await this.saveNote(note);
      count++;
    }

    return count;
  }
}

/**
 * Create a Solana privacy provider
 * Factory function for convenience
 */
export function createSolanaProvider(
  config: SolanaProviderConfig
): SolanaPrivacyProvider {
  return new SolanaPrivacyProvider(config);
}
