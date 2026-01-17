/**
 * @px402/relay - Peer Discovery and Management
 */

import type {
  PeerInfo,
  PeerConnection,
  ConnectionState,
  FeeConfig,
} from './types.js';

/**
 * Default peer configuration
 */
const DEFAULT_PEER_TIMEOUT = 30000; // 30 seconds
const DEFAULT_HEARTBEAT_INTERVAL = 10000; // 10 seconds
const DEFAULT_MIN_REPUTATION = 0;
const DEFAULT_MAX_REPUTATION = 100;
const REPUTATION_DECAY = 1; // Per missed heartbeat
const REPUTATION_BOOST = 2; // Per successful relay

/**
 * Peer manager configuration
 */
export interface PeerManagerConfig {
  /** Peer timeout in ms */
  peerTimeout?: number;

  /** Heartbeat interval in ms */
  heartbeatInterval?: number;

  /** Maximum peers to maintain */
  maxPeers?: number;

  /** Bootstrap peers */
  bootstrapPeers?: string[];
}

/**
 * Peer event types
 */
export type PeerEventType = 'add' | 'remove' | 'update' | 'connect' | 'disconnect';

/**
 * Peer event handler
 */
export type PeerEventHandler = (type: PeerEventType, peer: PeerInfo) => void;

/**
 * Manages peer discovery and connections
 */
export class PeerManager {
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, PeerConnection> = new Map();
  private eventHandlers: Set<PeerEventHandler> = new Set();
  private config: Required<PeerManagerConfig>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  constructor(config: PeerManagerConfig = {}) {
    this.config = {
      peerTimeout: config.peerTimeout ?? DEFAULT_PEER_TIMEOUT,
      heartbeatInterval: config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      maxPeers: config.maxPeers ?? 50,
      bootstrapPeers: config.bootstrapPeers ?? [],
    };
  }

  /**
   * Start peer manager
   */
  start(): void {
    // Start heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      this.checkPeers();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop peer manager
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // Disconnect all peers
    for (const [id] of this.connections) {
      this.disconnect(id);
    }
  }

  /**
   * Add event handler
   */
  on(handler: PeerEventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Remove event handler
   */
  off(handler: PeerEventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Emit event
   */
  private emit(type: PeerEventType, peer: PeerInfo): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(type, peer);
      } catch {
        // Ignore handler errors
      }
    }
  }

  /**
   * Add or update peer
   */
  addPeer(peer: PeerInfo): boolean {
    const existing = this.peers.get(peer.id);

    if (existing) {
      // Update existing peer
      const updated: PeerInfo = {
        ...existing,
        ...peer,
        lastSeen: Date.now(),
        reputation: Math.max(existing.reputation, peer.reputation),
      };
      this.peers.set(peer.id, updated);
      this.emit('update', updated);
      return false;
    }

    // Check if we have room for new peers
    if (this.peers.size >= this.config.maxPeers) {
      // Remove lowest reputation peer
      const lowestPeer = this.getLowestReputationPeer();
      if (lowestPeer && peer.reputation > lowestPeer.reputation) {
        this.removePeer(lowestPeer.id);
      } else {
        return false;
      }
    }

    // Add new peer
    const newPeer: PeerInfo = {
      ...peer,
      lastSeen: Date.now(),
    };
    this.peers.set(peer.id, newPeer);
    this.emit('add', newPeer);
    return true;
  }

  /**
   * Remove peer
   */
  removePeer(id: string): boolean {
    const peer = this.peers.get(id);
    if (!peer) {
      return false;
    }

    // Disconnect if connected
    this.disconnect(id);

    this.peers.delete(id);
    this.emit('remove', peer);
    return true;
  }

  /**
   * Get peer by ID
   */
  getPeer(id: string): PeerInfo | undefined {
    return this.peers.get(id);
  }

  /**
   * Get all peers
   */
  getAllPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.connections.values())
      .filter((c) => c.state === 'connected')
      .map((c) => c.peer);
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Get connected peer count
   */
  getConnectedCount(): number {
    return Array.from(this.connections.values()).filter(
      (c) => c.state === 'connected'
    ).length;
  }

  /**
   * Connect to peer
   */
  connect(id: string): boolean {
    const peer = this.peers.get(id);
    if (!peer) {
      return false;
    }

    const existing = this.connections.get(id);
    if (existing?.state === 'connected') {
      return true;
    }

    const connection: PeerConnection = {
      peer,
      state: 'connected',
      lastPing: Date.now(),
      rtt: 0,
    };

    this.connections.set(id, connection);
    this.emit('connect', peer);
    return true;
  }

  /**
   * Disconnect from peer
   */
  disconnect(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) {
      return false;
    }

    this.connections.delete(id);
    this.emit('disconnect', connection.peer);
    return true;
  }

  /**
   * Update peer connection state
   */
  updateConnectionState(id: string, state: ConnectionState): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.state = state;
    }
  }

  /**
   * Record ping result
   */
  recordPing(id: string, rtt: number): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastPing = Date.now();
      connection.rtt = rtt;
    }

    const peer = this.peers.get(id);
    if (peer) {
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Boost peer reputation
   */
  boostReputation(id: string, amount: number = REPUTATION_BOOST): void {
    const peer = this.peers.get(id);
    if (peer) {
      peer.reputation = Math.min(
        DEFAULT_MAX_REPUTATION,
        peer.reputation + amount
      );
    }
  }

  /**
   * Decay peer reputation
   */
  decayReputation(id: string, amount: number = REPUTATION_DECAY): void {
    const peer = this.peers.get(id);
    if (peer) {
      peer.reputation = Math.max(
        DEFAULT_MIN_REPUTATION,
        peer.reputation - amount
      );
    }
  }

  /**
   * Get peers sorted by reputation
   */
  getPeersByReputation(count?: number): PeerInfo[] {
    const sorted = Array.from(this.peers.values()).sort(
      (a, b) => b.reputation - a.reputation
    );
    return count ? sorted.slice(0, count) : sorted;
  }

  /**
   * Get peers by fee (lowest first)
   */
  getPeersByFee(count?: number): PeerInfo[] {
    const sorted = Array.from(this.peers.values()).sort((a, b) =>
      BigInt(a.feeConfig.minFee) > BigInt(b.feeConfig.minFee) ? 1 : -1
    );
    return count ? sorted.slice(0, count) : sorted;
  }

  /**
   * Get random peers
   */
  getRandomPeers(count: number): PeerInfo[] {
    const peers = Array.from(this.peers.values());
    const shuffled = peers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get lowest reputation peer
   */
  private getLowestReputationPeer(): PeerInfo | undefined {
    let lowest: PeerInfo | undefined;
    for (const peer of this.peers.values()) {
      if (!lowest || peer.reputation < lowest.reputation) {
        lowest = peer;
      }
    }
    return lowest;
  }

  /**
   * Check and clean up stale peers
   */
  private checkPeers(): void {
    const now = Date.now();

    for (const [id, peer] of this.peers) {
      if (now - peer.lastSeen > this.config.peerTimeout) {
        // Decay reputation for stale peer
        this.decayReputation(id);

        // Disconnect if connected
        const connection = this.connections.get(id);
        if (connection) {
          connection.state = 'disconnected';
          this.emit('disconnect', peer);
          this.connections.delete(id);
        }

        // Remove if reputation is too low
        if (peer.reputation <= DEFAULT_MIN_REPUTATION && !peer.isBootstrap) {
          this.removePeer(id);
        }
      }
    }
  }

  /**
   * Create peer info from address
   */
  static createPeerInfo(
    id: string,
    address: string,
    publicKey: string,
    feeConfig: FeeConfig,
    isBootstrap: boolean = false
  ): PeerInfo {
    return {
      id,
      address,
      publicKey,
      lastSeen: Date.now(),
      reputation: isBootstrap ? DEFAULT_MAX_REPUTATION : 50,
      protocols: ['relay-v1'],
      feeConfig,
      isBootstrap,
    };
  }

  /**
   * Parse peer address
   */
  static parseAddress(address: string): { host: string; port: number } {
    const [host, portStr] = address.split(':');
    const port = parseInt(portStr, 10);
    if (!host || isNaN(port)) {
      throw new Error(`Invalid peer address: ${address}`);
    }
    return { host, port };
  }
}

/**
 * Create peer manager
 */
export function createPeerManager(config?: PeerManagerConfig): PeerManager {
  return new PeerManager(config);
}
