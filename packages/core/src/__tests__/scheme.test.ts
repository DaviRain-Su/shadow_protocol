/**
 * @px402/core - Scheme tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SchemeRegistry,
  BaseX402Scheme,
  SCHEME_NAMES,
  X402_VERSION,
  type PaymentRequirements,
  type PaymentPayload,
  type VerificationResult,
} from '../scheme.js';

/**
 * Test scheme implementation
 */
class TestScheme extends BaseX402Scheme {
  readonly name = 'test-scheme';
  readonly supportedNetworks = ['testnet'];

  async createPayment(requirements: PaymentRequirements): Promise<PaymentPayload> {
    this.validateRequirements(requirements);
    return this.createBasePayload(requirements, {
      testField: 'test-value',
    });
  }

  async verifyPayment(
    payload: PaymentPayload,
    _requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    if (payload.payload.testField === 'test-value') {
      return { valid: true };
    }
    return { valid: false, reason: 'Invalid test field' };
  }
}

describe('BaseX402Scheme', () => {
  let scheme: TestScheme;

  beforeEach(() => {
    scheme = new TestScheme();
  });

  it('should have correct name', () => {
    expect(scheme.name).toBe('test-scheme');
  });

  it('should have supported networks', () => {
    expect(scheme.supportedNetworks).toContain('testnet');
  });

  it('should check network support', () => {
    expect(scheme.supportsNetwork('testnet')).toBe(true);
    expect(scheme.supportsNetwork('mainnet')).toBe(false);
  });

  it('should support all assets by default', async () => {
    expect(await scheme.supportsAsset('ANY', 'testnet')).toBe(true);
  });

  it('should create payment', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const payload = await scheme.createPayment(requirements);

    expect(payload.scheme).toBe('test-scheme');
    expect(payload.network).toBe('testnet');
    expect(payload.x402Version).toBe(1);
    expect(payload.payload.testField).toBe('test-value');
  });

  it('should reject wrong scheme', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'wrong-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'Scheme mismatch'
    );
  });

  it('should reject unsupported network', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'unsupported',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'Network not supported'
    );
  });

  it('should reject missing payTo', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: '',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'payTo address is required'
    );
  });

  it('should verify payment', async () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payload: { testField: 'test-value' },
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid payment', async () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payload: { testField: 'wrong-value' },
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid test field');
  });
});

describe('SchemeRegistry', () => {
  let registry: SchemeRegistry;
  let testScheme: TestScheme;

  beforeEach(() => {
    registry = new SchemeRegistry();
    testScheme = new TestScheme();
  });

  it('should register scheme', () => {
    registry.register(testScheme);
    expect(registry.get('test-scheme')).toBe(testScheme);
  });

  it('should return undefined for unknown scheme', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('should get scheme names', () => {
    registry.register(testScheme);
    expect(registry.getNames()).toContain('test-scheme');
  });

  it('should find schemes by network', () => {
    registry.register(testScheme);
    const schemes = registry.findByNetwork('testnet');
    expect(schemes).toContain(testScheme);
  });

  it('should return empty for unsupported network', () => {
    registry.register(testScheme);
    const schemes = registry.findByNetwork('unknown');
    expect(schemes).toHaveLength(0);
  });

  it('should create payment through registry', async () => {
    registry.register(testScheme);

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const payload = await registry.createPayment(requirements);
    expect(payload.scheme).toBe('test-scheme');
  });

  it('should throw for unknown scheme in createPayment', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'unknown',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    await expect(registry.createPayment(requirements)).rejects.toThrow(
      'Unknown scheme'
    );
  });

  it('should verify payment through registry', async () => {
    registry.register(testScheme);

    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payload: { testField: 'test-value' },
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'test-scheme',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const result = await registry.verifyPayment(payload, requirements);
    expect(result.valid).toBe(true);
  });

  it('should return invalid for unknown scheme in verifyPayment', async () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'unknown',
      network: 'testnet',
      payload: {},
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'unknown',
      network: 'testnet',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'TEST',
    };

    const result = await registry.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown scheme');
  });
});

describe('Constants', () => {
  it('should have scheme names', () => {
    expect(SCHEME_NAMES.EXACT).toBe('exact');
    expect(SCHEME_NAMES.PRIVATE_EXACT).toBe('private-exact');
  });

  it('should have x402 version', () => {
    expect(X402_VERSION).toBe(1);
  });
});
