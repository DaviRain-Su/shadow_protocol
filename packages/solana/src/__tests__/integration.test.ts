/**
 * @px402/solana - End-to-End Integration Tests
 *
 * Tests the complete payment flow from client to server
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Px402Client, Px402Error } from '@px402/client';
import {
  PaymentVerifier,
  px402Middleware,
  requirePayment,
  createPaymentRequirements,
  MemoryNullifierRegistry,
} from '@px402/server';
import { SolanaPrivacyProvider } from '../provider.js';
import { PrivateCashScheme } from '../scheme.js';
import type { PaymentRequirements, PaymentPayload } from '@px402/core';

// Mock RPC Connection
vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Connection: vi.fn().mockImplementation(() => ({
      getTransaction: vi.fn().mockResolvedValue({
        slot: 12345,
        meta: {
          err: null,
          preBalances: [1000000000, 0],
          postBalances: [0, 1000000000],
        },
        transaction: {
          message: {
            getAccountKeys: () => ({
              staticAccountKeys: [
                { toBase58: () => 'sender123' },
                { toBase58: () => 'recipient123' },
              ],
            }),
          },
        },
      }),
    })),
  };
});

describe('End-to-End Payment Flow', () => {
  let provider: SolanaPrivacyProvider;
  let clientScheme: PrivateCashScheme;
  let serverScheme: PrivateCashScheme;
  let client: Px402Client;
  let verifier: PaymentVerifier;
  let nullifierRegistry: MemoryNullifierRegistry;

  beforeEach(async () => {
    // Create provider with mock wallet
    provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet: {
        publicKey: { toBase58: () => 'wallet123' },
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      } as any,
    });

    await provider.initialize();

    // Deposit mock note for testing
    await provider.deposit({
      amount: BigInt(10000000), // 0.01 SOL
      token: 'SOL',
    });

    // Create nullifier registry for server
    nullifierRegistry = new MemoryNullifierRegistry({ ttl: 0 });

    // Create schemes (client doesn't need registry, server does)
    clientScheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
    });

    serverScheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
      nullifierRegistry,
    });

    // Create client
    client = new Px402Client({
      provider,
      schemes: [clientScheme],
      defaultMode: 'private',
    });

    // Create server verifier
    verifier = new PaymentVerifier({
      schemes: [serverScheme],
    });
  });

  describe('Direct Payment Flow (No Relay)', () => {
    it('should complete payment successfully', async () => {
      // 1. Server creates payment requirements
      const requirements = createPaymentRequirements({
        amount: '1000000', // 0.001 SOL
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      // 2. Client creates payment
      const paymentPayload = await clientScheme.createPayment(requirements);

      expect(paymentPayload).toBeDefined();
      expect(paymentPayload.scheme).toBe('private-exact');
      expect(paymentPayload.network).toBe('solana');
      expect(paymentPayload.payload).toBeDefined();

      // 3. Server verifies payment
      const result = await serverScheme.verifyPayment(paymentPayload, requirements);

      expect(result.valid).toBe(true);
      expect(result.details?.signature).toBeDefined();
    });

    it('should prevent double-spend with same nullifier', async () => {
      const requirements = createPaymentRequirements({
        amount: '1000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      // First payment
      const payment1 = await clientScheme.createPayment(requirements);
      const result1 = await serverScheme.verifyPayment(payment1, requirements);
      expect(result1.valid).toBe(true);

      // Second payment with same nullifier should fail
      const result2 = await serverScheme.verifyPayment(payment1, requirements);
      expect(result2.valid).toBe(false);
      expect(result2.reason).toContain('Double-spend');
    });

    it('should reject insufficient amount', async () => {
      const requirements = createPaymentRequirements({
        amount: '100000000', // More than available
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      await expect(clientScheme.createPayment(requirements)).rejects.toThrow(
        /Insufficient balance/
      );
    });

    it('should reject wrong token', async () => {
      const requirements = createPaymentRequirements({
        amount: '1000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      const payment = await clientScheme.createPayment(requirements);

      // Modify token in requirements for verification
      const wrongTokenRequirements = {
        ...requirements,
        asset: 'USDC',
      };

      const result = await serverScheme.verifyPayment(payment, wrongTokenRequirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Token mismatch');
    });

    it('should reject wrong scheme', async () => {
      const requirements = createPaymentRequirements({
        amount: '1000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      const payment = await clientScheme.createPayment(requirements);

      // Modify scheme
      const wrongSchemePayment: PaymentPayload = {
        ...payment,
        scheme: 'exact',
      };

      const result = await serverScheme.verifyPayment(wrongSchemePayment, requirements);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid scheme');
    });
  });

  describe('Server Middleware Integration', () => {
    it('should create valid 402 response requirements', () => {
      const requirements = createPaymentRequirements({
        amount: '5000000',
        token: 'SOL',
        recipient: 'merchant123',
        description: 'API access fee',
        resource: '/api/premium',
      });

      expect(requirements.x402Version).toBe(1);
      expect(requirements.scheme).toBe('private-exact');
      expect(requirements.network).toBe('solana');
      expect(requirements.payTo).toBe('merchant123');
      expect(requirements.maxAmountRequired).toBe('5000000');
      expect(requirements.asset).toBe('SOL');
    });

    it('should verify payment through verifier', async () => {
      const requirements = createPaymentRequirements({
        amount: '1000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      const payment = await clientScheme.createPayment(requirements);
      const paymentHeader = JSON.stringify(payment);

      const result = await verifier.verify(paymentHeader, requirements);
      expect(result.valid).toBe(true);
    });
  });

  describe('Px402Client Integration', () => {
    it('should register schemes correctly', () => {
      expect(client.getScheme('private-exact')).toBe(clientScheme);
      expect(client.getSchemeNames()).toContain('private-exact');
    });

    it('should get balance from provider', async () => {
      const balance = await client.getBalance('SOL');
      expect(balance).toBe(10000000n);
    });

    it('should return provider', () => {
      expect(client.getProvider()).toBe(provider);
    });
  });

  describe('Provider Note Management', () => {
    it('should track notes correctly', async () => {
      const notes = await provider.getUnspentNotes('SOL');
      expect(notes.length).toBeGreaterThan(0);

      const balance = await provider.getPrivateBalance('SOL');
      expect(balance).toBe(10000000n);
    });

    it('should export and import notes', async () => {
      const exported = await provider.exportNotes();
      expect(exported.length).toBeGreaterThan(0);

      // Create new provider and import
      const newProvider = new SolanaPrivacyProvider({
        rpcUrl: 'https://api.devnet.solana.com',
        wallet: {
          publicKey: { toBase58: () => 'wallet456' },
          signTransaction: vi.fn(),
          signAllTransactions: vi.fn(),
        } as any,
      });

      await newProvider.initialize();
      await newProvider.importNotes(exported);

      const balance = await newProvider.getPrivateBalance('SOL');
      expect(balance).toBe(10000000n);
    });
  });

  describe('Multiple Payments', () => {
    it('should handle sequential payments', async () => {
      // Deposit enough for multiple payments
      await provider.deposit({ amount: BigInt(5000000), token: 'SOL' });

      // Use recipient123 to match the mocked transaction
      const requirements1 = createPaymentRequirements({
        amount: '1000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      const requirements2 = createPaymentRequirements({
        amount: '2000000',
        token: 'SOL',
        recipient: 'recipient123',
        scheme: 'private-exact',
        network: 'solana',
      });

      // Execute payments
      const payment1 = await clientScheme.createPayment(requirements1);
      const payment2 = await clientScheme.createPayment(requirements2);

      // Verify both
      const result1 = await serverScheme.verifyPayment(payment1, requirements1);
      const result2 = await serverScheme.verifyPayment(payment2, requirements2);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });
});

describe('Relayer Fee Support', () => {
  let provider: SolanaPrivacyProvider;
  let scheme: PrivateCashScheme;

  beforeEach(async () => {
    provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet: {
        publicKey: { toBase58: () => 'wallet123' },
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      } as any,
    });

    await provider.initialize();
    await provider.deposit({ amount: BigInt(20000000), token: 'SOL' });
  });

  it('should create payment with default relayer', async () => {
    scheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
      defaultRelayer: {
        url: 'https://relayer.example.com',
        fee: BigInt(100000), // 0.0001 SOL relayer fee
      },
    });

    const requirements = createPaymentRequirements({
      amount: '1000000',
      token: 'SOL',
      recipient: 'recipient123',
      scheme: 'private-exact',
      network: 'solana',
    });

    const payment = await scheme.createPayment(requirements);
    const payloadData = payment.payload as any;

    expect(payment.scheme).toBe('private-exact');
    expect(payloadData.amount).toBe('1000000');
    expect(payloadData.relayerFee).toBe('100000');
    expect(payloadData.relayerUrl).toBe('https://relayer.example.com');
  });

  it('should create payment with requirements-level relayer override', async () => {
    scheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
      defaultRelayer: {
        url: 'https://default-relayer.example.com',
        fee: BigInt(100000),
      },
    });

    const requirements = createPaymentRequirements({
      amount: '1000000',
      token: 'SOL',
      recipient: 'recipient123',
      scheme: 'private-exact',
      network: 'solana',
    });

    // Override relayer via extra field
    requirements.extra = {
      relayer: {
        url: 'https://custom-relayer.example.com',
        fee: '200000',
      },
    };

    const payment = await scheme.createPayment(requirements);
    const payloadData = payment.payload as any;

    expect(payloadData.relayerFee).toBe('200000');
    expect(payloadData.relayerUrl).toBe('https://custom-relayer.example.com');
  });

  it('should create payment without relayer', async () => {
    scheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
    });

    const requirements = createPaymentRequirements({
      amount: '1000000',
      token: 'SOL',
      recipient: 'recipient123',
      scheme: 'private-exact',
      network: 'solana',
    });

    const payment = await scheme.createPayment(requirements);
    const payloadData = payment.payload as any;

    expect(payloadData.amount).toBe('1000000');
    expect(payloadData.relayerFee).toBeUndefined();
    expect(payloadData.relayerUrl).toBeUndefined();
  });

  it('should set and get default relayer', () => {
    scheme = new PrivateCashScheme({
      provider,
      rpcUrl: 'https://api.devnet.solana.com',
    });

    expect(scheme.getDefaultRelayer()).toBeUndefined();

    scheme.setDefaultRelayer({
      url: 'https://relayer.example.com',
      fee: BigInt(50000),
    });

    const relayer = scheme.getDefaultRelayer();
    expect(relayer?.url).toBe('https://relayer.example.com');
    expect(relayer?.fee).toBe(BigInt(50000));

    scheme.setDefaultRelayer(undefined);
    expect(scheme.getDefaultRelayer()).toBeUndefined();
  });
});

describe('Transport Integration', () => {
  it('should check transport availability', () => {
    const provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet: {
        publicKey: { toBase58: () => 'wallet123' },
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      } as any,
    });

    // Client without transport
    const client = new Px402Client({
      provider,
      defaultMode: 'private',
    });

    expect(client.hasTransport()).toBe(false);
    expect(client.getTransport()).toBeUndefined();
  });

  it('should accept transport in config', async () => {
    const provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet: {
        publicKey: { toBase58: () => 'wallet123' },
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      } as any,
    });

    // Mock transport
    const mockTransport = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        body: '{"data": "test"}',
      }),
      isConnected: vi.fn().mockReturnValue(false),
    };

    const client = new Px402Client({
      provider,
      defaultMode: 'private',
      transport: mockTransport,
    });

    expect(client.hasTransport()).toBe(true);
    expect(client.getTransport()).toBe(mockTransport);
  });
});
