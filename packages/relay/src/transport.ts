/**
 * @px402/relay - Relay Transport
 *
 * Client-side transport for sending requests through relay network
 */

import { decodeBase64 } from 'tweetnacl-util';
import {
  generateMessageId,
  createRelayMessage,
  encryptPayload,
  decryptPayload,
  encodeMessage,
  decodeMessage,
  createOnionLayers,
} from './protocol.js';
import { PeerManager } from './peer.js';
import { Router } from './router.js';
import type {
  RelayTransportConfig,
  RelayPayload,
  RelayMessage,
  PeerInfo,
  Route,
} from './types.js';

/**
 * Default transport configuration
 */
const DEFAULT_CONFIG = {
  hops: 3,
  timeout: 30000,
  retries: 2,
  maxFee: '10000000', // 0.01 SOL
  feeToken: 'SOL',
};

/**
 * Transport state
 */
export type TransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Relay response
 */
export interface RelayResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Request options
 */
export interface RelayRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  payment?: string;
  hops?: number;
  timeout?: number;
}

/**
 * Pending request
 */
interface PendingRequest {
  id: string;
  resolve: (response: RelayResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Relay transport for Px402Client
 */
export class RelayTransport {
  private config: RelayTransportConfig & typeof DEFAULT_CONFIG;
  private peerManager: PeerManager;
  private router: Router;
  private state: TransportState = 'disconnected';
  private pendingRequests: Map<string, PendingRequest> = new Map();

  // Client keypair (ephemeral)
  private secretKey?: Uint8Array;
  private publicKey?: Uint8Array;

  constructor(config: RelayTransportConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.peerManager = new PeerManager();
    this.router = new Router();
  }

  /**
   * Get current state
   */
  getState(): TransportState {
    return this.state;
  }

  /**
   * Connect to relay network
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    this.state = 'connecting';

    try {
      // Generate ephemeral keypair
      const nacl = await import('tweetnacl');
      const keyPair = nacl.default.box.keyPair();
      this.secretKey = keyPair.secretKey;
      this.publicKey = keyPair.publicKey;

      // Connect to relay nodes
      for (const address of this.config.relayNodes) {
        // In a real implementation, we would establish WebSocket connections
        // For now, we just add them as peers
        const [host, portStr] = address.split(':');
        const port = parseInt(portStr, 10) || 8402;

        // Create mock peer info (in real impl, we'd fetch this from the node)
        const peer: PeerInfo = {
          id: `relay-${host}-${port}`,
          address,
          publicKey: '', // Would be fetched from node
          lastSeen: Date.now(),
          reputation: 100,
          protocols: ['relay-v1'],
          feeConfig: {
            minFee: '1000',
            feeToken: 'SOL',
          },
          isBootstrap: true,
        };

        this.peerManager.addPeer(peer);
      }

      this.peerManager.start();
      this.state = 'connected';
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Disconnect from relay network
   */
  async disconnect(): Promise<void> {
    // Cancel all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();

    this.peerManager.stop();
    this.state = 'disconnected';
    this.secretKey = undefined;
    this.publicKey = undefined;
  }

  /**
   * Send request through relay network
   */
  async request(
    url: string,
    options: RelayRequestOptions = {}
  ): Promise<RelayResponse> {
    if (this.state !== 'connected') {
      await this.connect();
    }

    const requestId = generateMessageId();
    const hops = options.hops ?? this.config.hops;
    const timeout = options.timeout ?? this.config.timeout;

    // Get available peers
    const peers = this.peerManager.getAllPeers();
    if (peers.length < hops) {
      throw new Error(`Not enough relay nodes (need ${hops}, have ${peers.length})`);
    }

    // Find route
    const { route } = this.router.findRoute(peers, {
      hops,
      maxFee: this.config.maxFee,
    });

    // Create payload
    const payload: RelayPayload = {
      method: options.method ?? 'GET',
      url,
      headers: options.headers ?? {},
      body: options.body,
      payment: options.payment,
    };

    // Create promise for response
    return new Promise<RelayResponse>((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        id: requestId,
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message (mock implementation)
      this.sendMessage(requestId, payload, route).catch((error) => {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(error);
      });
    });
  }

  /**
   * Send message through relay route
   */
  private async sendMessage(
    requestId: string,
    payload: RelayPayload,
    route: Route
  ): Promise<void> {
    // Get route peers
    const peers = this.router.getRoutePeers(route, this.peerManager.getAllPeers());
    if (peers.length === 0) {
      throw new Error('No peers available for route');
    }

    // In a real implementation:
    // 1. Create onion layers for each hop
    // 2. Send to first hop via WebSocket
    // 3. Wait for response to come back through the route

    // For now, we'll simulate the flow
    const firstHop = peers[0];
    const lastHop = peers[peers.length - 1];

    if (!firstHop.publicKey || !lastHop.publicKey) {
      throw new Error('Peer public keys not available');
    }

    // Create onion-encrypted message
    const layers = createOnionLayers(payload, peers);

    // Create relay message
    const message = createRelayMessage(
      payload,
      decodeBase64(lastHop.publicKey),
      {
        fee: route.totalFee,
        feeToken: this.config.feeToken,
        ttl: peers.length + 1,
        nextHop: peers.length > 1 ? peers[1].id : undefined,
      }
    );

    // In real implementation, send via WebSocket to first hop
    // For demo purposes, we'll just log
    console.log(`[RelayTransport] Sending request ${requestId} via ${peers.length} hops`);
    console.log(`[RelayTransport] Route: ${route.nodes.join(' -> ')}`);
    console.log(`[RelayTransport] Total fee: ${route.totalFee}`);
  }

  /**
   * Handle incoming response
   */
  handleResponse(messageId: string, response: RelayResponse): void {
    const pending = this.pendingRequests.get(messageId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(messageId);
    pending.resolve(response);
  }

  /**
   * Get available relay nodes
   */
  getAvailableNodes(): PeerInfo[] {
    return this.peerManager.getAllPeers();
  }

  /**
   * Get connected node count
   */
  getNodeCount(): number {
    return this.peerManager.getPeerCount();
  }

  /**
   * Estimate fee for request
   */
  estimateFee(hops?: number): string {
    const peers = this.peerManager.getAllPeers();
    return this.router.estimateFee(peers, hops ?? this.config.hops);
  }

  /**
   * Add relay node
   */
  addNode(peer: PeerInfo): void {
    this.peerManager.addPeer(peer);
  }

  /**
   * Remove relay node
   */
  removeNode(id: string): void {
    this.peerManager.removePeer(id);
  }
}

/**
 * Create relay transport
 */
export function createRelayTransport(config: RelayTransportConfig): RelayTransport {
  return new RelayTransport(config);
}

/**
 * Fetch through relay network (convenience function)
 */
export async function relayFetch(
  url: string,
  options: RelayRequestOptions & { relayNodes: string[] }
): Promise<RelayResponse> {
  const transport = createRelayTransport({
    relayNodes: options.relayNodes,
  });

  try {
    await transport.connect();
    return await transport.request(url, options);
  } finally {
    await transport.disconnect();
  }
}
