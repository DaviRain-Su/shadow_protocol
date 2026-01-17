/**
 * @px402/relayer - Privacy Cash Indexer
 *
 * Tracks Merkle tree state and nullifiers by indexing on-chain events.
 * Provides note discovery and balance computation.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as crypto from 'crypto';
import type {
  MerkleTreeState,
  NullifierState,
  IndexedNote,
  IndexerEvent,
} from './types.js';

// ============ Constants ============

const MERKLE_TREE_HEIGHT = 20;
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// ============ Merkle Tree ============

/**
 * Simple in-memory Merkle tree for indexing
 */
export class IndexerMerkleTree {
  private leaves: string[] = [];
  private height: number;
  private zeroValues: string[] = [];
  private rootHistory: string[] = [];
  private readonly maxRootHistory: number = 100; // Keep last 100 roots

  constructor(height: number = MERKLE_TREE_HEIGHT) {
    this.height = height;
    this.initZeroValues();
    // Initialize with empty tree root
    this.rootHistory.push(this.getRoot());
  }

  private initZeroValues(): void {
    this.zeroValues = [this.hashToField(BigInt(0))];
    for (let i = 1; i <= this.height; i++) {
      this.zeroValues.push(
        this.hashToField(this.zeroValues[i - 1], this.zeroValues[i - 1])
      );
    }
  }

  private hashToField(...inputs: (string | bigint)[]): string {
    const hash = crypto.createHash('sha256');
    for (const input of inputs) {
      if (typeof input === 'string') {
        hash.update(Buffer.from(input, 'hex').length === 32
          ? Buffer.from(input, 'hex')
          : Buffer.from(input));
      } else {
        hash.update(Buffer.from(input.toString(16).padStart(64, '0'), 'hex'));
      }
    }
    const digest = hash.digest('hex');
    const value = BigInt('0x' + digest) % FIELD_SIZE;
    return value.toString();
  }

  /**
   * Insert a new leaf (commitment)
   */
  insert(leaf: string): number {
    const index = this.leaves.length;
    this.leaves.push(leaf);

    // Update root history after insertion
    const newRoot = this.getRoot();
    this.addRootToHistory(newRoot);

    return index;
  }

  /**
   * Add a root to history, maintaining max size
   */
  private addRootToHistory(root: string): void {
    // Only add if different from last root
    if (this.rootHistory.length === 0 || this.rootHistory[this.rootHistory.length - 1] !== root) {
      this.rootHistory.push(root);
      // Trim if exceeds max
      if (this.rootHistory.length > this.maxRootHistory) {
        this.rootHistory.shift();
      }
    }
  }

  /**
   * Check if a root is valid (current or in history)
   */
  isKnownRoot(root: string): boolean {
    return this.rootHistory.includes(root);
  }

  /**
   * Get root history
   */
  getRootHistory(): string[] {
    return [...this.rootHistory];
  }

  /**
   * Batch insert leaves
   */
  insertBatch(leaves: string[]): number[] {
    const indices: number[] = [];
    for (const leaf of leaves) {
      indices.push(this.insert(leaf));
    }
    return indices;
  }

  /**
   * Get current root
   */
  getRoot(): string {
    if (this.leaves.length === 0) {
      return this.zeroValues[this.height];
    }
    return this.computeRoot();
  }

  private computeRoot(): string {
    const tree: string[][] = [this.leaves.slice()];
    const size = Math.pow(2, this.height);

    // Pad to power of 2
    while (tree[0].length < size) {
      tree[0].push(this.zeroValues[0]);
    }

    // Build tree levels
    for (let level = 0; level < this.height; level++) {
      const currentLevel = tree[level];
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || this.zeroValues[level];
        nextLevel.push(this.hashToField(left, right));
      }
      tree.push(nextLevel);
    }

    return tree[this.height][0];
  }

  /**
   * Get Merkle proof for a leaf
   */
  getMerkleProof(index: number): { path: string[]; indices: number[] } {
    const path: string[] = [];
    const indices: number[] = [];
    const size = Math.pow(2, this.height);

    let currentIndex = index;
    let level = [...this.leaves];

    while (level.length < size) {
      level.push(this.zeroValues[0]);
    }

    for (let i = 0; i < this.height; i++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      path.push(level[siblingIndex] || this.zeroValues[i]);
      indices.push(isRight ? 1 : 0);

      const nextLevel: string[] = [];
      for (let j = 0; j < level.length; j += 2) {
        const left = level[j];
        const right = level[j + 1] || this.zeroValues[i];
        nextLevel.push(this.hashToField(left, right));
      }
      level = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { path, indices };
  }

  /**
   * Verify a Merkle proof
   */
  verifyProof(leaf: string, index: number, proof: string[]): boolean {
    let current = leaf;
    let idx = index;

    for (let i = 0; i < proof.length; i++) {
      const isRight = idx % 2 === 1;
      current = isRight
        ? this.hashToField(proof[i], current)
        : this.hashToField(current, proof[i]);
      idx = Math.floor(idx / 2);
    }

    return current === this.getRoot();
  }

  /**
   * Get all leaves
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Get leaf count
   */
  getLeafCount(): number {
    return this.leaves.length;
  }

  /**
   * Export state for persistence
   */
  exportState(): MerkleTreeState {
    return {
      root: this.getRoot(),
      nextIndex: this.leaves.length,
      rootHistory: this.getRootHistory(),
      leaves: this.getLeaves(),
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: MerkleTreeState): void {
    this.leaves = [...state.leaves];
    this.rootHistory = [...(state.rootHistory || [])];
    // Ensure current root is in history
    const currentRoot = this.getRoot();
    if (!this.rootHistory.includes(currentRoot)) {
      this.rootHistory.push(currentRoot);
    }
  }
}

// ============ Nullifier Registry ============

/**
 * Nullifier registry for tracking used notes
 */
export class IndexerNullifierRegistry {
  private usedNullifiers: Set<string> = new Set();
  private txSignatures: Map<string, string> = new Map();
  private timestamps: Map<string, number> = new Map();

  /**
   * Register a used nullifier
   */
  register(nullifier: string, txSignature: string): boolean {
    if (this.usedNullifiers.has(nullifier)) {
      return false;
    }
    this.usedNullifiers.add(nullifier);
    this.txSignatures.set(nullifier, txSignature);
    this.timestamps.set(nullifier, Date.now());
    return true;
  }

  /**
   * Check if nullifier is used
   */
  isUsed(nullifier: string): boolean {
    return this.usedNullifiers.has(nullifier);
  }

  /**
   * Get transaction signature for nullifier
   */
  getTransaction(nullifier: string): string | undefined {
    return this.txSignatures.get(nullifier);
  }

  /**
   * Get count of used nullifiers
   */
  getCount(): number {
    return this.usedNullifiers.size;
  }

  /**
   * Export state
   */
  exportState(): NullifierState {
    return {
      used: new Set(this.usedNullifiers),
      txMap: new Map(this.txSignatures),
    };
  }

  /**
   * Import state
   */
  importState(state: NullifierState): void {
    this.usedNullifiers = new Set(state.used);
    this.txSignatures = new Map(state.txMap);
  }
}

// ============ Privacy Cash Indexer ============

/**
 * Privacy Cash Indexer Configuration
 */
export interface IndexerConfig {
  /** Solana RPC URL */
  rpcUrl: string;
  /** Privacy Cash program ID */
  programId: string;
  /** Polling interval in ms (default: 5000) */
  pollInterval?: number;
  /** Start slot for indexing (default: 0) */
  startSlot?: number;
}

/**
 * Privacy Cash Indexer
 *
 * Indexes on-chain events from Privacy Cash program:
 * - Deposits (new commitments)
 * - Withdrawals (nullifier usage)
 * - Transfers
 */
export class PrivacyCashIndexer {
  private config: IndexerConfig;
  private connection: Connection;
  private programId: PublicKey;
  private merkleTree: IndexerMerkleTree;
  private nullifierRegistry: IndexerNullifierRegistry;
  private notes: Map<string, IndexedNote> = new Map();
  private events: IndexerEvent[] = [];
  private lastProcessedSlot: number = 0;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config: IndexerConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.programId = new PublicKey(config.programId);
    this.merkleTree = new IndexerMerkleTree();
    this.nullifierRegistry = new IndexerNullifierRegistry();
    this.lastProcessedSlot = config.startSlot || 0;
  }

  /**
   * Start the indexer
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[Indexer] Starting Privacy Cash indexer...');

    // Initial sync
    await this.syncFromChain();

    // Start polling
    const interval = this.config.pollInterval || 5000;
    this.pollTimer = setInterval(() => {
      this.syncFromChain().catch(console.error);
    }, interval);

    console.log(`[Indexer] Started, polling every ${interval}ms`);
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[Indexer] Stopped');
  }

  /**
   * Sync state from on-chain data
   */
  private async syncFromChain(): Promise<void> {
    try {
      // Get latest slot
      const slot = await this.connection.getSlot();

      if (slot <= this.lastProcessedSlot) {
        return;
      }

      // Fetch program accounts or transaction logs
      // For now, we'll parse the Merkle tree account directly
      await this.syncMerkleState();
      await this.syncNullifierState();

      this.lastProcessedSlot = slot;
    } catch (error) {
      console.error('[Indexer] Sync error:', error);
    }
  }

  /**
   * Sync Merkle tree state from on-chain account
   */
  private async syncMerkleState(): Promise<void> {
    // Derive Merkle tree PDA
    const [merkleAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('merkle_tree')],
      this.programId
    );

    const accountInfo = await this.connection.getAccountInfo(merkleAccountPDA);
    if (!accountInfo) {
      return;
    }

    // Parse Merkle tree account data
    // Layout depends on Privacy Cash program structure
    const data = accountInfo.data;

    // Extract root (first 32 bytes typically)
    if (data.length >= 32) {
      const rootBytes = data.slice(0, 32);
      let root = BigInt(0);
      for (let i = 31; i >= 0; i--) {
        root = root * 256n + BigInt(rootBytes[i]);
      }
      // Root is stored in the account, we can verify our local tree matches
    }

    // Extract leaf count (usually at offset 32, 4 bytes)
    if (data.length >= 36) {
      const leafCount = data.readUInt32LE(32);
      // Sync leaves if count differs
    }
  }

  /**
   * Sync nullifier state from on-chain account
   */
  private async syncNullifierState(): Promise<void> {
    // This would parse the nullifier set from on-chain
    // Privacy Cash likely uses a different structure
  }

  // ============ Public API ============

  /**
   * Get current Merkle root
   */
  getMerkleRoot(): string {
    return this.merkleTree.getRoot();
  }

  /**
   * Get all leaves (commitments)
   */
  getLeaves(): string[] {
    return this.merkleTree.getLeaves();
  }

  /**
   * Get leaf count
   */
  getLeafCount(): number {
    return this.merkleTree.getLeafCount();
  }

  /**
   * Get Merkle proof for commitment
   */
  getMerkleProof(commitment: string): { path: string[]; indices: number[] } | null {
    const leaves = this.merkleTree.getLeaves();
    const index = leaves.indexOf(commitment);
    if (index === -1) {
      return null;
    }
    return this.merkleTree.getMerkleProof(index);
  }

  /**
   * Add a new commitment (manual insert for local testing)
   */
  addCommitment(commitment: string): number {
    return this.merkleTree.insert(commitment);
  }

  /**
   * Check if a root is known (current or in history)
   */
  isKnownRoot(root: string): boolean {
    return this.merkleTree.isKnownRoot(root);
  }

  /**
   * Get root history
   */
  getRootHistory(): string[] {
    return this.merkleTree.getRootHistory();
  }

  /**
   * Check if nullifier is used
   */
  isNullifierUsed(nullifier: string): boolean {
    return this.nullifierRegistry.isUsed(nullifier);
  }

  /**
   * Register a nullifier
   */
  registerNullifier(nullifier: string, txSignature: string): boolean {
    return this.nullifierRegistry.register(nullifier, txSignature);
  }

  /**
   * Get indexed note by commitment
   */
  getNote(commitment: string): IndexedNote | undefined {
    return this.notes.get(commitment);
  }

  /**
   * Add an indexed note
   */
  addNote(note: IndexedNote): void {
    this.notes.set(note.commitment, note);
  }

  /**
   * Get all events
   */
  getEvents(): IndexerEvent[] {
    return [...this.events];
  }

  /**
   * Get indexer stats
   */
  getStats(): {
    leafCount: number;
    nullifierCount: number;
    noteCount: number;
    lastProcessedSlot: number;
  } {
    return {
      leafCount: this.merkleTree.getLeafCount(),
      nullifierCount: this.nullifierRegistry.getCount(),
      noteCount: this.notes.size,
      lastProcessedSlot: this.lastProcessedSlot,
    };
  }

  /**
   * Get connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

/**
 * Create a Privacy Cash indexer
 */
export function createIndexer(config: IndexerConfig): PrivacyCashIndexer {
  return new PrivacyCashIndexer(config);
}
