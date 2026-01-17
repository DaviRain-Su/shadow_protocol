/**
 * @px402/client - Client tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Px402Client, Px402Error, createPx402Client } from '../client.js';
import type { PrivacyProvider, X402Scheme, PaymentRequirements } from '@px402/core';

// Mock provider
const createMockProvider = (): PrivacyProvider => ({
  chainId: 'solana',
  deposit: vi.fn(),
  withdraw: vi.fn(),
  getPrivateBalance: vi.fn().mockResolvedValue(1000000000n),
  getPools: vi.fn().mockResolvedValue([]),
  generatePaymentProof: vi.fn(),
  verifyPaymentProof: vi.fn(),
  generateStealthAddress: vi.fn(),
  getNotes: vi.fn().mockResolvedValue([]),
  getUnspentNotes: vi.fn().mockResolvedValue([]),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  isNoteSpent: vi.fn(),
});

// Mock scheme
const createMockScheme = (name = 'test-scheme'): X402Scheme => ({
  name,
  supportedNetworks: ['solana'],
  createPayment: vi.fn().mockResolvedValue({
    x402Version: 1,
    scheme: name,
    network: 'solana',
    payload: { signature: 'mock_sig' },
  }),
  verifyPayment: vi.fn().mockResolvedValue({ valid: true }),
  supportsNetwork: (network: string) => network === 'solana',
  supportsAsset: vi.fn().mockResolvedValue(true),
});

describe('Px402Client', () => {
  let client: Px402Client;
  let mockProvider: PrivacyProvider;
  let mockScheme: X402Scheme;

  beforeEach(() => {
    mockProvider = createMockProvider();
    mockScheme = createMockScheme('private-exact');
    client = new Px402Client({
      provider: mockProvider,
      schemes: [mockScheme],
      defaultMode: 'private',
    });
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      expect(client).toBeInstanceOf(Px402Client);
    });

    it('should register provided schemes', () => {
      expect(client.getScheme('private-exact')).toBe(mockScheme);
    });

    it('should use default mode', () => {
      const publicClient = new Px402Client({
        provider: mockProvider,
        defaultMode: 'public',
      });
      expect(publicClient).toBeInstanceOf(Px402Client);
    });
  });

  describe('registerScheme', () => {
    it('should register new scheme', () => {
      const newScheme = createMockScheme('new-scheme');
      client.registerScheme(newScheme);
      expect(client.getScheme('new-scheme')).toBe(newScheme);
    });
  });

  describe('getScheme', () => {
    it('should return registered scheme', () => {
      expect(client.getScheme('private-exact')).toBe(mockScheme);
    });

    it('should return undefined for unregistered scheme', () => {
      expect(client.getScheme('unknown')).toBeUndefined();
    });
  });

  describe('getSchemeNames', () => {
    it('should return all scheme names', () => {
      const names = client.getSchemeNames();
      expect(names).toContain('private-exact');
    });
  });

  describe('getBalance', () => {
    it('should return balance from provider', async () => {
      const balance = await client.getBalance('SOL');
      expect(balance).toBe(1000000000n);
      expect(mockProvider.getPrivateBalance).toHaveBeenCalledWith('SOL');
    });
  });

  describe('getProvider', () => {
    it('should return provider', () => {
      expect(client.getProvider()).toBe(mockProvider);
    });
  });
});

describe('Px402Error', () => {
  it('should create error with code and message', () => {
    const error = new Px402Error('TEST_CODE', 'Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('Px402Error');
  });

  it('should include cause', () => {
    const cause = new Error('Original');
    const error = new Px402Error('ERROR', 'Message', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('createPx402Client', () => {
  it('should create client instance', () => {
    const provider = createMockProvider();
    const client = createPx402Client({ provider });
    expect(client).toBeInstanceOf(Px402Client);
  });
});
