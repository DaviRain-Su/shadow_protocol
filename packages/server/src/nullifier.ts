/**
 * @px402/server - Nullifier Registry
 *
 * Tracks used nullifiers to prevent double-spend attacks
 */

import type { StorageAdapter } from './storage.js';

/**
 * Nullifier usage information
 */
export interface NullifierInfo {
  /** The nullifier hash */
  nullifier: string;

  /** Transaction signature that used this nullifier */
  txSignature: string;

  /** Timestamp when registered */
  registeredAt: number;

  /** Payment amount */
  amount: string;

  /** Token */
  token: string;

  /** Recipient address */
  recipient: string;
}

/**
 * Nullifier registry configuration
 */
export interface NullifierRegistryConfig {
  /** TTL for nullifier entries (ms), 0 = never expire */
  ttl?: number;

  /** Maximum entries before cleanup */
  maxEntries?: number;

  /** Cleanup interval (ms) */
  cleanupInterval?: number;
}

/**
 * Nullifier registry interface
 */
export interface NullifierRegistry {
  /**
   * Register a nullifier as used
   * @returns false if nullifier already exists (double-spend attempt)
   */
  register(info: NullifierInfo): Promise<boolean>;

  /**
   * Check if a nullifier has been used
   */
  isUsed(nullifier: string): Promise<boolean>;

  /**
   * Get usage information for a nullifier
   */
  getUsageInfo(nullifier: string): Promise<NullifierInfo | null>;

  /**
   * Get count of registered nullifiers
   */
  getCount(): Promise<number>;

  /**
   * Clear all entries (for testing)
   */
  clear(): Promise<void>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<NullifierRegistryConfig> = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 100000,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

/**
 * In-memory nullifier registry implementation
 */
export class MemoryNullifierRegistry implements NullifierRegistry {
  private entries: Map<string, NullifierInfo> = new Map();
  private config: Required<NullifierRegistryConfig>;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: NullifierRegistryConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Start cleanup timer if TTL is set
    if (this.config.ttl > 0 && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Stop cleanup timer
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async register(info: NullifierInfo): Promise<boolean> {
    // Check if already exists
    if (this.entries.has(info.nullifier)) {
      return false;
    }

    // Check max entries
    if (this.entries.size >= this.config.maxEntries) {
      this.cleanup();

      // If still at max, remove oldest entry
      if (this.entries.size >= this.config.maxEntries) {
        const oldest = this.findOldestEntry();
        if (oldest) {
          this.entries.delete(oldest);
        }
      }
    }

    this.entries.set(info.nullifier, {
      ...info,
      registeredAt: Date.now(),
    });

    return true;
  }

  async isUsed(nullifier: string): Promise<boolean> {
    const info = this.entries.get(nullifier);
    if (!info) {
      return false;
    }

    // Check if expired
    if (this.isExpired(info)) {
      this.entries.delete(nullifier);
      return false;
    }

    return true;
  }

  async getUsageInfo(nullifier: string): Promise<NullifierInfo | null> {
    const info = this.entries.get(nullifier);
    if (!info) {
      return null;
    }

    // Check if expired
    if (this.isExpired(info)) {
      this.entries.delete(nullifier);
      return null;
    }

    return info;
  }

  async getCount(): Promise<number> {
    return this.entries.size;
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(info: NullifierInfo): boolean {
    if (this.config.ttl === 0) {
      return false;
    }
    return Date.now() - info.registeredAt > this.config.ttl;
  }

  /**
   * Find the oldest entry
   */
  private findOldestEntry(): string | undefined {
    let oldest: string | undefined;
    let oldestTime = Infinity;

    for (const [nullifier, info] of this.entries) {
      if (info.registeredAt < oldestTime) {
        oldestTime = info.registeredAt;
        oldest = nullifier;
      }
    }

    return oldest;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): number {
    if (this.config.ttl === 0) {
      return 0;
    }

    let cleaned = 0;
    const now = Date.now();

    for (const [nullifier, info] of this.entries) {
      if (now - info.registeredAt > this.config.ttl) {
        this.entries.delete(nullifier);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============ Persistent Nullifier Registry ============

/**
 * Persistent nullifier registry configuration
 */
export interface PersistentNullifierRegistryConfig extends NullifierRegistryConfig {
  /** Storage adapter */
  storage: StorageAdapter;
  /** Key prefix for nullifier entries */
  keyPrefix?: string;
}

/**
 * Persistent nullifier registry using storage adapter
 *
 * Stores nullifier data in a persistent storage backend.
 * Suitable for production deployments.
 */
export class PersistentNullifierRegistry implements NullifierRegistry {
  private storage: StorageAdapter;
  private config: Required<NullifierRegistryConfig>;
  private keyPrefix: string;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: PersistentNullifierRegistryConfig) {
    this.storage = config.storage;
    this.keyPrefix = config.keyPrefix || 'nullifier:';
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Start cleanup timer if TTL is set
    if (this.config.ttl > 0 && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(console.error);
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Stop cleanup timer and close storage
   */
  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    await this.storage.close();
  }

  private getKey(nullifier: string): string {
    return `${this.keyPrefix}${nullifier}`;
  }

  async register(info: NullifierInfo): Promise<boolean> {
    const key = this.getKey(info.nullifier);

    // Check if already exists
    if (await this.storage.has(key)) {
      return false;
    }

    // Check max entries
    const count = await this.storage.count();
    if (count >= this.config.maxEntries) {
      await this.cleanup();
    }

    // Store entry
    const data = JSON.stringify({
      ...info,
      registeredAt: Date.now(),
    });

    await this.storage.set(key, data, this.config.ttl || undefined);
    return true;
  }

  async isUsed(nullifier: string): Promise<boolean> {
    const key = this.getKey(nullifier);
    return this.storage.has(key);
  }

  async getUsageInfo(nullifier: string): Promise<NullifierInfo | null> {
    const key = this.getKey(nullifier);
    const data = await this.storage.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as NullifierInfo;
    } catch {
      return null;
    }
  }

  async getCount(): Promise<number> {
    const keys = await this.storage.keys(`${this.keyPrefix}*`);
    return keys.length;
  }

  async clear(): Promise<void> {
    const keys = await this.storage.keys(`${this.keyPrefix}*`);
    for (const key of keys) {
      await this.storage.delete(key);
    }
  }

  /**
   * Cleanup expired entries
   */
  private async cleanup(): Promise<number> {
    if (this.config.ttl === 0) {
      return 0;
    }

    let cleaned = 0;
    const now = Date.now();
    const keys = await this.storage.keys(`${this.keyPrefix}*`);

    for (const key of keys) {
      const data = await this.storage.get(key);
      if (!data) continue;

      try {
        const info = JSON.parse(data) as NullifierInfo;
        if (now - info.registeredAt > this.config.ttl) {
          await this.storage.delete(key);
          cleaned++;
        }
      } catch {
        // Invalid data, remove it
        await this.storage.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Create nullifier registry
 */
export function createNullifierRegistry(
  config?: NullifierRegistryConfig
): NullifierRegistry {
  return new MemoryNullifierRegistry(config);
}

/**
 * Create persistent nullifier registry
 */
export function createPersistentNullifierRegistry(
  config: PersistentNullifierRegistryConfig
): PersistentNullifierRegistry {
  return new PersistentNullifierRegistry(config);
}

/**
 * Global registry instance (for simple use cases)
 */
let globalRegistry: NullifierRegistry | undefined;

/**
 * Get or create global nullifier registry
 */
export function getGlobalNullifierRegistry(): NullifierRegistry {
  if (!globalRegistry) {
    globalRegistry = createNullifierRegistry();
  }
  return globalRegistry;
}

/**
 * Set global nullifier registry (for testing or custom implementations)
 */
export function setGlobalNullifierRegistry(registry: NullifierRegistry): void {
  globalRegistry = registry;
}
