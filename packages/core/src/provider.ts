/**
 * @px402/core - Privacy Provider Interface
 * Abstract interface for privacy payment providers
 */

import type {
  ChainId,
  TokenId,
  DepositParams,
  DepositNote,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
  PaymentProof,
  StealthAddress,
  PoolInfo,
} from './types.js';

/**
 * Parameters for generating payment proof
 */
export interface GenerateProofParams {
  /** Deposit note to spend */
  note: DepositNote;
  /** Recipient address */
  recipient: string;
  /** Amount to pay */
  amount: bigint;
}

/**
 * Privacy provider configuration
 */
export interface PrivacyProviderConfig {
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Wallet or signer */
  wallet?: unknown;
}

/**
 * Privacy payment provider interface
 * All chain implementations must conform to this interface
 */
export interface PrivacyProvider {
  /** Chain identifier */
  readonly chainId: ChainId;

  // ============ Pool Operations ============

  /**
   * Deposit funds into privacy pool
   * @param params Deposit parameters (token, amount)
   * @returns Deposit result with note
   */
  deposit(params: DepositParams): Promise<DepositResult>;

  /**
   * Withdraw funds from privacy pool
   * @param params Withdrawal parameters (note, recipient, relayer)
   * @returns Withdrawal result
   */
  withdraw(params: WithdrawParams): Promise<WithdrawResult>;

  /**
   * Get private balance for a token
   * Sum of all unspent notes
   * @param token Token identifier
   * @returns Total private balance
   */
  getPrivateBalance(token: TokenId): Promise<bigint>;

  /**
   * Get available privacy pools
   * @param token Optional token filter
   * @returns List of pool info
   */
  getPools(token?: TokenId): Promise<PoolInfo[]>;

  // ============ Proof Generation ============

  /**
   * Generate payment proof for x402 verification
   * This executes a private withdrawal and returns proof
   * @param params Proof generation parameters
   * @returns Payment proof
   */
  generatePaymentProof(params: GenerateProofParams): Promise<PaymentProof>;

  /**
   * Verify a payment proof
   * @param proof Payment proof to verify
   * @returns True if proof is valid
   */
  verifyPaymentProof(proof: PaymentProof): Promise<boolean>;

  // ============ Address Management ============

  /**
   * Generate one-time stealth address for receiving
   * Each transaction should use a new address
   * @returns Stealth address
   */
  generateStealthAddress(): Promise<StealthAddress>;

  // ============ Note Management ============

  /**
   * Get all deposit notes
   * @returns List of deposit notes
   */
  getNotes(): Promise<DepositNote[]>;

  /**
   * Get unspent deposit notes
   * @returns List of unspent notes
   */
  getUnspentNotes(): Promise<DepositNote[]>;

  /**
   * Save a deposit note
   * @param note Note to save
   */
  saveNote(note: DepositNote): Promise<void>;

  /**
   * Delete a deposit note (after spending)
   * @param commitment Note commitment to delete
   */
  deleteNote(commitment: string): Promise<void>;

  /**
   * Check if a note has been spent
   * @param commitment Note commitment
   * @returns True if spent
   */
  isNoteSpent(commitment: string): Promise<boolean>;
}

/**
 * Abstract base class for privacy providers
 * Provides common functionality
 */
export abstract class BasePrivacyProvider implements PrivacyProvider {
  abstract readonly chainId: ChainId;

  protected notes: Map<string, DepositNote> = new Map();
  protected spentNullifiers: Set<string> = new Set();

  abstract deposit(params: DepositParams): Promise<DepositResult>;
  abstract withdraw(params: WithdrawParams): Promise<WithdrawResult>;
  abstract getPrivateBalance(token: TokenId): Promise<bigint>;
  abstract getPools(token?: TokenId): Promise<PoolInfo[]>;
  abstract generatePaymentProof(params: GenerateProofParams): Promise<PaymentProof>;
  abstract verifyPaymentProof(proof: PaymentProof): Promise<boolean>;
  abstract generateStealthAddress(): Promise<StealthAddress>;

  async getNotes(): Promise<DepositNote[]> {
    return Array.from(this.notes.values());
  }

  async getUnspentNotes(): Promise<DepositNote[]> {
    const notes = await this.getNotes();
    const unspent: DepositNote[] = [];

    for (const note of notes) {
      const isSpent = await this.isNoteSpent(note.commitment);
      if (!isSpent) {
        unspent.push(note);
      }
    }

    return unspent;
  }

  async saveNote(note: DepositNote): Promise<void> {
    this.notes.set(note.commitment, note);
  }

  async deleteNote(commitment: string): Promise<void> {
    this.notes.delete(commitment);
  }

  async isNoteSpent(commitment: string): Promise<boolean> {
    const note = this.notes.get(commitment);
    if (!note) return true; // Unknown note considered spent
    return this.spentNullifiers.has(note.nullifier);
  }

  /**
   * Mark a note as spent locally
   * @param nullifier Nullifier hash
   */
  protected markSpent(nullifier: string): void {
    this.spentNullifiers.add(nullifier);
  }

  /**
   * Find a suitable note for a payment
   * @param token Token to pay with
   * @param amount Amount needed
   * @returns Suitable note or undefined
   */
  protected async findNoteForPayment(
    token: TokenId,
    amount: bigint
  ): Promise<DepositNote | undefined> {
    const notes = await this.getUnspentNotes();
    return notes.find(
      (n) => n.token === token && n.amount >= amount
    );
  }
}
