/**
 * @px402/server - Verifier tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentVerifier, createVerifier } from '../verifier.js';
import type { X402Scheme, PaymentRequirements, PaymentPayload } from '@px402/core';

// Mock scheme
const createMockScheme = (name = 'test-scheme'): X402Scheme => ({
  name,
  supportedNetworks: ['solana'],
  createPayment: vi.fn(),
  verifyPayment: vi.fn().mockResolvedValue({ valid: true }),
  supportsNetwork: (network: string) => network === 'solana',
  supportsAsset: vi.fn().mockResolvedValue(true),
});

describe('PaymentVerifier', () => {
  let verifier: PaymentVerifier;
  let mockScheme: X402Scheme;

  const validRequirements: PaymentRequirements = {
    x402Version: 1,
    scheme: 'private-exact',
    network: 'solana',
    payTo: 'recipient123',
    maxAmountRequired: '1000000',
    asset: 'SOL',
  };

  const validPayload: PaymentPayload = {
    x402Version: 1,
    scheme: 'private-exact',
    network: 'solana',
    payload: { signature: 'sig123', amount: '1000000' },
  };

  beforeEach(() => {
    mockScheme = createMockScheme('private-exact');
    verifier = new PaymentVerifier({ schemes: [mockScheme] });
  });

  describe('constructor', () => {
    it('should create verifier with schemes', () => {
      expect(verifier).toBeInstanceOf(PaymentVerifier);
      expect(verifier.getScheme('private-exact')).toBe(mockScheme);
    });
  });

  describe('registerScheme', () => {
    it('should register new scheme', () => {
      const newScheme = createMockScheme('new-scheme');
      verifier.registerScheme(newScheme);
      expect(verifier.getScheme('new-scheme')).toBe(newScheme);
    });
  });

  describe('getSchemeNames', () => {
    it('should return registered scheme names', () => {
      const names = verifier.getSchemeNames();
      expect(names).toContain('private-exact');
    });
  });

  describe('verify', () => {
    it('should verify valid JSON payment header', async () => {
      const header = JSON.stringify(validPayload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(true);
      expect(mockScheme.verifyPayment).toHaveBeenCalledWith(validPayload, validRequirements);
    });

    it('should verify valid Base64 payment header', async () => {
      const header = Buffer.from(JSON.stringify(validPayload)).toString('base64');
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid header format', async () => {
      const result = await verifier.verify('invalid', validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid payment header');
    });

    it('should reject unknown scheme', async () => {
      const payload = { ...validPayload, scheme: 'unknown' };
      const header = JSON.stringify(payload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unknown payment scheme');
    });

    it('should reject scheme mismatch', async () => {
      const requirements = { ...validRequirements, scheme: 'different-scheme' };
      const header = JSON.stringify(validPayload);
      const result = await verifier.verify(header, requirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Scheme mismatch');
    });

    it('should reject network mismatch', async () => {
      const requirements = { ...validRequirements, network: 'ethereum' };
      const header = JSON.stringify(validPayload);
      const result = await verifier.verify(header, requirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Network mismatch');
    });

    it('should reject missing x402Version', async () => {
      const payload = { ...validPayload, x402Version: undefined as any };
      const header = JSON.stringify(payload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('x402Version');
    });

    it('should reject missing scheme', async () => {
      const payload = { ...validPayload, scheme: '' };
      const header = JSON.stringify(payload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('scheme');
    });

    it('should reject missing network', async () => {
      const payload = { ...validPayload, network: '' };
      const header = JSON.stringify(payload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('network');
    });

    it('should reject missing payload', async () => {
      const payload = { ...validPayload, payload: undefined as any };
      const header = JSON.stringify(payload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('payload');
    });

    it('should handle verification error', async () => {
      (mockScheme.verifyPayment as any).mockRejectedValue(new Error('Verification failed'));
      const header = JSON.stringify(validPayload);
      const result = await verifier.verify(header, validRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Verification error');
    });
  });

  describe('verifyPayload', () => {
    it('should verify payload directly', async () => {
      const result = await verifier.verifyPayload(validPayload, validRequirements);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown scheme', async () => {
      const payload = { ...validPayload, scheme: 'unknown' };
      const result = await verifier.verifyPayload(payload, validRequirements);
      expect(result.valid).toBe(false);
    });
  });
});

describe('createVerifier', () => {
  it('should create verifier instance', () => {
    const scheme = createMockScheme();
    const verifier = createVerifier({ schemes: [scheme] });
    expect(verifier).toBeInstanceOf(PaymentVerifier);
  });
});
