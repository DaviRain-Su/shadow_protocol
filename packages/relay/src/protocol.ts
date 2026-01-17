/**
 * @px402/relay - Message Protocol
 *
 * Handles message encoding/decoding, encryption/decryption, and onion routing
 */

import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';
import type {
  RelayMessage,
  RelayPayload,
  EncryptionResult,
  OnionLayer,
  PeerInfo,
} from './types.js';
import { RELAY_VERSION } from './types.js';

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  const bytes = nacl.randomBytes(16);
  return encodeBase64(bytes).replace(/[+/=]/g, (c) =>
    c === '+' ? '-' : c === '/' ? '_' : ''
  );
}

/**
 * Generate a keypair for relay node
 */
export function generateKeyPair(): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  return nacl.box.keyPair();
}

/**
 * Derive public key from secret key
 */
export function derivePublicKey(secretKey: Uint8Array): Uint8Array {
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
  return keyPair.publicKey;
}

/**
 * Encrypt data for a recipient
 */
export function encrypt(
  data: string | Uint8Array,
  recipientPublicKey: Uint8Array
): EncryptionResult {
  const message =
    typeof data === 'string' ? decodeUTF8(data) : data;

  // Generate ephemeral keypair
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Encrypt with recipient's public key
  const ciphertext = nacl.box(
    message,
    nonce,
    recipientPublicKey,
    ephemeral.secretKey
  );

  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(ciphertext),
    ephemeralKey: encodeBase64(ephemeral.publicKey),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Decrypt data with secret key
 */
export function decrypt(
  ciphertext: string,
  nonce: string,
  ephemeralKey: string,
  secretKey: Uint8Array
): Uint8Array {
  const ciphertextBytes = decodeBase64(ciphertext);
  const nonceBytes = decodeBase64(nonce);
  const ephemeralBytes = decodeBase64(ephemeralKey);

  const plaintext = nacl.box.open(
    ciphertextBytes,
    nonceBytes,
    ephemeralBytes,
    secretKey
  );

  if (!plaintext) {
    throw new Error('Decryption failed');
  }

  return plaintext;
}

/**
 * Encrypt payload for relay message
 */
export function encryptPayload(
  payload: RelayPayload,
  recipientPublicKey: Uint8Array
): { encryptedPayload: string; ephemeralKey: string } {
  const data = JSON.stringify(payload);
  const result = encrypt(data, recipientPublicKey);

  // Combine nonce and ciphertext for transport
  const combined = encodeBase64(
    new Uint8Array([
      ...decodeBase64(result.nonce),
      ...decodeBase64(result.ciphertext),
    ])
  );

  return {
    encryptedPayload: combined,
    ephemeralKey: result.ephemeralKey,
  };
}

/**
 * Decrypt relay payload
 */
export function decryptPayload(
  encryptedPayload: string,
  ephemeralKey: string,
  secretKey: Uint8Array
): RelayPayload {
  // Split combined nonce + ciphertext
  const combined = decodeBase64(encryptedPayload);
  const nonce = combined.slice(0, nacl.box.nonceLength);
  const ciphertext = combined.slice(nacl.box.nonceLength);

  const plaintext = decrypt(
    encodeBase64(ciphertext),
    encodeBase64(nonce),
    ephemeralKey,
    secretKey
  );

  return JSON.parse(encodeUTF8(plaintext)) as RelayPayload;
}

/**
 * Create a relay message
 */
export function createRelayMessage(
  payload: RelayPayload,
  recipientPublicKey: Uint8Array,
  options: {
    fee: string;
    feeToken: string;
    ttl?: number;
    nextHop?: string;
  }
): RelayMessage {
  const { encryptedPayload, ephemeralKey } = encryptPayload(
    payload,
    recipientPublicKey
  );

  return {
    id: generateMessageId(),
    type: payload.status !== undefined ? 'response' : 'request',
    version: RELAY_VERSION,
    timestamp: Date.now(),
    encryptedPayload,
    ephemeralKey,
    nextHop: options.nextHop,
    ttl: options.ttl ?? 10,
    fee: options.fee,
    feeToken: options.feeToken,
  };
}

/**
 * Encode message for transport
 */
export function encodeMessage(message: RelayMessage): string {
  return JSON.stringify(message);
}

/**
 * Decode message from transport
 */
export function decodeMessage(data: string): RelayMessage {
  const message = JSON.parse(data) as RelayMessage;
  validateMessage(message);
  return message;
}

/**
 * Validate message structure
 */
export function validateMessage(message: RelayMessage): void {
  if (!message.id) {
    throw new Error('Missing message id');
  }
  if (!message.type) {
    throw new Error('Missing message type');
  }
  if (message.version !== RELAY_VERSION) {
    throw new Error(`Unsupported version: ${message.version}`);
  }

  // Control messages (ping, pong, announce) don't require encrypted payload
  const isControlMessage = ['ping', 'pong', 'announce'].includes(message.type);

  if (!isControlMessage) {
    if (!message.encryptedPayload) {
      throw new Error('Missing encrypted payload');
    }
    if (!message.ephemeralKey) {
      throw new Error('Missing ephemeral key');
    }
  }

  if (message.ttl < 0) {
    throw new Error('Invalid TTL');
  }
  if (!message.fee) {
    throw new Error('Missing fee');
  }
  if (!message.feeToken) {
    throw new Error('Missing fee token');
  }
}

/**
 * Create onion layers for multi-hop routing
 */
export function createOnionLayers(
  payload: RelayPayload,
  route: PeerInfo[]
): OnionLayer[] {
  if (route.length === 0) {
    throw new Error('Route cannot be empty');
  }

  const layers: OnionLayer[] = [];
  let currentPayload = JSON.stringify(payload);

  // Build layers from innermost (destination) to outermost (first hop)
  for (let i = route.length - 1; i >= 0; i--) {
    const node = route[i];
    const publicKey = decodeBase64(node.publicKey);

    const { encryptedPayload, ephemeralKey } = encryptPayload(
      i === route.length - 1
        ? payload
        : ({ nested: currentPayload } as unknown as RelayPayload),
      publicKey
    );

    layers.unshift({
      nodeId: node.id,
      publicKey: node.publicKey,
      encryptedPayload,
      ephemeralKey,
    });

    currentPayload = encryptedPayload;
  }

  return layers;
}

/**
 * Peel one layer of onion encryption
 */
export function peelOnionLayer(
  encryptedPayload: string,
  ephemeralKey: string,
  secretKey: Uint8Array
): { payload: RelayPayload; isInnermost: boolean } {
  const decrypted = decryptPayload(encryptedPayload, ephemeralKey, secretKey);

  // Check if this is a nested layer
  const decryptedAny = decrypted as unknown as Record<string, unknown>;
  if ('nested' in decryptedAny && typeof decryptedAny.nested === 'string') {
    return {
      payload: JSON.parse(decryptedAny.nested as string) as RelayPayload,
      isInnermost: false,
    };
  }

  return {
    payload: decrypted,
    isInnermost: true,
  };
}

/**
 * Sign a message
 */
export function signMessage(
  message: RelayMessage,
  secretKey: Uint8Array
): string {
  const data = JSON.stringify({
    id: message.id,
    type: message.type,
    version: message.version,
    timestamp: message.timestamp,
    fee: message.fee,
    feeToken: message.feeToken,
  });

  const signature = nacl.sign.detached(decodeUTF8(data), secretKey);
  return encodeBase64(signature);
}

/**
 * Verify message signature
 */
export function verifySignature(
  message: RelayMessage,
  publicKey: Uint8Array
): boolean {
  if (!message.signature) {
    return false;
  }

  const data = JSON.stringify({
    id: message.id,
    type: message.type,
    version: message.version,
    timestamp: message.timestamp,
    fee: message.fee,
    feeToken: message.feeToken,
  });

  const signature = decodeBase64(message.signature);
  return nacl.sign.detached.verify(decodeUTF8(data), signature, publicKey);
}

/**
 * Create ping message
 */
export function createPingMessage(nodeId: string): RelayMessage {
  return {
    id: generateMessageId(),
    type: 'ping',
    version: RELAY_VERSION,
    timestamp: Date.now(),
    encryptedPayload: '',
    ephemeralKey: '',
    ttl: 1,
    fee: '0',
    feeToken: 'SOL',
  };
}

/**
 * Create pong message
 */
export function createPongMessage(pingId: string): RelayMessage {
  return {
    id: pingId,
    type: 'pong',
    version: RELAY_VERSION,
    timestamp: Date.now(),
    encryptedPayload: '',
    ephemeralKey: '',
    ttl: 1,
    fee: '0',
    feeToken: 'SOL',
  };
}

/**
 * Create announce message for peer discovery
 */
export function createAnnounceMessage(nodeInfo: PeerInfo): RelayMessage {
  return {
    id: generateMessageId(),
    type: 'announce',
    version: RELAY_VERSION,
    timestamp: Date.now(),
    encryptedPayload: encodeBase64(decodeUTF8(JSON.stringify(nodeInfo))),
    ephemeralKey: '',
    ttl: 5,
    fee: '0',
    feeToken: 'SOL',
  };
}

/**
 * Parse announce message
 */
export function parseAnnounceMessage(message: RelayMessage): PeerInfo {
  if (message.type !== 'announce') {
    throw new Error('Not an announce message');
  }

  const data = encodeUTF8(decodeBase64(message.encryptedPayload));
  return JSON.parse(data) as PeerInfo;
}

/**
 * Check if message has expired
 */
export function isMessageExpired(
  message: RelayMessage,
  maxAge: number = 60000
): boolean {
  return Date.now() - message.timestamp > maxAge;
}

/**
 * Decrement TTL and check if message should be dropped
 */
export function decrementTTL(message: RelayMessage): RelayMessage {
  if (message.ttl <= 0) {
    throw new Error('Message TTL expired');
  }

  return {
    ...message,
    ttl: message.ttl - 1,
  };
}
