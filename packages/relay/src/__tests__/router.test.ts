/**
 * @px402/relay - Router tests
 */

import { describe, it, expect } from 'vitest';
import { Router, createRouter } from '../router.js';
import type { PeerInfo } from '../types.js';

const createTestPeers = (count: number): PeerInfo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `peer${i + 1}`,
    address: `localhost:${8400 + i}`,
    publicKey: `pubkey-${i + 1}`,
    lastSeen: Date.now(),
    reputation: 50 + i * 10,
    protocols: ['relay-v1'],
    feeConfig: { minFee: `${1000 + i * 500}`, feeToken: 'SOL' },
    isBootstrap: false,
  }));
};

describe('Router', () => {
  describe('findRoute', () => {
    it('should find route with default hops', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers);

      expect(result.route).toBeDefined();
      expect(result.route.nodes.length).toBe(3);
      expect(result.route.totalFee).toBeTruthy();
    });

    it('should find route with specified hops', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers, { hops: 2 });

      expect(result.route.nodes.length).toBe(2);
    });

    it('should throw if not enough peers', () => {
      const router = new Router();
      const peers = createTestPeers(2);

      expect(() => router.findRoute(peers, { hops: 3 })).toThrow(
        'Not enough peers'
      );
    });

    it('should exclude specified nodes', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers, {
        hops: 2,
        excludeNodes: ['peer1', 'peer2'],
      });

      expect(result.route.nodes).not.toContain('peer1');
      expect(result.route.nodes).not.toContain('peer2');
    });

    it('should respect maxFee', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers, {
        hops: 2,
        maxFee: '1500',
      });

      // Only peers with fee <= 1500 should be included
      const routePeers = result.route.nodes.map((id) =>
        peers.find((p) => p.id === id)
      );
      for (const peer of routePeers) {
        expect(BigInt(peer!.feeConfig.minFee)).toBeLessThanOrEqual(1500n);
      }
    });

    it('should generate alternative routes', () => {
      const router = new Router({ alternativeRoutes: 2 });
      const peers = createTestPeers(10);

      const result = router.findRoute(peers, { hops: 2 });

      expect(result.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('strategies', () => {
    const router = new Router();
    const peers = createTestPeers(5);

    it('should select lowest fee peers', () => {
      const result = router.findRoute(peers, {
        hops: 2,
        strategy: 'lowest-fee',
      });

      // First two peers should have lowest fees
      expect(result.route.nodes).toContain('peer1');
      expect(result.route.nodes).toContain('peer2');
    });

    it('should select highest reputation peers', () => {
      const result = router.findRoute(peers, {
        hops: 2,
        strategy: 'highest-reputation',
      });

      // Last two peers have highest reputation
      expect(result.route.nodes).toContain('peer5');
      expect(result.route.nodes).toContain('peer4');
    });

    it('should select random peers', () => {
      const result = router.findRoute(peers, {
        hops: 2,
        strategy: 'random',
      });

      expect(result.route.nodes.length).toBe(2);
    });

    it('should use balanced strategy by default', () => {
      const result = router.findRoute(peers, { hops: 2 });
      expect(result.route.nodes.length).toBe(2);
    });
  });

  describe('getRoute', () => {
    it('should retrieve active route', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers);
      const retrieved = router.getRoute(result.route.id);

      expect(retrieved).toEqual(result.route);
    });

    it('should return undefined for unknown route', () => {
      const router = new Router();
      expect(router.getRoute('unknown')).toBeUndefined();
    });

    it('should return undefined for expired route', () => {
      const router = new Router({ routeExpiry: 100 });
      const peers = createTestPeers(5);

      const result = router.findRoute(peers);

      // Wait for expiry
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(router.getRoute(result.route.id)).toBeUndefined();
          resolve();
        }, 150);
      });
    });
  });

  describe('invalidateRoute', () => {
    it('should invalidate route', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers);
      const invalidated = router.invalidateRoute(result.route.id);

      expect(invalidated).toBe(true);
      expect(router.getRoute(result.route.id)).toBeUndefined();
    });
  });

  describe('cleanupExpiredRoutes', () => {
    it('should clean up expired routes', async () => {
      const router = new Router({ routeExpiry: 50 });
      const peers = createTestPeers(5);

      router.findRoute(peers);
      router.findRoute(peers);

      expect(router.getActiveRouteCount()).toBe(2);

      await new Promise((r) => setTimeout(r, 100));
      const cleaned = router.cleanupExpiredRoutes();

      expect(cleaned).toBe(2);
      expect(router.getActiveRouteCount()).toBe(0);
    });
  });

  describe('estimateFee', () => {
    it('should estimate total fee', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const fee = router.estimateFee(peers, 2);

      // peer1 (1000) + peer2 (1500) = 2500
      expect(fee).toBe('2500');
    });
  });

  describe('getRoutePeers', () => {
    it('should convert route to peer list', () => {
      const router = new Router();
      const peers = createTestPeers(5);

      const result = router.findRoute(peers, { hops: 2 });
      const routePeers = router.getRoutePeers(result.route, peers);

      expect(routePeers.length).toBe(2);
    });
  });
});

describe('createRouter', () => {
  it('should create router instance', () => {
    const router = createRouter();
    expect(router).toBeInstanceOf(Router);
  });

  it('should accept configuration', () => {
    const router = createRouter({ defaultHops: 5 });
    expect(router).toBeInstanceOf(Router);
  });
});
