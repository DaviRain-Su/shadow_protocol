/**
 * @px402/client - HTTP utilities tests
 */

import { describe, it, expect } from 'vitest';
import {
  parsePaymentRequirements,
  createPaymentHeader,
  createPaymentHeaderBase64,
  parsePaymentHeader,
  is402Response,
  create402Headers,
  validatePaymentRequirements,
} from '../http.js';
import type { PaymentRequirements, PaymentPayload } from '@px402/core';

describe('parsePaymentRequirements', () => {
  it('should parse from X-Payment-Requirements header', () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient123',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    const headers = new Headers({
      'X-Payment-Requirements': JSON.stringify(requirements),
    });
    const response = new Response(null, { status: 402, headers });

    const parsed = parsePaymentRequirements(response);
    expect(parsed).toEqual(requirements);
  });

  it('should parse from WWW-Authenticate header', () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana',
      payTo: 'address',
      maxAmountRequired: '500',
      asset: 'USDC',
    };

    const headers = new Headers({
      'WWW-Authenticate': `X402 ${JSON.stringify(requirements)}`,
    });
    const response = new Response(null, { status: 402, headers });

    const parsed = parsePaymentRequirements(response);
    expect(parsed).toEqual(requirements);
  });

  it('should return null for missing headers', () => {
    const response = new Response(null, { status: 402 });
    const parsed = parsePaymentRequirements(response);
    expect(parsed).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    const headers = new Headers({
      'X-Payment-Requirements': 'invalid json',
    });
    const response = new Response(null, { status: 402, headers });

    const parsed = parsePaymentRequirements(response);
    expect(parsed).toBeNull();
  });
});

describe('createPaymentHeader', () => {
  it('should create JSON header', () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: { signature: 'sig123' },
    };

    const header = createPaymentHeader(payload);
    expect(header).toBe(JSON.stringify(payload));
  });
});

describe('createPaymentHeaderBase64', () => {
  it('should create Base64 encoded header', () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana',
      payload: { data: 'test' },
    };

    const header = createPaymentHeaderBase64(payload);
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    expect(JSON.parse(decoded)).toEqual(payload);
  });
});

describe('parsePaymentHeader', () => {
  it('should parse JSON header', () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: { test: true },
    };

    const parsed = parsePaymentHeader(JSON.stringify(payload));
    expect(parsed).toEqual(payload);
  });

  it('should parse Base64 header', () => {
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana',
      payload: {},
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const parsed = parsePaymentHeader(base64);
    expect(parsed).toEqual(payload);
  });

  it('should return null for invalid header', () => {
    expect(parsePaymentHeader('invalid')).toBeNull();
  });
});

describe('is402Response', () => {
  it('should return true for 402 status', () => {
    const response = new Response(null, { status: 402 });
    expect(is402Response(response)).toBe(true);
  });

  it('should return false for other status codes', () => {
    expect(is402Response(new Response(null, { status: 200 }))).toBe(false);
    expect(is402Response(new Response(null, { status: 401 }))).toBe(false);
    expect(is402Response(new Response(null, { status: 404 }))).toBe(false);
    expect(is402Response(new Response(null, { status: 500 }))).toBe(false);
  });
});

describe('create402Headers', () => {
  it('should create correct headers', () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'address',
      maxAmountRequired: '100',
      asset: 'SOL',
    };

    const headers = create402Headers(requirements);

    expect(headers['X-Payment-Requirements']).toBe(JSON.stringify(requirements));
    expect(headers['X-402-Version']).toBe('1');
    expect(headers['WWW-Authenticate']).toBe(`X402 ${JSON.stringify(requirements)}`);
  });
});

describe('validatePaymentRequirements', () => {
  const validRequirements: PaymentRequirements = {
    x402Version: 1,
    scheme: 'private-exact',
    network: 'solana',
    payTo: 'recipient',
    maxAmountRequired: '1000',
    asset: 'SOL',
  };

  it('should validate correct requirements', () => {
    const result = validatePaymentRequirements(validRequirements);
    expect(result.valid).toBe(true);
  });

  it('should reject missing x402Version', () => {
    const invalid = { ...validRequirements, x402Version: undefined as any };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('x402Version');
  });

  it('should reject missing scheme', () => {
    const invalid = { ...validRequirements, scheme: '' };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('scheme');
  });

  it('should reject missing network', () => {
    const invalid = { ...validRequirements, network: '' };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('network');
  });

  it('should reject missing payTo', () => {
    const invalid = { ...validRequirements, payTo: '' };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('payTo');
  });

  it('should reject missing maxAmountRequired', () => {
    const invalid = { ...validRequirements, maxAmountRequired: '' };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maxAmountRequired');
  });

  it('should reject missing asset', () => {
    const invalid = { ...validRequirements, asset: '' };
    const result = validatePaymentRequirements(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('asset');
  });
});
