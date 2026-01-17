/**
 * @px402/core - Deposit Note Management
 * Utilities for managing deposit notes
 */

import type { DepositNote, ChainId, TokenId } from './types.js';

/**
 * Note storage interface
 * Implementations can store notes in memory, localStorage, or encrypted storage
 */
export interface NoteStorage {
  /**
   * Save a note
   */
  save(note: DepositNote): Promise<void>;

  /**
   * Get a note by commitment
   */
  get(commitment: string): Promise<DepositNote | undefined>;

  /**
   * Get all notes
   */
  getAll(): Promise<DepositNote[]>;

  /**
   * Delete a note
   */
  delete(commitment: string): Promise<void>;

  /**
   * Clear all notes
   */
  clear(): Promise<void>;
}

/**
 * In-memory note storage
 * For development and testing
 */
export class MemoryNoteStorage implements NoteStorage {
  private notes: Map<string, DepositNote> = new Map();

  async save(note: DepositNote): Promise<void> {
    this.notes.set(note.commitment, note);
  }

  async get(commitment: string): Promise<DepositNote | undefined> {
    return this.notes.get(commitment);
  }

  async getAll(): Promise<DepositNote[]> {
    return Array.from(this.notes.values());
  }

  async delete(commitment: string): Promise<void> {
    this.notes.delete(commitment);
  }

  async clear(): Promise<void> {
    this.notes.clear();
  }
}

/**
 * Note manager for handling deposit notes
 */
export class NoteManager {
  constructor(private storage: NoteStorage) {}

  /**
   * Save a deposit note
   */
  async saveNote(note: DepositNote): Promise<void> {
    await this.storage.save(note);
  }

  /**
   * Get all notes
   */
  async getAllNotes(): Promise<DepositNote[]> {
    return this.storage.getAll();
  }

  /**
   * Get notes for a specific chain
   */
  async getNotesByChain(chainId: ChainId): Promise<DepositNote[]> {
    const notes = await this.storage.getAll();
    return notes.filter((n) => n.chainId === chainId);
  }

  /**
   * Get notes for a specific token
   */
  async getNotesByToken(token: TokenId): Promise<DepositNote[]> {
    const notes = await this.storage.getAll();
    return notes.filter((n) => n.token === token);
  }

  /**
   * Get notes with minimum amount
   */
  async getNotesWithMinAmount(
    token: TokenId,
    minAmount: bigint
  ): Promise<DepositNote[]> {
    const notes = await this.storage.getAll();
    return notes.filter(
      (n) => n.token === token && n.amount >= minAmount
    );
  }

  /**
   * Find best note for a payment
   * Prefers smallest note that covers the amount
   */
  async findBestNoteForPayment(
    token: TokenId,
    amount: bigint,
    chainId?: ChainId
  ): Promise<DepositNote | undefined> {
    let notes = await this.getNotesWithMinAmount(token, amount);

    if (chainId) {
      notes = notes.filter((n) => n.chainId === chainId);
    }

    if (notes.length === 0) {
      return undefined;
    }

    // Sort by amount ascending to find smallest sufficient note
    notes.sort((a, b) => {
      if (a.amount < b.amount) return -1;
      if (a.amount > b.amount) return 1;
      return 0;
    });

    return notes[0];
  }

  /**
   * Calculate total balance for a token
   */
  async getBalance(token: TokenId, chainId?: ChainId): Promise<bigint> {
    let notes = await this.getNotesByToken(token);

    if (chainId) {
      notes = notes.filter((n) => n.chainId === chainId);
    }

    return notes.reduce((sum, n) => sum + n.amount, 0n);
  }

  /**
   * Delete a note (after spending)
   */
  async deleteNote(commitment: string): Promise<void> {
    await this.storage.delete(commitment);
  }

  /**
   * Export notes as JSON for backup
   */
  async exportNotes(): Promise<string> {
    const notes = await this.storage.getAll();
    // Convert bigint to string for JSON serialization
    const serializable = notes.map((n) => ({
      ...n,
      amount: n.amount.toString(),
    }));
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Import notes from JSON backup
   */
  async importNotes(json: string): Promise<number> {
    const data = JSON.parse(json) as Array<Record<string, unknown>>;
    let count = 0;

    for (const item of data) {
      const note: DepositNote = {
        chainId: item.chainId as ChainId,
        poolAddress: item.poolAddress as string,
        commitment: item.commitment as string,
        nullifier: item.nullifier as string,
        secret: item.secret as string,
        leafIndex: item.leafIndex as number,
        amount: BigInt(item.amount as string),
        token: item.token as TokenId,
        timestamp: item.timestamp as number,
      };
      await this.storage.save(note);
      count++;
    }

    return count;
  }
}

/**
 * Serialize a deposit note to string
 * Format: chainId:commitment:nullifier:secret:leafIndex:amount:token:timestamp
 */
export function serializeNote(note: DepositNote): string {
  const parts = [
    note.chainId,
    note.poolAddress,
    note.commitment,
    note.nullifier,
    note.secret,
    note.leafIndex.toString(),
    note.amount.toString(),
    note.token,
    note.timestamp.toString(),
  ];
  return Buffer.from(parts.join(':')).toString('base64');
}

/**
 * Deserialize a note string
 */
export function deserializeNote(encoded: string): DepositNote {
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const parts = decoded.split(':');

  if (parts.length !== 9) {
    throw new Error('Invalid note format');
  }

  return {
    chainId: parts[0] as ChainId,
    poolAddress: parts[1],
    commitment: parts[2],
    nullifier: parts[3],
    secret: parts[4],
    leafIndex: parseInt(parts[5], 10),
    amount: BigInt(parts[6]),
    token: parts[7],
    timestamp: parseInt(parts[8], 10),
  };
}
