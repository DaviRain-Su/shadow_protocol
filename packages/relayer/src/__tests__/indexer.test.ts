/**
 * @px402/relayer - Indexer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IndexerMerkleTree, IndexerNullifierRegistry } from '../indexer.js';

describe('IndexerMerkleTree', () => {
  let tree: IndexerMerkleTree;

  beforeEach(() => {
    tree = new IndexerMerkleTree(4); // Small tree for testing
  });

  describe('insert', () => {
    it('should insert leaves and return index', () => {
      const index0 = tree.insert('commitment1');
      const index1 = tree.insert('commitment2');

      expect(index0).toBe(0);
      expect(index1).toBe(1);
      expect(tree.getLeafCount()).toBe(2);
    });
  });

  describe('getRoot', () => {
    it('should return zero root for empty tree', () => {
      const root = tree.getRoot();
      expect(root).toBeTruthy();
      expect(root.length).toBeGreaterThan(0);
    });

    it('should change root after insert', () => {
      const rootBefore = tree.getRoot();
      tree.insert('commitment1');
      const rootAfter = tree.getRoot();

      expect(rootBefore).not.toBe(rootAfter);
    });
  });

  describe('getLeaves', () => {
    it('should return all inserted leaves', () => {
      tree.insert('a');
      tree.insert('b');
      tree.insert('c');

      const leaves = tree.getLeaves();
      expect(leaves).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getMerkleProof', () => {
    it('should return valid proof for leaf', () => {
      tree.insert('a');
      tree.insert('b');
      tree.insert('c');

      const proof = tree.getMerkleProof(1);
      expect(proof.path.length).toBeGreaterThan(0);
      expect(proof.indices.length).toBe(proof.path.length);
    });
  });

  describe('exportState/importState', () => {
    it('should export and import state correctly', () => {
      tree.insert('a');
      tree.insert('b');
      const rootBefore = tree.getRoot();

      const state = tree.exportState();
      expect(state.leaves).toEqual(['a', 'b']);
      expect(state.nextIndex).toBe(2);

      const newTree = new IndexerMerkleTree(4);
      newTree.importState(state);

      expect(newTree.getRoot()).toBe(rootBefore);
      expect(newTree.getLeaves()).toEqual(['a', 'b']);
    });
  });

  describe('root history', () => {
    it('should track root history after inserts', () => {
      const emptyRoot = tree.getRoot();
      expect(tree.isKnownRoot(emptyRoot)).toBe(true);

      tree.insert('a');
      const rootAfterA = tree.getRoot();
      expect(tree.isKnownRoot(rootAfterA)).toBe(true);
      expect(tree.isKnownRoot(emptyRoot)).toBe(true);

      tree.insert('b');
      const rootAfterB = tree.getRoot();
      expect(tree.isKnownRoot(rootAfterB)).toBe(true);
      expect(tree.isKnownRoot(rootAfterA)).toBe(true);
      expect(tree.isKnownRoot(emptyRoot)).toBe(true);
    });

    it('should return false for unknown root', () => {
      expect(tree.isKnownRoot('unknown_root_12345')).toBe(false);
    });

    it('should include root history in export', () => {
      tree.insert('a');
      tree.insert('b');

      const state = tree.exportState();
      expect(state.rootHistory.length).toBeGreaterThan(0);
      expect(state.rootHistory).toContain(tree.getRoot());
    });

    it('should restore root history on import', () => {
      tree.insert('a');
      const rootA = tree.getRoot();
      tree.insert('b');
      const rootB = tree.getRoot();

      const state = tree.exportState();

      const newTree = new IndexerMerkleTree(4);
      newTree.importState(state);

      expect(newTree.isKnownRoot(rootA)).toBe(true);
      expect(newTree.isKnownRoot(rootB)).toBe(true);
    });

    it('should return root history array', () => {
      tree.insert('a');
      tree.insert('b');
      tree.insert('c');

      const history = tree.getRootHistory();
      expect(history.length).toBeGreaterThanOrEqual(4); // empty + 3 inserts
    });
  });
});

describe('IndexerNullifierRegistry', () => {
  let registry: IndexerNullifierRegistry;

  beforeEach(() => {
    registry = new IndexerNullifierRegistry();
  });

  describe('register', () => {
    it('should register new nullifier', () => {
      const result = registry.register('nullifier1', 'tx1');
      expect(result).toBe(true);
      expect(registry.isUsed('nullifier1')).toBe(true);
    });

    it('should reject duplicate nullifier', () => {
      registry.register('nullifier1', 'tx1');
      const result = registry.register('nullifier1', 'tx2');
      expect(result).toBe(false);
    });
  });

  describe('isUsed', () => {
    it('should return false for unused nullifier', () => {
      expect(registry.isUsed('unknown')).toBe(false);
    });

    it('should return true for used nullifier', () => {
      registry.register('nullifier1', 'tx1');
      expect(registry.isUsed('nullifier1')).toBe(true);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction for nullifier', () => {
      registry.register('nullifier1', 'signature123');
      expect(registry.getTransaction('nullifier1')).toBe('signature123');
    });

    it('should return undefined for unknown nullifier', () => {
      expect(registry.getTransaction('unknown')).toBeUndefined();
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(registry.getCount()).toBe(0);
      registry.register('n1', 'tx1');
      expect(registry.getCount()).toBe(1);
      registry.register('n2', 'tx2');
      expect(registry.getCount()).toBe(2);
    });
  });

  describe('exportState/importState', () => {
    it('should export and import state correctly', () => {
      registry.register('n1', 'tx1');
      registry.register('n2', 'tx2');

      const state = registry.exportState();
      expect(state.used.has('n1')).toBe(true);
      expect(state.used.has('n2')).toBe(true);

      const newRegistry = new IndexerNullifierRegistry();
      newRegistry.importState(state);

      expect(newRegistry.isUsed('n1')).toBe(true);
      expect(newRegistry.isUsed('n2')).toBe(true);
      expect(newRegistry.getCount()).toBe(2);
    });
  });
});
