/**
 * @px402/relay - Privacy Relay Network
 *
 * Provides anonymous relay infrastructure for Px402 payments
 */

// Types
export type {
  MessageType,
  RelayMessage,
  RelayPayload,
  PeerInfo,
  PeerConnection,
  FeeConfig,
  RelayNodeConfig,
  RelayTransportConfig,
  Route,
  RoutingResult,
  IncentiveRecord,
  NodeStats,
  RelayEventType,
  RelayEvent,
  RelayEventHandler,
  EncryptionResult,
  OnionLayer,
  ConnectionState,
} from './types.js';

export { RELAY_VERSION } from './types.js';

// Protocol
export {
  generateMessageId,
  generateKeyPair,
  derivePublicKey,
  encrypt,
  decrypt,
  encryptPayload,
  decryptPayload,
  createRelayMessage,
  encodeMessage,
  decodeMessage,
  validateMessage,
  createOnionLayers,
  peelOnionLayer,
  signMessage,
  verifySignature,
  createPingMessage,
  createPongMessage,
  createAnnounceMessage,
  parseAnnounceMessage,
  isMessageExpired,
  decrementTTL,
} from './protocol.js';

// Peer Management
export {
  PeerManager,
  createPeerManager,
} from './peer.js';

export type {
  PeerManagerConfig,
  PeerEventType,
  PeerEventHandler,
} from './peer.js';

// Routing
export {
  Router,
  createRouter,
} from './router.js';

export type {
  RouterConfig,
  RouteStrategy,
} from './router.js';

// Incentives
export {
  IncentiveManager,
  createIncentiveManager,
  formatFee,
  parseFee,
} from './incentive.js';

export type {
  IncentiveConfig,
  PaymentStatus,
  PendingPayment,
  EarningsSummary,
} from './incentive.js';

// Relay Node
export {
  RelayNode,
  createRelayNode,
  generateNodeKeyPair,
} from './node.js';

export type {
  MessageHandler,
} from './node.js';

// Transport
export {
  RelayTransport,
  createRelayTransport,
  relayFetch,
} from './transport.js';

export type {
  TransportState,
  RelayResponse,
  RelayRequestOptions,
} from './transport.js';
