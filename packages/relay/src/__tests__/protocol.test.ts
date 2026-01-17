/**
 * @px402/relay - Protocol tests
 */

import { describe, it, expect } from 'vitest';
import {
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
  createPingMessage,
  createPongMessage,
  createAnnounceMessage,
  parseAnnounceMessage,
  isMessageExpired,
  decrementTTL,
} from '../protocol.js';
import type { RelayPayload, PeerInfo, RelayMessage } from '../types.js';
import { RELAY_VERSION } from '../types.js';
import { encodeBase64 } from 'tweetnacl-util';

describe('generateMessageId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateMessageId();
    const id2 = generateMessageId();
    expect(id1).not.toBe(id2);
  });

  it('should generate URL-safe IDs', () => {
    const id = generateMessageId();
    expect(id).not.toMatch(/[+/=]/);
  });
});

describe('generateKeyPair', () => {
  it('should generate valid keypair', () => {
    const keyPair = generateKeyPair();
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey.length).toBe(32);
    expect(keyPair.secretKey.length).toBe(32);
  });
});

describe('derivePublicKey', () => {
  it('should derive correct public key', () => {
    const keyPair = generateKeyPair();
    const derived = derivePublicKey(keyPair.secretKey);
    expect(derived).toEqual(keyPair.publicKey);
  });
});

describe('encrypt/decrypt', () => {
  it('should encrypt and decrypt string data', () => {
    const keyPair = generateKeyPair();
    const data = 'Hello, World!';

    const encrypted = encrypt(data, keyPair.publicKey);
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.ephemeralKey).toBeTruthy();
    expect(encrypted.nonce).toBeTruthy();

    const decrypted = decrypt(
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.ephemeralKey,
      keyPair.secretKey
    );

    expect(new TextDecoder().decode(decrypted)).toBe(data);
  });

  it('should encrypt and decrypt binary data', () => {
    const keyPair = generateKeyPair();
    const data = new Uint8Array([1, 2, 3, 4, 5]);

    const encrypted = encrypt(data, keyPair.publicKey);
    const decrypted = decrypt(
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.ephemeralKey,
      keyPair.secretKey
    );

    expect(decrypted).toEqual(data);
  });

  it('should fail with wrong key', () => {
    const keyPair1 = generateKeyPair();
    const keyPair2 = generateKeyPair();
    const data = 'Secret';

    const encrypted = encrypt(data, keyPair1.publicKey);

    expect(() =>
      decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        encrypted.ephemeralKey,
        keyPair2.secretKey
      )
    ).toThrow('Decryption failed');
  });
});

describe('encryptPayload/decryptPayload', () => {
  it('should encrypt and decrypt relay payload', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = {
      method: 'POST',
      url: 'https://example.com/api',
      headers: { 'Content-Type': 'application/json' },
      body: '{"test": true}',
    };

    const encrypted = encryptPayload(payload, keyPair.publicKey);
    const decrypted = decryptPayload(
      encrypted.encryptedPayload,
      encrypted.ephemeralKey,
      keyPair.secretKey
    );

    expect(decrypted).toEqual(payload);
  });
});

describe('createRelayMessage', () => {
  it('should create valid relay message', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = {
      method: 'GET',
      url: 'https://example.com',
      headers: {},
    };

    const message = createRelayMessage(payload, keyPair.publicKey, {
      fee: '1000',
      feeToken: 'SOL',
    });

    expect(message.id).toBeTruthy();
    expect(message.type).toBe('request');
    expect(message.version).toBe(RELAY_VERSION);
    expect(message.encryptedPayload).toBeTruthy();
    expect(message.ephemeralKey).toBeTruthy();
    expect(message.fee).toBe('1000');
    expect(message.feeToken).toBe('SOL');
    expect(message.ttl).toBe(10);
  });

  it('should create response message for payload with status', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = {
      method: 'GET',
      url: 'https://example.com',
      headers: {},
      status: 200,
      responseBody: '{"data": "test"}',
    };

    const message = createRelayMessage(payload, keyPair.publicKey, {
      fee: '1000',
      feeToken: 'SOL',
    });

    expect(message.type).toBe('response');
  });
});

describe('encodeMessage/decodeMessage', () => {
  it('should encode and decode message', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = {
      method: 'GET',
      url: 'https://example.com',
      headers: {},
    };

    const message = createRelayMessage(payload, keyPair.publicKey, {
      fee: '1000',
      feeToken: 'SOL',
    });

    const encoded = encodeMessage(message);
    const decoded = decodeMessage(encoded);

    expect(decoded.id).toBe(message.id);
    expect(decoded.type).toBe(message.type);
    expect(decoded.version).toBe(message.version);
  });
});

describe('validateMessage', () => {
  it('should accept valid message', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = { method: 'GET', url: 'test', headers: {} };
    const message = createRelayMessage(payload, keyPair.publicKey, {
      fee: '1000',
      feeToken: 'SOL',
    });

    expect(() => validateMessage(message)).not.toThrow();
  });

  it('should reject message without id', () => {
    const message = { type: 'request' } as RelayMessage;
    expect(() => validateMessage(message)).toThrow('Missing message id');
  });

  it('should reject unsupported version', () => {
    const message = {
      id: 'test',
      type: 'request',
      version: 999,
      encryptedPayload: 'x',
      ephemeralKey: 'y',
      ttl: 1,
      fee: '1000',
      feeToken: 'SOL',
      timestamp: Date.now(),
    } as RelayMessage;
    expect(() => validateMessage(message)).toThrow('Unsupported version');
  });
});

describe('createOnionLayers', () => {
  it('should create layers for route', () => {
    const peer1 = generateKeyPair();
    const peer2 = generateKeyPair();

    const route: PeerInfo[] = [
      {
        id: 'peer1',
        address: 'localhost:8401',
        publicKey: encodeBase64(peer1.publicKey),
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      },
      {
        id: 'peer2',
        address: 'localhost:8402',
        publicKey: encodeBase64(peer2.publicKey),
        lastSeen: Date.now(),
        reputation: 100,
        protocols: ['relay-v1'],
        feeConfig: { minFee: '1000', feeToken: 'SOL' },
        isBootstrap: false,
      },
    ];

    const payload: RelayPayload = { method: 'GET', url: 'test', headers: {} };
    const layers = createOnionLayers(payload, route);

    expect(layers.length).toBe(2);
    expect(layers[0].nodeId).toBe('peer1');
    expect(layers[1].nodeId).toBe('peer2');
  });

  it('should throw for empty route', () => {
    const payload: RelayPayload = { method: 'GET', url: 'test', headers: {} };
    expect(() => createOnionLayers(payload, [])).toThrow('Route cannot be empty');
  });
});

describe('peelOnionLayer', () => {
  it('should peel innermost layer', () => {
    const keyPair = generateKeyPair();
    const payload: RelayPayload = {
      method: 'POST',
      url: 'https://api.example.com',
      headers: { 'X-Test': 'value' },
    };

    const encrypted = encryptPayload(payload, keyPair.publicKey);
    const { payload: decrypted, isInnermost } = peelOnionLayer(
      encrypted.encryptedPayload,
      encrypted.ephemeralKey,
      keyPair.secretKey
    );

    expect(isInnermost).toBe(true);
    expect(decrypted.method).toBe('POST');
    expect(decrypted.url).toBe('https://api.example.com');
  });
});

describe('ping/pong messages', () => {
  it('should create ping message', () => {
    const ping = createPingMessage('node1');
    expect(ping.type).toBe('ping');
    expect(ping.ttl).toBe(1);
    expect(ping.fee).toBe('0');
  });

  it('should create pong message with matching id', () => {
    const pingId = 'test-ping-id';
    const pong = createPongMessage(pingId);
    expect(pong.type).toBe('pong');
    expect(pong.id).toBe(pingId);
  });
});

describe('announce messages', () => {
  it('should create and parse announce message', () => {
    const nodeInfo: PeerInfo = {
      id: 'node1',
      address: 'localhost:8402',
      publicKey: 'pubkey123',
      lastSeen: Date.now(),
      reputation: 100,
      protocols: ['relay-v1'],
      feeConfig: { minFee: '1000', feeToken: 'SOL' },
      isBootstrap: false,
    };

    const announce = createAnnounceMessage(nodeInfo);
    expect(announce.type).toBe('announce');

    const parsed = parseAnnounceMessage(announce);
    expect(parsed.id).toBe(nodeInfo.id);
    expect(parsed.address).toBe(nodeInfo.address);
  });

  it('should throw for non-announce message', () => {
    const ping = createPingMessage('node1');
    expect(() => parseAnnounceMessage(ping)).toThrow('Not an announce message');
  });
});

describe('isMessageExpired', () => {
  it('should return false for fresh message', () => {
    const keyPair = generateKeyPair();
    const message = createRelayMessage(
      { method: 'GET', url: 'test', headers: {} },
      keyPair.publicKey,
      { fee: '1000', feeToken: 'SOL' }
    );

    expect(isMessageExpired(message)).toBe(false);
  });

  it('should return true for old message', () => {
    const keyPair = generateKeyPair();
    const message = createRelayMessage(
      { method: 'GET', url: 'test', headers: {} },
      keyPair.publicKey,
      { fee: '1000', feeToken: 'SOL' }
    );

    message.timestamp = Date.now() - 120000; // 2 minutes ago
    expect(isMessageExpired(message, 60000)).toBe(true);
  });
});

describe('decrementTTL', () => {
  it('should decrement TTL', () => {
    const keyPair = generateKeyPair();
    const message = createRelayMessage(
      { method: 'GET', url: 'test', headers: {} },
      keyPair.publicKey,
      { fee: '1000', feeToken: 'SOL', ttl: 5 }
    );

    const decremented = decrementTTL(message);
    expect(decremented.ttl).toBe(4);
  });

  it('should throw when TTL is 0', () => {
    const keyPair = generateKeyPair();
    const message = createRelayMessage(
      { method: 'GET', url: 'test', headers: {} },
      keyPair.publicKey,
      { fee: '1000', feeToken: 'SOL', ttl: 0 }
    );

    expect(() => decrementTTL(message)).toThrow('Message TTL expired');
  });
});
