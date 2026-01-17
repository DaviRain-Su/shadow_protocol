/**
 * @px402/relay - Type definitions
 */

/**
 * Relay protocol version
 */
export const RELAY_VERSION = 1;

/**
 * Message types
 */
export type MessageType = 'request' | 'response' | 'ping' | 'pong' | 'announce';

/**
 * Relay message structure
 */
export interface RelayMessage {
  /** Unique message ID */
  id: string;

  /** Message type */
  type: MessageType;

  /** Protocol version */
  version: number;

  /** Timestamp (unix ms) */
  timestamp: number;

  /** Encrypted payload (base64) */
  encryptedPayload: string;

  /** Ephemeral public key for decryption (base64) */
  ephemeralKey: string;

  /** Next hop node ID (for onion routing) */
  nextHop?: string;

  /** Time to live (hop count) */
  ttl: number;

  /** Relay fee in smallest unit */
  fee: string;

  /** Fee token symbol */
  feeToken: string;

  /** Signature from sender */
  signature?: string;
}

/**
 * Decrypted relay payload
 */
export interface RelayPayload {
  /** Original HTTP method */
  method: string;

  /** Target URL */
  url: string;

  /** HTTP headers */
  headers: Record<string, string>;

  /** Request body (if any) */
  body?: string;

  /** Payment header */
  payment?: string;

  /** Response status (for response type) */
  status?: number;

  /** Response body (for response type) */
  responseBody?: string;
}

/**
 * Peer node information
 */
export interface PeerInfo {
  /** Unique node ID (public key) */
  id: string;

  /** Node address (host:port) */
  address: string;

  /** Public key for encryption */
  publicKey: string;

  /** Last seen timestamp */
  lastSeen: number;

  /** Node reputation score (0-100) */
  reputation: number;

  /** Supported protocols */
  protocols: string[];

  /** Fee configuration */
  feeConfig: FeeConfig;

  /** Is this a bootstrap node */
  isBootstrap: boolean;
}

/**
 * Fee configuration
 */
export interface FeeConfig {
  /** Minimum fee per relay */
  minFee: string;

  /** Fee token */
  feeToken: string;

  /** Fee per KB (optional) */
  feePerKB?: string;
}

/**
 * Relay node configuration
 */
export interface RelayNodeConfig {
  /** Listen port */
  port: number;

  /** Node private key (base64 or Uint8Array) */
  privateKey: string | Uint8Array;

  /** Bootstrap peer addresses */
  bootstrapPeers?: string[];

  /** Incentive configuration */
  incentiveConfig: FeeConfig;

  /** Maximum message size (bytes) */
  maxMessageSize?: number;

  /** Maximum TTL allowed */
  maxTTL?: number;

  /** Heartbeat interval (ms) */
  heartbeatInterval?: number;

  /** Peer timeout (ms) */
  peerTimeout?: number;
}

/**
 * Relay transport configuration
 */
export interface RelayTransportConfig {
  /** Relay node addresses */
  relayNodes: string[];

  /** Number of hops for onion routing */
  hops?: number;

  /** Request timeout (ms) */
  timeout?: number;

  /** Retry count */
  retries?: number;

  /** Maximum fee willing to pay */
  maxFee?: string;

  /** Fee token */
  feeToken?: string;
}

/**
 * Route information
 */
export interface Route {
  /** Route ID */
  id: string;

  /** Ordered list of node IDs */
  nodes: string[];

  /** Total estimated fee */
  totalFee: string;

  /** Route creation time */
  createdAt: number;

  /** Route expiry time */
  expiresAt: number;
}

/**
 * Routing result
 */
export interface RoutingResult {
  /** Selected route */
  route: Route;

  /** Alternative routes */
  alternatives: Route[];
}

/**
 * Incentive record
 */
export interface IncentiveRecord {
  /** Message ID */
  messageId: string;

  /** Payer node ID */
  payer: string;

  /** Amount earned */
  amount: string;

  /** Token */
  token: string;

  /** Timestamp */
  timestamp: number;

  /** Payment verified */
  verified: boolean;
}

/**
 * Node statistics
 */
export interface NodeStats {
  /** Total messages relayed */
  messagesRelayed: number;

  /** Total bytes relayed */
  bytesRelayed: number;

  /** Total fees earned */
  feesEarned: string;

  /** Connected peers count */
  connectedPeers: number;

  /** Uptime (ms) */
  uptime: number;

  /** Average latency (ms) */
  avgLatency: number;
}

/**
 * Relay event types
 */
export type RelayEventType =
  | 'start'
  | 'stop'
  | 'relay'
  | 'payment'
  | 'peer:connect'
  | 'peer:disconnect'
  | 'error';

/**
 * Relay event
 */
export interface RelayEvent {
  type: RelayEventType;
  timestamp: number;
  data?: unknown;
}

/**
 * Relay event handler
 */
export type RelayEventHandler = (event: RelayEvent) => void;

/**
 * Encryption result
 */
export interface EncryptionResult {
  /** Encrypted data (base64) */
  ciphertext: string;

  /** Ephemeral public key (base64) */
  ephemeralKey: string;

  /** Nonce used (base64) */
  nonce: string;
}

/**
 * Onion layer
 */
export interface OnionLayer {
  /** Node ID for this layer */
  nodeId: string;

  /** Node public key */
  publicKey: string;

  /** Encrypted payload for this layer */
  encryptedPayload: string;

  /** Ephemeral key for this layer */
  ephemeralKey: string;
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Peer connection
 */
export interface PeerConnection {
  /** Peer info */
  peer: PeerInfo;

  /** Connection state */
  state: ConnectionState;

  /** Last ping time */
  lastPing: number;

  /** Round trip time (ms) */
  rtt: number;
}
