/**
 * @px402/core - Note management tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryNoteStorage,
  NoteManager,
  serializeNote,
  deserializeNote,
} from '../note.js';
import type { DepositNote } from '../types.js';

function createTestNote(overrides: Partial<DepositNote> = {}): DepositNote {
  return {
    chainId: 'solana',
    poolAddress: 'Pool111111111111111111111111111111111111111',
    commitment: '0x' + Math.random().toString(16).slice(2),
    nullifier: '0x' + Math.random().toString(16).slice(2),
    secret: '0x' + Math.random().toString(16).slice(2),
    leafIndex: Math.floor(Math.random() * 1000),
    amount: 1_000_000_000n,
    token: 'SOL',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('MemoryNoteStorage', () => {
  let storage: MemoryNoteStorage;

  beforeEach(() => {
    storage = new MemoryNoteStorage();
  });

  it('should save and get note', async () => {
    const note = createTestNote();
    await storage.save(note);

    const retrieved = await storage.get(note.commitment);
    expect(retrieved).toEqual(note);
  });

  it('should return undefined for unknown note', async () => {
    const retrieved = await storage.get('unknown');
    expect(retrieved).toBeUndefined();
  });

  it('should get all notes', async () => {
    const note1 = createTestNote();
    const note2 = createTestNote();

    await storage.save(note1);
    await storage.save(note2);

    const all = await storage.getAll();
    expect(all).toHaveLength(2);
  });

  it('should delete note', async () => {
    const note = createTestNote();
    await storage.save(note);
    await storage.delete(note.commitment);

    const retrieved = await storage.get(note.commitment);
    expect(retrieved).toBeUndefined();
  });

  it('should clear all notes', async () => {
    await storage.save(createTestNote());
    await storage.save(createTestNote());
    await storage.clear();

    const all = await storage.getAll();
    expect(all).toHaveLength(0);
  });
});

describe('NoteManager', () => {
  let manager: NoteManager;

  beforeEach(() => {
    manager = new NoteManager(new MemoryNoteStorage());
  });

  it('should save and get notes', async () => {
    const note = createTestNote();
    await manager.saveNote(note);

    const notes = await manager.getAllNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toEqual(note);
  });

  it('should get notes by chain', async () => {
    const solanaNote = createTestNote({ chainId: 'solana' });
    const ethNote = createTestNote({ chainId: 'ethereum' });

    await manager.saveNote(solanaNote);
    await manager.saveNote(ethNote);

    const solanaNotes = await manager.getNotesByChain('solana');
    expect(solanaNotes).toHaveLength(1);
    expect(solanaNotes[0].chainId).toBe('solana');
  });

  it('should get notes by token', async () => {
    const solNote = createTestNote({ token: 'SOL' });
    const usdcNote = createTestNote({ token: 'USDC' });

    await manager.saveNote(solNote);
    await manager.saveNote(usdcNote);

    const solNotes = await manager.getNotesByToken('SOL');
    expect(solNotes).toHaveLength(1);
    expect(solNotes[0].token).toBe('SOL');
  });

  it('should get notes with minimum amount', async () => {
    const smallNote = createTestNote({ token: 'SOL', amount: 100n });
    const largeNote = createTestNote({ token: 'SOL', amount: 1_000_000_000n });

    await manager.saveNote(smallNote);
    await manager.saveNote(largeNote);

    const notes = await manager.getNotesWithMinAmount('SOL', 1000n);
    expect(notes).toHaveLength(1);
    expect(notes[0].amount).toBe(1_000_000_000n);
  });

  it('should find best note for payment (smallest sufficient)', async () => {
    const small = createTestNote({ token: 'SOL', amount: 100_000_000n });
    const medium = createTestNote({ token: 'SOL', amount: 500_000_000n });
    const large = createTestNote({ token: 'SOL', amount: 1_000_000_000n });

    await manager.saveNote(small);
    await manager.saveNote(medium);
    await manager.saveNote(large);

    const best = await manager.findBestNoteForPayment('SOL', 200_000_000n);
    expect(best?.amount).toBe(500_000_000n);
  });

  it('should return undefined if no sufficient note', async () => {
    const note = createTestNote({ token: 'SOL', amount: 100n });
    await manager.saveNote(note);

    const best = await manager.findBestNoteForPayment('SOL', 1000n);
    expect(best).toBeUndefined();
  });

  it('should filter by chain when finding note', async () => {
    const solanaNote = createTestNote({
      chainId: 'solana',
      token: 'SOL',
      amount: 1_000_000_000n,
    });
    const ethNote = createTestNote({
      chainId: 'ethereum',
      token: 'SOL',
      amount: 2_000_000_000n,
    });

    await manager.saveNote(solanaNote);
    await manager.saveNote(ethNote);

    const best = await manager.findBestNoteForPayment('SOL', 100n, 'solana');
    expect(best?.chainId).toBe('solana');
  });

  it('should calculate balance', async () => {
    await manager.saveNote(createTestNote({ token: 'SOL', amount: 100n }));
    await manager.saveNote(createTestNote({ token: 'SOL', amount: 200n }));
    await manager.saveNote(createTestNote({ token: 'USDC', amount: 1000n }));

    const solBalance = await manager.getBalance('SOL');
    expect(solBalance).toBe(300n);

    const usdcBalance = await manager.getBalance('USDC');
    expect(usdcBalance).toBe(1000n);
  });

  it('should calculate balance by chain', async () => {
    await manager.saveNote(
      createTestNote({ chainId: 'solana', token: 'SOL', amount: 100n })
    );
    await manager.saveNote(
      createTestNote({ chainId: 'ethereum', token: 'SOL', amount: 200n })
    );

    const solanaBalance = await manager.getBalance('SOL', 'solana');
    expect(solanaBalance).toBe(100n);
  });

  it('should delete note', async () => {
    const note = createTestNote();
    await manager.saveNote(note);
    await manager.deleteNote(note.commitment);

    const notes = await manager.getAllNotes();
    expect(notes).toHaveLength(0);
  });

  it('should export notes as JSON', async () => {
    const note = createTestNote({ amount: 1234567890n });
    await manager.saveNote(note);

    const json = await manager.exportNotes();
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].amount).toBe('1234567890');
    expect(parsed[0].commitment).toBe(note.commitment);
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
        amount: '999999999999',
        token: 'SOL',
        timestamp: 12345,
      },
    ]);

    const count = await manager.importNotes(json);
    expect(count).toBe(1);

    const notes = await manager.getAllNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].amount).toBe(999999999999n);
  });
});

describe('Note serialization', () => {
  it('should serialize and deserialize note', () => {
    const note: DepositNote = {
      chainId: 'solana',
      poolAddress: 'PoolAddress123',
      commitment: '0xcommitment',
      nullifier: '0xnullifier',
      secret: '0xsecret',
      leafIndex: 42,
      amount: 1_000_000_000n,
      token: 'SOL',
      timestamp: 1234567890,
    };

    const serialized = serializeNote(note);
    const deserialized = deserializeNote(serialized);

    expect(deserialized.chainId).toBe(note.chainId);
    expect(deserialized.poolAddress).toBe(note.poolAddress);
    expect(deserialized.commitment).toBe(note.commitment);
    expect(deserialized.nullifier).toBe(note.nullifier);
    expect(deserialized.secret).toBe(note.secret);
    expect(deserialized.leafIndex).toBe(note.leafIndex);
    expect(deserialized.amount).toBe(note.amount);
    expect(deserialized.token).toBe(note.token);
    expect(deserialized.timestamp).toBe(note.timestamp);
  });

  it('should throw for invalid serialized note', () => {
    const invalid = Buffer.from('invalid:format').toString('base64');
    expect(() => deserializeNote(invalid)).toThrow('Invalid note format');
  });
});
