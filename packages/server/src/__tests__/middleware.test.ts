/**
 * @px402/server - Middleware tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPaymentRequirements,
  send402Response,
  px402Middleware,
  requirePayment,
  createRequirePayment,
} from '../middleware.js';
import type { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../types.js';
import type { X402Scheme } from '@px402/core';

// Mock response
const createMockResponse = (): ExpressResponse => {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null,
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.setHeader = vi.fn((name: string, value: string) => {
    res.headers[name] = value;
    return res;
  });
  res.set = vi.fn((name: string, value: string) => {
    res.headers[name] = value;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  res.send = vi.fn((body?: unknown) => {
    res.body = body;
    return res;
  });
  return res;
};

// Mock request
const createMockRequest = (headers: Record<string, string> = {}): ExpressRequest => ({
  headers,
  path: '/test',
  url: '/test',
  method: 'GET',
});

// Mock scheme
const createMockScheme = (name = 'private-exact'): X402Scheme => ({
  name,
  supportedNetworks: ['solana'],
  createPayment: vi.fn(),
  verifyPayment: vi.fn().mockResolvedValue({ valid: true }),
  supportsNetwork: (network: string) => network === 'solana',
  supportsAsset: vi.fn().mockResolvedValue(true),
});

describe('createPaymentRequirements', () => {
  it('should create requirements with defaults', () => {
    const requirements = createPaymentRequirements({
      amount: '1000000',
      token: 'SOL',
      recipient: 'address123',
    });

    expect(requirements.x402Version).toBe(1);
    expect(requirements.scheme).toBe('private-exact');
    expect(requirements.network).toBe('solana');
    expect(requirements.payTo).toBe('address123');
    expect(requirements.maxAmountRequired).toBe('1000000');
    expect(requirements.asset).toBe('SOL');
  });

  it('should use provided scheme and network', () => {
    const requirements = createPaymentRequirements({
      amount: '100',
      token: 'USDC',
      recipient: 'addr',
      scheme: 'exact',
      network: 'base',
    });

    expect(requirements.scheme).toBe('exact');
    expect(requirements.network).toBe('base');
  });

  it('should include description and resource', () => {
    const requirements = createPaymentRequirements({
      amount: '100',
      token: 'SOL',
      recipient: 'addr',
      description: 'Test payment',
      resource: '/api/test',
    });

    expect(requirements.description).toBe('Test payment');
    expect(requirements.resource).toBe('/api/test');
  });
});

describe('send402Response', () => {
  it('should send 402 response with headers', () => {
    const res = createMockResponse();
    const requirements = createPaymentRequirements({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    send402Response(res, requirements);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-payment-requirements',
      expect.any(String)
    );
    expect(res.setHeader).toHaveBeenCalledWith('x-402-version', '1');
    expect(res.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      expect.stringContaining('X402')
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Payment Required',
        paymentRequirements: requirements,
      })
    );
  });
});

describe('px402Middleware', () => {
  let mockScheme: X402Scheme;

  beforeEach(() => {
    mockScheme = createMockScheme();
  });

  it('should call next without payment header', async () => {
    const middleware = px402Middleware({ schemes: [mockScheme] });
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next without requirements', async () => {
    const middleware = px402Middleware({ schemes: [mockScheme] });
    const req = createMockRequest({ 'x-payment': '{"test": true}' });
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should verify payment when header and requirements present', async () => {
    const onPaymentVerified = vi.fn();
    const middleware = px402Middleware({
      schemes: [mockScheme],
      onPaymentVerified,
    });

    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: { signature: 'sig' },
    };

    const req = createMockRequest({ 'x-payment': JSON.stringify(payload) });
    req.paymentRequirements = createPaymentRequirements({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(req.paymentResult).toBeDefined();
    expect(req.paymentResult?.valid).toBe(true);
    expect(onPaymentVerified).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should call onPaymentFailed for invalid payment', async () => {
    (mockScheme.verifyPayment as any).mockResolvedValue({
      valid: false,
      reason: 'Invalid signature',
    });

    const onPaymentFailed = vi.fn();
    const middleware = px402Middleware({
      schemes: [mockScheme],
      onPaymentFailed,
    });

    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: {},
    };

    const req = createMockRequest({ 'x-payment': JSON.stringify(payload) });
    req.paymentRequirements = createPaymentRequirements({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(onPaymentFailed).toHaveBeenCalled();
  });
});

describe('requirePayment', () => {
  it('should return 402 without payment header', async () => {
    const middleware = requirePayment({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach requirements to request', async () => {
    const middleware = requirePayment({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(req.paymentRequirements).toBeDefined();
    expect(req.paymentRequirements?.maxAmountRequired).toBe('1000');
  });

  it('should call next with valid payment result', async () => {
    const middleware = requirePayment({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const req = createMockRequest({ 'x-payment': 'test' });
    req.paymentResult = { valid: true };
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 402 with invalid payment result', async () => {
    const middleware = requirePayment({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const req = createMockRequest({ 'x-payment': 'test' });
    req.paymentResult = { valid: false, reason: 'Invalid' };
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('createRequirePayment', () => {
  it('should create middleware factory', () => {
    const factory = createRequirePayment({
      schemes: [createMockScheme()],
    });

    const middleware = factory({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    expect(typeof middleware).toBe('function');
  });

  it('should verify payment with schemes', async () => {
    const mockScheme = createMockScheme();
    const factory = createRequirePayment({
      schemes: [mockScheme],
    });

    const middleware = factory({
      amount: '1000',
      token: 'SOL',
      recipient: 'addr',
    });

    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: { signature: 'sig' },
    };

    const req = createMockRequest({ 'x-payment': JSON.stringify(payload) });
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(mockScheme.verifyPayment).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
