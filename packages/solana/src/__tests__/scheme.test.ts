/**
 * @px402/solana - PrivateCashScheme tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { PrivateCashScheme } from '../scheme.js';
import { SolanaPrivacyProvider } from '../provider.js';
import type { PaymentRequirements } from '@px402/core';

// Mock the provider
vi.mock('../provider.js', () => {
  return {
    SolanaPrivacyProvider: vi.fn().mockImplementation(() => ({
      chainId: 'solana',
      findNoteForPayment: vi.fn(),
      generatePaymentProof: vi.fn(),
      initialize: vi.fn(),
    })),
  };
});

describe('PrivateCashScheme', () => {
  let scheme: PrivateCashScheme;
  let mockProvider: SolanaPrivacyProvider;

  beforeEach(() => {
    const wallet = Keypair.generate();
    mockProvider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet,
    });

    scheme = new PrivateCashScheme({
      provider: mockProvider,
      rpcUrl: 'https://api.devnet.solana.com',
    });
  });

  it('should have correct name', () => {
    expect(scheme.name).toBe('private-exact');
  });

  it('should support solana network', () => {
    expect(scheme.supportedNetworks).toContain('solana');
  });

  it('should check network support', () => {
    expect(scheme.supportsNetwork('solana')).toBe(true);
    expect(scheme.supportsNetwork('ethereum')).toBe(false);
  });

  it('should support known assets', async () => {
    expect(await scheme.supportsAsset('SOL', 'solana')).toBe(true);
    expect(
      await scheme.supportsAsset(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'solana'
      )
    ).toBe(true);
    expect(
      await scheme.supportsAsset(
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'solana'
      )
    ).toBe(true);
  });

  it('should not support unknown assets', async () => {
    expect(await scheme.supportsAsset('UNKNOWN', 'solana')).toBe(false);
  });

  it('should not support non-solana networks', async () => {
    expect(await scheme.supportsAsset('SOL', 'ethereum')).toBe(false);
  });
});

describe('PrivateCashScheme.createPayment', () => {
  let scheme: PrivateCashScheme;
  let mockProvider: any;

  beforeEach(() => {
    const wallet = Keypair.generate();

    mockProvider = {
      chainId: 'solana',
      findNoteForPayment: vi.fn(),
      generatePaymentProof: vi.fn(),
      initialize: vi.fn(),
    };

    scheme = new PrivateCashScheme({
      provider: mockProvider as SolanaPrivacyProvider,
      rpcUrl: 'https://api.devnet.solana.com',
    });
  });

  it('should throw for wrong scheme', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'wrong-scheme',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'Scheme mismatch'
    );
  });

  it('should throw for unsupported network', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'ethereum',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'Network not supported'
    );
  });

  it('should throw for missing payTo', async () => {
    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: '',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'payTo address is required'
    );
  });

  it('should throw for insufficient balance', async () => {
    mockProvider.findNoteForPayment.mockResolvedValue(undefined);

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000000',
      asset: 'SOL',
    };

    await expect(scheme.createPayment(requirements)).rejects.toThrow(
      'Insufficient balance'
    );
  });

  it('should create payment with valid note', async () => {
    const mockNote = {
      chainId: 'solana',
      poolAddress: 'Pool123',
      commitment: '0xcommit',
      nullifier: '0xnull',
      secret: '0xsecret',
      leafIndex: 1,
      amount: 2_000_000_000n,
      token: 'SOL',
      timestamp: Date.now(),
    };

    const mockProof = {
      chainId: 'solana',
      proofType: 'transfer',
      proof: 'signature123',
      metadata: {
        amount: 1_000_000_000n,
        token: 'SOL',
        timestamp: Date.now(),
      },
    };

    mockProvider.findNoteForPayment.mockResolvedValue(mockNote);
    mockProvider.generatePaymentProof.mockResolvedValue(mockProof);

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipientAddress',
      maxAmountRequired: '1000000000',
      asset: 'SOL',
    };

    const payload = await scheme.createPayment(requirements);

    expect(payload.x402Version).toBe(1);
    expect(payload.scheme).toBe('private-exact');
    expect(payload.network).toBe('solana');
    expect(payload.payload.signature).toBe('signature123');
    expect(payload.payload.amount).toBe('1000000000');
    expect(payload.payload.token).toBe('SOL');
  });
});

describe('PrivateCashScheme.verifyPayment', () => {
  let scheme: PrivateCashScheme;

  beforeEach(() => {
    const wallet = Keypair.generate();
    const mockProvider = {
      chainId: 'solana',
    } as SolanaPrivacyProvider;

    scheme = new PrivateCashScheme({
      provider: mockProvider,
      rpcUrl: 'https://api.devnet.solana.com',
    });
  });

  it('should reject wrong scheme', async () => {
    const payload = {
      x402Version: 1,
      scheme: 'wrong',
      network: 'solana',
      payload: {},
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid scheme');
  });

  it('should reject wrong network', async () => {
    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'ethereum',
      payload: {},
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid network');
  });

  it('should reject insufficient amount', async () => {
    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: {
        signature: 'sig123',
        nullifierHash: '0xnull',
        amount: '100',
        token: 'SOL',
        timestamp: Date.now(),
      },
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient amount');
  });

  it('should reject token mismatch', async () => {
    const payload = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payload: {
        signature: 'sig123',
        nullifierHash: '0xnull',
        amount: '1000000',
        token: 'USDC',
        timestamp: Date.now(),
      },
    };

    const requirements: PaymentRequirements = {
      x402Version: 1,
      scheme: 'private-exact',
      network: 'solana',
      payTo: 'recipient',
      maxAmountRequired: '1000000',
      asset: 'SOL',
    };

    const result = await scheme.verifyPayment(payload, requirements);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Token mismatch');
  });
});
