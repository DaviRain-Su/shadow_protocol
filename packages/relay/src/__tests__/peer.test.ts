/**
 * @px402/relay - Peer tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PeerManager, createPeerManager } from '../peer.js';
import type { PeerInfo } from '../types.js';

const createTestPeer = (id: string, reputation: number = 50): PeerInfo => ({
  id,
  address: `localhost:${8400 + parseInt(id.slice(-1))}`,
  publicKey: `pubkey-${id}`,
  lastSeen: Date.now(),
  reputation,
  protocols: ['relay-v1'],
  feeConfig: { minFee: '1000', feeToken: 'SOL' },
  isBootstrap: false,
});

describe('PeerManager', () => {
  let manager: PeerManager;

  beforeEach(() => {
    manager = new PeerManager({ peerTimeout: 1000, heartbeatInterval: 100 });
  });

  afterEach(() => {
    manager.stop();
  });

  describe('addPeer', () => {
    it('should add new peer', () => {
      const peer = createTestPeer('peer1');
      const added = manager.addPeer(peer);

      expect(added).toBe(true);
      expect(manager.getPeerCount()).toBe(1);
      expect(manager.getPeer('peer1')).toBeDefined();
    });

    it('should update existing peer', () => {
      const peer = createTestPeer('peer1', 50);
      manager.addPeer(peer);

      const updated = createTestPeer('peer1', 80);
      const added = manager.addPeer(updated);

      expect(added).toBe(false);
      expect(manager.getPeer('peer1')?.reputation).toBe(80);
    });

    it('should respect maxPeers limit', () => {
      const smallManager = new PeerManager({ maxPeers: 2 });

      smallManager.addPeer(createTestPeer('peer1', 50));
      smallManager.addPeer(createTestPeer('peer2', 60));

      // Should replace lowest reputation peer
      const added = smallManager.addPeer(createTestPeer('peer3', 70));
      expect(added).toBe(true);
      expect(smallManager.getPeerCount()).toBe(2);
      expect(smallManager.getPeer('peer1')).toBeUndefined();

      smallManager.stop();
    });
  });

  describe('removePeer', () => {
    it('should remove existing peer', () => {
      manager.addPeer(createTestPeer('peer1'));
      const removed = manager.removePeer('peer1');

      expect(removed).toBe(true);
      expect(manager.getPeerCount()).toBe(0);
    });

    it('should return false for non-existent peer', () => {
      const removed = manager.removePeer('unknown');
      expect(removed).toBe(false);
    });
  });

  describe('connect/disconnect', () => {
    it('should connect to peer', () => {
      manager.addPeer(createTestPeer('peer1'));
      const connected = manager.connect('peer1');

      expect(connected).toBe(true);
      expect(manager.getConnectedCount()).toBe(1);
    });

    it('should disconnect from peer', () => {
      manager.addPeer(createTestPeer('peer1'));
      manager.connect('peer1');
      const disconnected = manager.disconnect('peer1');

      expect(disconnected).toBe(true);
      expect(manager.getConnectedCount()).toBe(0);
    });

    it('should return false for unknown peer', () => {
      const connected = manager.connect('unknown');
      expect(connected).toBe(false);
    });
  });

  describe('reputation', () => {
    it('should boost reputation', () => {
      const peer = createTestPeer('peer1', 50);
      manager.addPeer(peer);

      manager.boostReputation('peer1', 10);
      expect(manager.getPeer('peer1')?.reputation).toBe(60);
    });

    it('should decay reputation', () => {
      const peer = createTestPeer('peer1', 50);
      manager.addPeer(peer);

      manager.decayReputation('peer1', 10);
      expect(manager.getPeer('peer1')?.reputation).toBe(40);
    });

    it('should cap reputation at max', () => {
      const peer = createTestPeer('peer1', 95);
      manager.addPeer(peer);

      manager.boostReputation('peer1', 20);
      expect(manager.getPeer('peer1')?.reputation).toBe(100);
    });

    it('should not go below 0', () => {
      const peer = createTestPeer('peer1', 5);
      manager.addPeer(peer);

      manager.decayReputation('peer1', 20);
      expect(manager.getPeer('peer1')?.reputation).toBe(0);
    });
  });

  describe('getPeersByReputation', () => {
    it('should return peers sorted by reputation', () => {
      manager.addPeer(createTestPeer('peer1', 30));
      manager.addPeer(createTestPeer('peer2', 80));
      manager.addPeer(createTestPeer('peer3', 50));

      const sorted = manager.getPeersByReputation();
      expect(sorted[0].id).toBe('peer2');
      expect(sorted[1].id).toBe('peer3');
      expect(sorted[2].id).toBe('peer1');
    });

    it('should limit count', () => {
      manager.addPeer(createTestPeer('peer1', 30));
      manager.addPeer(createTestPeer('peer2', 80));
      manager.addPeer(createTestPeer('peer3', 50));

      const sorted = manager.getPeersByReputation(2);
      expect(sorted.length).toBe(2);
    });
  });

  describe('getPeersByFee', () => {
    it('should return peers sorted by fee', () => {
      const peer1 = createTestPeer('peer1');
      peer1.feeConfig.minFee = '5000';
      const peer2 = createTestPeer('peer2');
      peer2.feeConfig.minFee = '1000';
      const peer3 = createTestPeer('peer3');
      peer3.feeConfig.minFee = '3000';

      manager.addPeer(peer1);
      manager.addPeer(peer2);
      manager.addPeer(peer3);

      const sorted = manager.getPeersByFee();
      expect(sorted[0].id).toBe('peer2');
      expect(sorted[1].id).toBe('peer3');
      expect(sorted[2].id).toBe('peer1');
    });
  });

  describe('getRandomPeers', () => {
    it('should return requested number of peers', () => {
      manager.addPeer(createTestPeer('peer1'));
      manager.addPeer(createTestPeer('peer2'));
      manager.addPeer(createTestPeer('peer3'));

      const random = manager.getRandomPeers(2);
      expect(random.length).toBe(2);
    });
  });

  describe('events', () => {
    it('should emit add event', () => {
      const handler = vi.fn();
      manager.on(handler);

      manager.addPeer(createTestPeer('peer1'));
      expect(handler).toHaveBeenCalledWith('add', expect.any(Object));
    });

    it('should emit remove event', () => {
      const handler = vi.fn();
      manager.addPeer(createTestPeer('peer1'));
      manager.on(handler);

      manager.removePeer('peer1');
      expect(handler).toHaveBeenCalledWith('remove', expect.any(Object));
    });

    it('should emit connect event', () => {
      const handler = vi.fn();
      manager.addPeer(createTestPeer('peer1'));
      manager.on(handler);

      manager.connect('peer1');
      expect(handler).toHaveBeenCalledWith('connect', expect.any(Object));
    });
  });

  describe('static methods', () => {
    it('should create peer info', () => {
      const peer = PeerManager.createPeerInfo(
        'node1',
        'localhost:8402',
        'pubkey123',
        { minFee: '1000', feeToken: 'SOL' }
      );

      expect(peer.id).toBe('node1');
      expect(peer.address).toBe('localhost:8402');
      expect(peer.reputation).toBe(50);
    });

    it('should parse address', () => {
      const { host, port } = PeerManager.parseAddress('relay.example.com:8402');
      expect(host).toBe('relay.example.com');
      expect(port).toBe(8402);
    });

    it('should throw for invalid address', () => {
      expect(() => PeerManager.parseAddress('invalid')).toThrow('Invalid peer address');
    });
  });
});

describe('createPeerManager', () => {
  it('should create manager instance', () => {
    const manager = createPeerManager();
    expect(manager).toBeInstanceOf(PeerManager);
    manager.stop();
  });
});
