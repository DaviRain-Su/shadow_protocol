/**
 * @px402/relay - Transport tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RelayTransport,
  createRelayTransport,
} from '../transport.js';
import type { PeerInfo } from '../types.js';

describe('RelayTransport', () => {
  let transport: RelayTransport;

  beforeEach(() => {
    transport = new RelayTransport({
      relayNodes: ['relay1.example.com:8402', 'relay2.example.com:8402'],
    });
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  describe('constructor', () => {
    it('should create transport with config', () => {
      expect(transport.getState()).toBe('disconnected');
    });
  });

  describe('connect', () => {
    it('should connect to relay network', async () => {
      await transport.connect();
      expect(transport.getState()).toBe('connected');
    });

    it('should be idempotent', async () => {
      await transport.connect();
      await transport.connect();
      expect(transport.getState()).toBe('connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from network', async () => {
      await transport.connect();
      await transport.disconnect();
      expect(transport.getState()).toBe('disconnected');
    });
  });

  describe('getAvailableNodes', () => {
    it('should return available nodes after connect', async () => {
      await transport.connect();
      const nodes = transport.getAvailableNodes();
      expect(nodes.length).toBe(2);
    });
  });

  describe('getNodeCount', () => {
    it('should return node count', async () => {
      await transport.connect();
      expect(transport.getNodeCount()).toBe(2);
    });
  });

  describe('addNode', () => {
    it('should add relay node', async () => {
      await transport.connect();

      const peer: PeerInfo = {
        id: 'new-peer',
        address: 'relay3.example.com:8402',
        publicKey: 'pubkey',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      };

      transport.addNode(peer);
      expect(transport.getNodeCount()).toBe(3);
    });
  });

  describe('removeNode', () => {
    it('should remove relay node', async () => {
      await transport.connect();
      const nodes = transport.getAvailableNodes();

      transport.removeNode(nodes[0].id);
      expect(transport.getNodeCount()).toBe(1);
    });
  });

  describe('estimateFee', () => {
    it('should estimate fee for hops', async () => {
      await transport.connect();

      // Add nodes with known fees
      transport.addNode({
        id: 'fee-peer',
        address: 'relay.example.com:8402',
        publicKey: 'pubkey',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '2000', feeToken: 'SOL' },
        isBootstrap: false,
      });

      const fee = transport.estimateFee(2);
      expect(BigInt(fee)).toBeGreaterThan(0n);
    });
  });

  describe('request', () => {
    it('should auto-connect if disconnected', async () => {
      // This will fail because we don't have real relay nodes
      // but it should attempt to connect first
      try {
        await transport.request('https://example.com');
      } catch {
        // Expected to fail
      }
      // Should have attempted to connect
      expect(transport.getState()).not.toBe('disconnected');
    });
  });
});

describe('createRelayTransport', () => {
  it('should create transport instance', () => {
    const transport = createRelayTransport({
      relayNodes: ['relay.example.com:8402'],
    });
    expect(transport).toBeInstanceOf(RelayTransport);
  });
});
