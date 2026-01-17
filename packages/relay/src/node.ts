/**
 * @px402/relay - Relay Node
 *
 * Core relay node implementation
 */

import { encodeBase64 } from 'tweetnacl-util';
import {
  generateKeyPair,
  derivePublicKey,
  decryptPayload,
  encodeMessage,
  decodeMessage,
  validateMessage,
  decrementTTL,
  createPongMessage,
  createAnnounceMessage,
  parseAnnounceMessage,
  isMessageExpired,
} from './protocol.js';
import { PeerManager } from './peer.js';
import { Router } from './router.js';
import { IncentiveManager } from './incentive.js';
import type {
  RelayNodeConfig,
  RelayMessage,
  RelayPayload,
  PeerInfo,
  NodeStats,
  RelayEvent,
  RelayEventType,
  RelayEventHandler,
} from './types.js';

/**
 * Default node configuration
 */
const DEFAULT_CONFIG = {
  maxMessageSize: 1024 * 1024, // 1 MB
  maxTTL: 10,
  heartbeatInterval: 10000,
  peerTimeout: 30000,
};

/**
 * Message handler type
 */
export type MessageHandler = (
  message: RelayMessage,
  payload: RelayPayload
) => Promise<RelayPayload | null>;

/**
 * Relay node implementation
 */
export class RelayNode {
  private config: RelayNodeConfig & typeof DEFAULT_CONFIG;
  private secretKey: Uint8Array;
  private publicKey: Uint8Array;
  private nodeId: string;

  private peerManager: PeerManager;
  private router: Router;
  private incentiveManager: IncentiveManager;

  private eventHandlers: Map<RelayEventType, Set<RelayEventHandler>> = new Map();
  private messageHandler?: MessageHandler;

  private running: boolean = false;
  private startTime: number = 0;
  private messagesRelayed: number = 0;
  private bytesRelayed: number = 0;

  constructor(config: RelayNodeConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize keys
    if (typeof config.privateKey === 'string') {
      // Assume base64 encoded
      const { decodeBase64 } = require('tweetnacl-util');
      this.secretKey = decodeBase64(config.privateKey);
    } else {
      this.secretKey = config.privateKey;
    }

    // Derive public key
    this.publicKey = derivePublicKey(this.secretKey);
    this.nodeId = encodeBase64(this.publicKey);

    // Initialize components
    this.peerManager = new PeerManager({
      peerTimeout: this.config.peerTimeout,
      heartbeatInterval: this.config.heartbeatInterval,
      bootstrapPeers: this.config.bootstrapPeers,
    });

    this.router = new Router();

    this.incentiveManager = new IncentiveManager(this.config.incentiveConfig);
  }

  /**
   * Get node ID (public key)
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Get public key
   */
  getPublicKey(): Uint8Array {
    return this.publicKey;
  }

  /**
   * Get public key as base64
   */
  getPublicKeyBase64(): string {
    return encodeBase64(this.publicKey);
  }

  /**
   * Start the relay node
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Node already running');
    }

    this.running = true;
    this.startTime = Date.now();

    // Start peer manager
    this.peerManager.start();

    // Setup peer event forwarding
    this.peerManager.on((type, peer) => {
      if (type === 'connect') {
        this.emit('peer:connect', { peer });
      } else if (type === 'disconnect') {
        this.emit('peer:disconnect', { peer });
      }
    });

    this.emit('start', { nodeId: this.nodeId, port: this.config.port });
  }

  /**
   * Stop the relay node
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.peerManager.stop();

    this.emit('stop', { nodeId: this.nodeId });
  }

  /**
   * Check if node is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Register event handler
   */
  on(event: RelayEventType, handler: RelayEventHandler): void {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler);
  }

  /**
   * Remove event handler
   */
  off(event: RelayEventType, handler: RelayEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event
   */
  private emit(type: RelayEventType, data?: unknown): void {
    const event: RelayEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch {
          // Ignore handler errors
        }
      }
    }
  }

  /**
   * Set message handler for final destination
   */
  setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Handle incoming message
   */
  async handleMessage(rawMessage: string): Promise<string | null> {
    try {
      // Decode and validate
      const message = decodeMessage(rawMessage);
      validateMessage(message);

      // Check expiry
      if (isMessageExpired(message)) {
        throw new Error('Message expired');
      }

      // Check message size
      if (rawMessage.length > this.config.maxMessageSize) {
        throw new Error('Message too large');
      }

      // Control messages (ping, pong, announce) don't require fees
      const isControlMessage = ['ping', 'pong', 'announce'].includes(message.type);

      // Validate fee for non-control messages
      if (!isControlMessage && !this.incentiveManager.validateFee(message, rawMessage.length)) {
        throw new Error('Insufficient fee');
      }

      // Handle based on type
      switch (message.type) {
        case 'ping':
          return this.handlePing(message);

        case 'pong':
          return this.handlePong(message);

        case 'announce':
          return this.handleAnnounce(message);

        case 'request':
        case 'response':
          return await this.handleRelay(message);

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.emit('error', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Handle ping message
   */
  private handlePing(message: RelayMessage): string {
    const pong = createPongMessage(message.id);
    return encodeMessage(pong);
  }

  /**
   * Handle pong message
   */
  private handlePong(message: RelayMessage): null {
    // Record RTT for the peer
    // In a real implementation, we would track outstanding pings
    return null;
  }

  /**
   * Handle announce message
   */
  private handleAnnounce(message: RelayMessage): null {
    try {
      const peerInfo = parseAnnounceMessage(message);
      this.peerManager.addPeer(peerInfo);
    } catch {
      // Invalid announce
    }
    return null;
  }

  /**
   * Handle relay message
   */
  private async handleRelay(message: RelayMessage): Promise<string | null> {
    // Check TTL
    if (message.ttl <= 0) {
      throw new Error('Message TTL expired');
    }

    // Decrement TTL for forwarding
    const forwardMessage = decrementTTL(message);

    // Try to decrypt (we might be the destination)
    try {
      const payload = decryptPayload(
        message.encryptedPayload,
        message.ephemeralKey,
        this.secretKey
      );

      // We are the destination - handle the message
      this.messagesRelayed++;
      this.bytesRelayed += message.encryptedPayload.length;

      // Register payment
      this.incentiveManager.registerPayment(
        message.id,
        message.signature ?? 'unknown',
        message.fee,
        message.feeToken
      );

      // Verify and emit payment
      this.incentiveManager.verifyPayment(message.id);
      this.emit('payment', {
        messageId: message.id,
        amount: message.fee,
        token: message.feeToken,
      });

      // If we have a handler, process the message
      if (this.messageHandler) {
        const response = await this.messageHandler(message, payload);
        if (response) {
          // TODO: Encrypt and return response
          this.emit('relay', { messageId: message.id, direction: 'inbound' });
          return null;
        }
      }

      this.emit('relay', { messageId: message.id, direction: 'inbound' });
      return null;
    } catch {
      // We are not the destination - forward to next hop
      if (!forwardMessage.nextHop) {
        throw new Error('Cannot forward: no next hop');
      }

      // Register payment for relay
      this.incentiveManager.registerPayment(
        message.id,
        message.signature ?? 'unknown',
        message.fee,
        message.feeToken
      );

      this.incentiveManager.verifyPayment(message.id);
      this.messagesRelayed++;
      this.bytesRelayed += message.encryptedPayload.length;

      this.emit('relay', { messageId: message.id, direction: 'forward' });
      this.emit('payment', {
        messageId: message.id,
        amount: message.fee,
        token: message.feeToken,
      });

      // In a real implementation, we would forward to the next hop
      return encodeMessage(forwardMessage);
    }
  }

  /**
   * Add peer
   */
  addPeer(peer: PeerInfo): boolean {
    return this.peerManager.addPeer(peer);
  }

  /**
   * Get peer
   */
  getPeer(id: string): PeerInfo | undefined {
    return this.peerManager.getPeer(id);
  }

  /**
   * Get all peers
   */
  getAllPeers(): PeerInfo[] {
    return this.peerManager.getAllPeers();
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return this.peerManager.getConnectedPeers();
  }

  /**
   * Create announce message for this node
   */
  createAnnounce(): RelayMessage {
    const nodeInfo: PeerInfo = {
      id: this.nodeId,
      address: `localhost:${this.config.port}`,
      publicKey: this.getPublicKeyBase64(),
      lastSeen: Date.now(),
      reputation: 100,
      protocols: ['relay-v1'],
      feeConfig: this.incentiveManager.getFeeConfig(),
      isBootstrap: false,
    };

    return createAnnounceMessage(nodeInfo);
  }

  /**
   * Get node statistics
   */
  getStats(): NodeStats {
    const summary = this.incentiveManager.getEarningsSummary();

    return {
      messagesRelayed: this.messagesRelayed,
      bytesRelayed: this.bytesRelayed,
      feesEarned: summary.byToken[this.config.incentiveConfig.feeToken] ?? '0',
      connectedPeers: this.peerManager.getConnectedCount(),
      uptime: this.running ? Date.now() - this.startTime : 0,
      avgLatency: 0, // TODO: Track actual latency
    };
  }

  /**
   * Get peer manager
   */
  getPeerManager(): PeerManager {
    return this.peerManager;
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get incentive manager
   */
  getIncentiveManager(): IncentiveManager {
    return this.incentiveManager;
  }
}

/**
 * Create relay node
 */
export function createRelayNode(config: RelayNodeConfig): RelayNode {
  return new RelayNode(config);
}

/**
 * Generate new node keypair
 */
export function generateNodeKeyPair(): {
  publicKey: string;
  secretKey: string;
} {
  const keyPair = generateKeyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}
