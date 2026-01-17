/**
 * @px402/server - Nullifier Registry tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MemoryNullifierRegistry,
  createNullifierRegistry,
  getGlobalNullifierRegistry,
  setGlobalNullifierRegistry,
} from '../nullifier.js';
import type { NullifierInfo } from '../nullifier.js';

const createTestInfo = (nullifier: string): NullifierInfo => ({
  nullifier,
  txSignature: `sig-${nullifier}`,
  registeredAt: Date.now(),
  amount: '1000000',
  token: 'SOL',
  recipient: 'recipient-address',
});

describe('MemoryNullifierRegistry', () => {
  let registry: MemoryNullifierRegistry;

  beforeEach(() => {
    registry = new MemoryNullifierRegistry({ ttl: 0 }); // No expiry for tests
  });

  afterEach(() => {
    registry.stop();
  });

  describe('register', () => {
    it('should register new nullifier', async () => {
      const info = createTestInfo('nullifier1');
      const result = await registry.register(info);

      expect(result).toBe(true);
      expect(await registry.getCount()).toBe(1);
    });

    it('should reject duplicate nullifier', async () => {
      const info = createTestInfo('nullifier1');
      await registry.register(info);

      const result = await registry.register(info);

      expect(result).toBe(false);
    });

    it('should respect maxEntries limit', async () => {
      const smallRegistry = new MemoryNullifierRegistry({
        maxEntries: 3,
        ttl: 0,
      });

      await smallRegistry.register(createTestInfo('n1'));
      await smallRegistry.register(createTestInfo('n2'));
      await smallRegistry.register(createTestInfo('n3'));
      await smallRegistry.register(createTestInfo('n4'));

      expect(await smallRegistry.getCount()).toBe(3);
      smallRegistry.stop();
    });
  });

  describe('isUsed', () => {
    it('should return true for registered nullifier', async () => {
      await registry.register(createTestInfo('nullifier1'));

      expect(await registry.isUsed('nullifier1')).toBe(true);
    });

    it('should return false for unknown nullifier', async () => {
      expect(await registry.isUsed('unknown')).toBe(false);
    });

    it('should return false for expired nullifier', async () => {
      const shortTtlRegistry = new MemoryNullifierRegistry({
        ttl: 50,
        cleanupInterval: 0,
      });

      await shortTtlRegistry.register(createTestInfo('expired'));

      await new Promise((r) => setTimeout(r, 100));

      expect(await shortTtlRegistry.isUsed('expired')).toBe(false);
      shortTtlRegistry.stop();
    });
  });

  describe('getUsageInfo', () => {
    it('should return info for registered nullifier', async () => {
      const info = createTestInfo('nullifier1');
      await registry.register(info);

      const result = await registry.getUsageInfo('nullifier1');

      expect(result).not.toBeNull();
      expect(result?.txSignature).toBe(info.txSignature);
      expect(result?.amount).toBe(info.amount);
    });

    it('should return null for unknown nullifier', async () => {
      expect(await registry.getUsageInfo('unknown')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await registry.register(createTestInfo('n1'));
      await registry.register(createTestInfo('n2'));

      await registry.clear();

      expect(await registry.getCount()).toBe(0);
    });
  });

  describe('double-spend prevention', () => {
    it('should prevent reusing nullifier', async () => {
      const nullifier = 'payment-nullifier-123';

      // First payment succeeds
      const first = await registry.register(createTestInfo(nullifier));
      expect(first).toBe(true);

      // Second payment with same nullifier fails
      const second = await registry.register(createTestInfo(nullifier));
      expect(second).toBe(false);

      // Nullifier is marked as used
      expect(await registry.isUsed(nullifier)).toBe(true);
    });

    it('should allow different nullifiers', async () => {
      const result1 = await registry.register(createTestInfo('payment1'));
      const result2 = await registry.register(createTestInfo('payment2'));

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(await registry.getCount()).toBe(2);
    });
  });
});

describe('createNullifierRegistry', () => {
  it('should create registry instance', () => {
    const registry = createNullifierRegistry();
    expect(registry).toBeInstanceOf(MemoryNullifierRegistry);
    (registry as MemoryNullifierRegistry).stop();
  });
});

describe('global registry', () => {
  it('should return same instance', () => {
    const r1 = getGlobalNullifierRegistry();
    const r2 = getGlobalNullifierRegistry();
    expect(r1).toBe(r2);
  });

  it('should allow setting custom registry', async () => {
    const custom = new MemoryNullifierRegistry({ ttl: 0 });
    await custom.register(createTestInfo('test'));

    setGlobalNullifierRegistry(custom);

    expect(await getGlobalNullifierRegistry().isUsed('test')).toBe(true);
    custom.stop();
  });
});
