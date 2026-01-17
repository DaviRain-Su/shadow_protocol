/**
 * @px402/server - Persistent Storage Adapters
 *
 * Provides storage backends for NullifierRegistry.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============ Storage Interface ============

/**
 * Storage adapter interface for nullifier persistence
 */
export interface StorageAdapter {
  /** Get a value by key */
  get(key: string): Promise<string | null>;
  /** Set a key-value pair */
  set(key: string, value: string, ttl?: number): Promise<void>;
  /** Delete a key */
  delete(key: string): Promise<boolean>;
  /** Check if key exists */
  has(key: string): Promise<boolean>;
  /** Get all keys matching a pattern */
  keys(pattern?: string): Promise<string[]>;
  /** Get count of keys */
  count(): Promise<number>;
  /** Clear all data */
  clear(): Promise<void>;
  /** Close the storage connection */
  close(): Promise<void>;
}

// ============ Memory Storage ============

/**
 * In-memory storage (default, non-persistent)
 */
export class MemoryStorage implements StorageAdapter {
  private data: Map<string, { value: string; expires?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.data.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : undefined,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    if (!pattern) return allKeys;
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter((k) => regex.test(k));
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async close(): Promise<void> {
    // No-op for memory storage
  }
}

// ============ File Storage ============

/**
 * File-based storage configuration
 */
export interface FileStorageConfig {
  /** Directory to store data files */
  dataDir: string;
  /** Auto-save interval in ms (default: 30000) */
  saveInterval?: number;
  /** Pretty print JSON (default: false) */
  prettyPrint?: boolean;
}

/**
 * File-based persistent storage
 *
 * Stores data as JSON files on disk.
 * Suitable for development and small deployments.
 */
export class FileStorage implements StorageAdapter {
  private data: Map<string, { value: string; expires?: number }> = new Map();
  private config: Required<FileStorageConfig>;
  private saveTimer: NodeJS.Timeout | null = null;
  private dirty = false;
  private filePath: string;

  constructor(config: FileStorageConfig) {
    this.config = {
      dataDir: config.dataDir,
      saveInterval: config.saveInterval ?? 30000,
      prettyPrint: config.prettyPrint ?? false,
    };
    this.filePath = path.join(this.config.dataDir, 'nullifiers.json');

    // Ensure directory exists
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }

    // Load existing data
    this.loadSync();

    // Start auto-save timer
    if (this.config.saveInterval > 0) {
      this.saveTimer = setInterval(() => {
        if (this.dirty) {
          this.saveSync();
        }
      }, this.config.saveInterval);
    }
  }

  private loadSync(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const entries = JSON.parse(content) as Array<[string, { value: string; expires?: number }]>;
        this.data = new Map(entries);
        console.log(`[FileStorage] Loaded ${this.data.size} entries from ${this.filePath}`);
      }
    } catch (error) {
      console.error('[FileStorage] Failed to load data:', error);
    }
  }

  private saveSync(): void {
    try {
      const entries = Array.from(this.data.entries());
      const content = this.config.prettyPrint
        ? JSON.stringify(entries, null, 2)
        : JSON.stringify(entries);
      fs.writeFileSync(this.filePath, content, 'utf-8');
      this.dirty = false;
    } catch (error) {
      console.error('[FileStorage] Failed to save data:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.data.delete(key);
      this.dirty = true;
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.data.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : undefined,
    });
    this.dirty = true;
  }

  async delete(key: string): Promise<boolean> {
    const result = this.data.delete(key);
    if (result) this.dirty = true;
    return result;
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    if (!pattern) return allKeys;
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter((k) => regex.test(k));
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  async clear(): Promise<void> {
    this.data.clear();
    this.dirty = true;
  }

  async close(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.dirty) {
      this.saveSync();
    }
  }

  /**
   * Force save to disk
   */
  async flush(): Promise<void> {
    this.saveSync();
  }
}

// ============ Factory ============

/**
 * Storage type enum
 */
export type StorageType = 'memory' | 'file';

/**
 * Create a storage adapter
 */
export function createStorage(
  type: StorageType,
  config?: Partial<FileStorageConfig>
): StorageAdapter {
  switch (type) {
    case 'file':
      return new FileStorage({
        dataDir: config?.dataDir || './data',
        saveInterval: config?.saveInterval,
        prettyPrint: config?.prettyPrint,
      });
    case 'memory':
    default:
      return new MemoryStorage();
  }
}
