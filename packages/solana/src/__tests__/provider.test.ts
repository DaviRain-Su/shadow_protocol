/**
 * @px402/solana - SolanaPrivacyProvider tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { SolanaPrivacyProvider, createSolanaProvider } from '../provider.js';
import type { DepositNote } from '@px402/core';

describe('SolanaPrivacyProvider', () => {
  let provider: SolanaPrivacyProvider;
  let wallet: Keypair;

  beforeEach(() => {
    wallet = Keypair.generate();
    provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet,
      network: 'devnet',
    });
  });

  it('should have correct chainId', () => {
    expect(provider.chainId).toBe('solana');
  });

  it('should require initialization', async () => {
    // Methods should throw before initialization
    await expect(provider.getPrivateBalance('SOL')).rejects.toThrow(
      'not initialized'
    );
  });

  it('should generate stealth address', async () => {
    const stealthAddr = await provider.generateStealthAddress();

    expect(stealthAddr.address).toBeDefined();
    expect(stealthAddr.address.length).toBeGreaterThan(20);
    expect(stealthAddr.ephemeralPubKey).toBeDefined();
  });

  it('should generate unique stealth addresses', async () => {
    const addr1 = await provider.generateStealthAddress();
    const addr2 = await provider.generateStealthAddress();

    expect(addr1.address).not.toBe(addr2.address);
  });
});

describe('SolanaPrivacyProvider note management', () => {
  let provider: SolanaPrivacyProvider;

  beforeEach(() => {
    const wallet = Keypair.generate();
    provider = new SolanaPrivacyProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet,
    });
  });

  function createTestNote(overrides: Partial<DepositNote> = {}): DepositNote {
    return {
      chainId: 'solana',
      poolAddress: 'Pool123',
      commitment: '0x' + Math.random().toString(16).slice(2),
      nullifier: '0x' + Math.random().toString(16).slice(2),
      secret: '0xsecret',
      leafIndex: 1,
      amount: 1_000_000_000n,
      token: 'SOL',
      timestamp: Date.now(),
      ...overrides,
    };
  }

  it('should save and get notes', async () => {
    const note = createTestNote();
    await provider.saveNote(note);

    const notes = await provider.getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].commitment).toBe(note.commitment);
  });

  it('should get unspent notes', async () => {
    const note = createTestNote();
    await provider.saveNote(note);

    const unspent = await provider.getUnspentNotes();
    expect(unspent).toHaveLength(1);
  });

  it('should delete notes', async () => {
    const note = createTestNote();
    await provider.saveNote(note);
    await provider.deleteNote(note.commitment);

    const notes = await provider.getNotes();
    expect(notes).toHaveLength(0);
  });

  it('should find note for payment', async () => {
    const smallNote = createTestNote({ token: 'SOL', amount: 100n });
    const largeNote = createTestNote({ token: 'SOL', amount: 1_000_000_000n });

    await provider.saveNote(smallNote);
    await provider.saveNote(largeNote);

    const found = await provider.findNoteForPayment('SOL', 500n);
    expect(found?.amount).toBe(1_000_000_000n);
  });

  it('should return undefined if no sufficient note', async () => {
    const note = createTestNote({ amount: 100n });
    await provider.saveNote(note);

    const found = await provider.findNoteForPayment('SOL', 1000n);
    expect(found).toBeUndefined();
  });

  it('should check if note is spent (unknown)', async () => {
    const isSpent = await provider.isNoteSpent('unknown');
    expect(isSpent).toBe(true); // Unknown note considered spent
  });

  it('should export notes as JSON', async () => {
    const note = createTestNote({ amount: 123456789n });
    await provider.saveNote(note);

    const json = await provider.exportNotes();
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].amount).toBe('123456789');
  });

  it('should import notes from JSON', async () => {
    const json = JSON.stringify([
      {
        chainId: 'solana',
        poolAddress: 'Pool',
        commitment: '0x123',
        nullifier: '0x456',
        secret: '0x789',
        leafIndex: 1,
        amount: '999000000',
        token: 'SOL',
        timestamp: 12345,
      },
    ]);

    const count = await provider.importNotes(json);
    expect(count).toBe(1);

    const notes = await provider.getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].amount).toBe(999000000n);
  });
});

describe('createSolanaProvider factory', () => {
  it('should create provider instance', () => {
    const wallet = Keypair.generate();
    const provider = createSolanaProvider({
      rpcUrl: 'https://api.devnet.solana.com',
      wallet,
    });

    expect(provider).toBeInstanceOf(SolanaPrivacyProvider);
    expect(provider.chainId).toBe('solana');
  });
});
