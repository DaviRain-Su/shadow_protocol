/**
 * @px402/core - Types tests
 */

import { describe, it, expect } from 'vitest';
import {
  Px402Error,
  Px402ErrorCode,
  type ChainId,
  type TokenId,
  type DepositNote,
  type PaymentProof,
  type StealthAddress,
} from '../types.js';

describe('ChainId type', () => {
  it('should accept valid chain ids', () => {
    const chains: ChainId[] = ['solana', 'ethereum', 'base', 'arbitrum', 'polygon'];
    expect(chains).toHaveLength(5);
  });
});

describe('TokenId type', () => {
  it('should accept string tokens', () => {
    const tokens: TokenId[] = [
      'SOL',
      'USDC',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ];
    expect(tokens.every((t) => typeof t === 'string')).toBe(true);
  });
});

describe('DepositNote interface', () => {
  it('should create valid deposit note', () => {
    const note: DepositNote = {
      chainId: 'solana',
      poolAddress: 'MockPool111111111111111111111111111111111111',
      commitment: '0x1234567890abcdef',
      nullifier: '0xabcdef1234567890',
      secret: '0xsecret12345',
      leafIndex: 42,
      amount: 1_000_000_000n,
      token: 'SOL',
      timestamp: Date.now(),
    };

    expect(note.chainId).toBe('solana');
    expect(note.amount).toBe(1_000_000_000n);
    expect(note.leafIndex).toBe(42);
  });

  it('should handle bigint amount correctly', () => {
    const note: DepositNote = {
      chainId: 'solana',
      poolAddress: 'Pool',
      commitment: '0x123',
      nullifier: '0x456',
      secret: '0x789',
      leafIndex: 0,
      amount: 9_999_999_999_999_999_999n,
      token: 'SOL',
      timestamp: 0,
    };

    expect(note.amount > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });
});

describe('PaymentProof interface', () => {
  it('should create valid payment proof', () => {
    const proof: PaymentProof = {
      chainId: 'solana',
      proofType: 'transfer',
      proof: 'signature123',
      metadata: {
        amount: 1_000_000n,
        token: 'SOL',
        timestamp: Date.now(),
      },
    };

    expect(proof.proofType).toBe('transfer');
    expect(proof.chainId).toBe('solana');
  });

  it('should support groth16 proof type', () => {
    const proof: PaymentProof = {
      chainId: 'ethereum',
      proofType: 'groth16',
      proof: '0xproof',
      publicInputs: ['0x1', '0x2', '0x3'],
      metadata: {
        amount: 100n,
        token: 'ETH',
        timestamp: Date.now(),
      },
    };

    expect(proof.proofType).toBe('groth16');
    expect(proof.publicInputs).toHaveLength(3);
  });
});

describe('StealthAddress interface', () => {
  it('should create valid stealth address', () => {
    const addr: StealthAddress = {
      address: 'SomeBase58Address',
      ephemeralPubKey: 'EphemeralPubKey',
      viewTag: 'abc123',
    };

    expect(addr.address).toBeDefined();
    expect(addr.ephemeralPubKey).toBeDefined();
  });

  it('should allow optional fields', () => {
    const addr: StealthAddress = {
      address: 'MinimalAddress',
    };

    expect(addr.ephemeralPubKey).toBeUndefined();
    expect(addr.viewTag).toBeUndefined();
  });
});

describe('Px402Error', () => {
  it('should create error with code', () => {
    const error = new Px402Error(
      Px402ErrorCode.INSUFFICIENT_BALANCE,
      'Not enough funds'
    );

    expect(error.code).toBe(Px402ErrorCode.INSUFFICIENT_BALANCE);
    expect(error.message).toBe('Not enough funds');
    expect(error.name).toBe('Px402Error');
  });

  it('should include cause', () => {
    const cause = new Error('Original error');
    const error = new Px402Error(
      Px402ErrorCode.NETWORK_ERROR,
      'Connection failed',
      cause
    );

    expect(error.cause).toBe(cause);
  });

  it('should have all error codes', () => {
    const codes = Object.values(Px402ErrorCode);
    expect(codes).toContain('INSUFFICIENT_BALANCE');
    expect(codes).toContain('INVALID_NOTE');
    expect(codes).toContain('NOTE_ALREADY_SPENT');
    expect(codes).toContain('INVALID_PROOF');
    expect(codes).toContain('RELAYER_ERROR');
    expect(codes).toContain('NETWORK_ERROR');
    expect(codes).toContain('UNSUPPORTED_TOKEN');
    expect(codes).toContain('UNSUPPORTED_CHAIN');
  });
});
