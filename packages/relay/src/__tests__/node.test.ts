/**
 * @px402/relay - Node tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RelayNode,
  createRelayNode,
  generateNodeKeyPair,
} from '../node.js';
import {
  createRelayMessage,
  encodeMessage,
  createPingMessage,
  createAnnounceMessage,
} from '../protocol.js';
import type { PeerInfo, RelayPayload, RelayNodeConfig } from '../types.js';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import nacl from 'tweetnacl';

const createTestConfig = (): RelayNodeConfig => {
  const keyPair = nacl.box.keyPair();
  return {
    port: 8402,
    privateKey: keyPair.secretKey,
    incentiveConfig: {
      minFee: '1000',
      feeToken: 'SOL',
    },
  };
};

describe('RelayNode', () => {
  let node: RelayNode;
  let config: RelayNodeConfig;

  beforeEach(() => {
    config = createTestConfig();
    node = new RelayNode(config);
  });

  afterEach(async () => {
    await node.stop();
  });

  describe('constructor', () => {
    it('should create node with config', () => {
      expect(node.getNodeId()).toBeTruthy();
      expect(node.isRunning()).toBe(false);
    });

    it('should accept base64 private key', () => {
      const keyPair = nacl.box.keyPair();
      const configWithBase64: RelayNodeConfig = {
        port: 8402,
        privateKey: encodeBase64(keyPair.secretKey),
        incentiveConfig: {
          minFee: '1000',
          feeToken: 'SOL',
        },
      };

      const node2 = new RelayNode(configWithBase64);
      expect(node2.getNodeId()).toBeTruthy();
    });
  });

  describe('start/stop', () => {
    it('should start node', async () => {
      await node.start();
      expect(node.isRunning()).toBe(true);
    });

    it('should stop node', async () => {
      await node.start();
      await node.stop();
      expect(node.isRunning()).toBe(false);
    });

    it('should throw if already running', async () => {
      await node.start();
      await expect(node.start()).rejects.toThrow('already running');
    });
  });

  describe('events', () => {
    it('should emit start event', async () => {
      const handler = vi.fn();
      node.on('start', handler);

      await node.start();

      expect(handler).toHaveBeenCalled();
    });

    it('should emit stop event', async () => {
      const handler = vi.fn();
      node.on('stop', handler);

      await node.start();
      await node.stop();

      expect(handler).toHaveBeenCalled();
    });

    it('should remove handler', async () => {
      const handler = vi.fn();
      node.on('start', handler);
      node.off('start', handler);

      await node.start();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    beforeEach(async () => {
      await node.start();
    });

    it('should handle ping message', async () => {
      const ping = createPingMessage('test');
      const response = await node.handleMessage(encodeMessage(ping));

      expect(response).toBeTruthy();
      const parsed = JSON.parse(response!);
      expect(parsed.type).toBe('pong');
      expect(parsed.id).toBe(ping.id);
    });

    it('should handle announce message', async () => {
      const peerInfo: PeerInfo = {
        id: 'peer1',
        address: 'localhost:8403',
        publicKey: 'pubkey123',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      };

      const announce = createAnnounceMessage(peerInfo);
      const response = await node.handleMessage(encodeMessage(announce));

      expect(response).toBeNull();
      expect(node.getPeer('peer1')).toBeDefined();
    });

    it('should reject expired message', async () => {
      const ping = createPingMessage('test');
      ping.timestamp = Date.now() - 120000; // 2 minutes ago

      const response = await node.handleMessage(encodeMessage(ping));
      expect(response).toBeNull();
    });

    it('should reject invalid JSON', async () => {
      const response = await node.handleMessage('not json');
      expect(response).toBeNull();
    });

    it('should handle relay message to self', async () => {
      const payload: RelayPayload = {
        method: 'GET',
        url: 'https://example.com',
        headers: {},
      };

      // Encrypt for this node
      const message = createRelayMessage(payload, node.getPublicKey(), {
        fee: '2000',
        feeToken: 'SOL',
        ttl: 5,
      });

      const paymentHandler = vi.fn();
      node.on('payment', paymentHandler);

      await node.handleMessage(encodeMessage(message));

      expect(paymentHandler).toHaveBeenCalled();
    });
  });

  describe('peer management', () => {
    it('should add peer', () => {
      const peer: PeerInfo = {
        id: 'peer1',
        address: 'localhost:8403',
        publicKey: 'pubkey123',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      };

      node.addPeer(peer);
      expect(node.getPeer('peer1')).toBeDefined();
    });

    it('should get all peers', () => {
      const peer1: PeerInfo = {
        id: 'peer1',
        address: 'localhost:8403',
        publicKey: 'pubkey1',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      };

      const peer2: PeerInfo = {
        id: 'peer2',
        address: 'localhost:8404',
        publicKey: 'pubkey2',
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      };

      node.addPeer(peer1);
      node.addPeer(peer2);

      expect(node.getAllPeers().length).toBe(2);
    });
  });

  describe('createAnnounce', () => {
    it('should create announce message', () => {
      const announce = node.createAnnounce();

      expect(announce.type).toBe('announce');
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await node.start();
      // Small delay to ensure uptime > 0
      await new Promise((r) => setTimeout(r, 10));
      const stats = node.getStats();

      expect(stats.messagesRelayed).toBe(0);
      expect(stats.bytesRelayed).toBe(0);
      expect(stats.uptime).toBeGreaterThan(0);
    });
  });

  describe('component access', () => {
    it('should provide peer manager', () => {
      expect(node.getPeerManager()).toBeDefined();
    });

    it('should provide router', () => {
      expect(node.getRouter()).toBeDefined();
    });

    it('should provide incentive manager', () => {
      expect(node.getIncentiveManager()).toBeDefined();
    });
  });
});

describe('createRelayNode', () => {
  it('should create node instance', () => {
    const config = createTestConfig();
    const node = createRelayNode(config);
    expect(node).toBeInstanceOf(RelayNode);
  });
});

describe('generateNodeKeyPair', () => {
  it('should generate keypair', () => {
    const keyPair = generateNodeKeyPair();
    expect(keyPair.publicKey).toBeTruthy();
    expect(keyPair.secretKey).toBeTruthy();
  });

  it('should generate base64 encoded keys', () => {
    const keyPair = generateNodeKeyPair();
    expect(() => decodeBase64(keyPair.publicKey)).not.toThrow();
    expect(() => decodeBase64(keyPair.secretKey)).not.toThrow();
  });
});
