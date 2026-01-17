/**
 * @px402/relay - Incentive tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  IncentiveManager,
  createIncentiveManager,
  formatFee,
  parseFee,
} from '../incentive.js';
import type { RelayMessage } from '../types.js';
import { RELAY_VERSION } from '../types.js';

describe('IncentiveManager', () => {
  let manager: IncentiveManager;

  beforeEach(() => {
    manager = new IncentiveManager({
      minFee: '1000',
      feeToken: 'SOL',
      feePerKB: '500',
    });
  });

  describe('getFeeConfig', () => {
    it('should return fee configuration', () => {
      const config = manager.getFeeConfig();
      expect(config.minFee).toBe('1000');
      expect(config.feeToken).toBe('SOL');
      expect(config.feePerKB).toBe('500');
    });
  });

  describe('calculateFee', () => {
    it('should calculate base fee for small message', () => {
      const fee = manager.calculateFee(100);
      expect(fee).toBe('1500'); // 1000 + 500 * 1 KB
    });

    it('should add per-KB fee for larger messages', () => {
      const fee = manager.calculateFee(3072); // 3 KB
      expect(fee).toBe('2500'); // 1000 + 500 * 3
    });
  });

  describe('validateFee', () => {
    it('should accept sufficient fee', () => {
      const message: RelayMessage = {
        id: 'test',
        type: 'request',
        version: RELAY_VERSION,
        timestamp: Date.now(),
        encryptedPayload: '',
        ephemeralKey: '',
        ttl: 5,
        fee: '2000',
        feeToken: 'SOL',
      };

      expect(manager.validateFee(message, 1024)).toBe(true);
    });

    it('should reject insufficient fee', () => {
      const message: RelayMessage = {
        id: 'test',
        type: 'request',
        version: RELAY_VERSION,
        timestamp: Date.now(),
        encryptedPayload: '',
        ephemeralKey: '',
        ttl: 5,
        fee: '500',
        feeToken: 'SOL',
      };

      expect(manager.validateFee(message, 1024)).toBe(false);
    });

    it('should reject wrong token', () => {
      const message: RelayMessage = {
        id: 'test',
        type: 'request',
        version: RELAY_VERSION,
        timestamp: Date.now(),
        encryptedPayload: '',
        ephemeralKey: '',
        ttl: 5,
        fee: '5000',
        feeToken: 'USDC',
      };

      expect(manager.validateFee(message)).toBe(false);
    });
  });

  describe('registerPayment', () => {
    it('should register pending payment', () => {
      const payment = manager.registerPayment('msg1', 'payer1', '1000', 'SOL');

      expect(payment.messageId).toBe('msg1');
      expect(payment.status).toBe('pending');
      expect(manager.getPendingPayment('msg1')).toBeDefined();
    });

    it('should throw when too many pending', () => {
      const smallManager = new IncentiveManager({
        minFee: '1000',
        feeToken: 'SOL',
        maxPendingPayments: 2,
      });

      smallManager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      smallManager.registerPayment('msg2', 'payer2', '1000', 'SOL');

      expect(() =>
        smallManager.registerPayment('msg3', 'payer3', '1000', 'SOL')
      ).toThrow('Too many pending payments');
    });
  });

  describe('verifyPayment', () => {
    it('should verify and record payment', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      const verified = manager.verifyPayment('msg1');

      expect(verified).toBe(true);
      expect(manager.getPendingPayment('msg1')).toBeUndefined();

      const summary = manager.getEarningsSummary();
      expect(summary.messagesRelayed).toBe(1);
      expect(summary.byToken['SOL']).toBe('1000');
    });

    it('should return false for unknown message', () => {
      expect(manager.verifyPayment('unknown')).toBe(false);
    });
  });

  describe('failPayment', () => {
    it('should mark payment as failed', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      const failed = manager.failPayment('msg1');

      expect(failed).toBe(true);
      expect(manager.getPendingPayment('msg1')).toBeUndefined();

      const summary = manager.getEarningsSummary();
      expect(summary.failedCount).toBe(1);
    });
  });

  describe('getEarningsSummary', () => {
    it('should return earnings summary', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      manager.verifyPayment('msg1');
      manager.registerPayment('msg2', 'payer2', '2000', 'SOL');
      manager.verifyPayment('msg2');

      const summary = manager.getEarningsSummary();

      expect(summary.byToken['SOL']).toBe('3000');
      expect(summary.messagesRelayed).toBe(2);
    });
  });

  describe('getTotalEarnings', () => {
    it('should return total for token', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      manager.verifyPayment('msg1');

      expect(manager.getTotalEarnings('SOL')).toBe('1000');
      expect(manager.getTotalEarnings('USDC')).toBe('0');
    });
  });

  describe('getRecentRecords', () => {
    it('should return recent records', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      manager.verifyPayment('msg1');
      manager.registerPayment('msg2', 'payer2', '2000', 'SOL');
      manager.failPayment('msg2');

      const records = manager.getRecentRecords();

      expect(records.length).toBe(2);
      expect(records[0].verified).toBe(true);
      expect(records[1].verified).toBe(false);
    });
  });

  describe('cleanupExpiredPayments', () => {
    it('should clean up expired payments', async () => {
      const quickManager = new IncentiveManager({
        minFee: '1000',
        feeToken: 'SOL',
        verificationTimeout: 50,
      });

      quickManager.registerPayment('msg1', 'payer1', '1000', 'SOL');

      await new Promise((r) => setTimeout(r, 100));
      const cleaned = quickManager.cleanupExpiredPayments();

      expect(cleaned).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      manager.verifyPayment('msg1');

      manager.reset();

      const summary = manager.getEarningsSummary();
      expect(summary.messagesRelayed).toBe(0);
      expect(summary.pendingCount).toBe(0);
    });
  });

  describe('exportData', () => {
    it('should export data', () => {
      manager.registerPayment('msg1', 'payer1', '1000', 'SOL');
      manager.verifyPayment('msg1');

      const data = manager.exportData();

      expect(data.records.length).toBe(1);
      expect(data.summary.messagesRelayed).toBe(1);
    });
  });
});

describe('createIncentiveManager', () => {
  it('should create manager instance', () => {
    const manager = createIncentiveManager({
      minFee: '1000',
      feeToken: 'SOL',
    });
    expect(manager).toBeInstanceOf(IncentiveManager);
  });
});

describe('formatFee', () => {
  it('should format whole numbers', () => {
    expect(formatFee('1000000000', 'SOL')).toBe('1 SOL');
  });

  it('should format fractional amounts', () => {
    expect(formatFee('1500000000', 'SOL')).toBe('1.5 SOL');
  });

  it('should handle small amounts', () => {
    expect(formatFee('1000', 'SOL')).toBe('0.000001 SOL');
  });
});

describe('parseFee', () => {
  it('should parse whole numbers', () => {
    const result = parseFee('1 SOL');
    expect(result.amount).toBe('1000000000');
    expect(result.token).toBe('SOL');
  });

  it('should parse fractional amounts', () => {
    const result = parseFee('0.5 SOL');
    expect(result.amount).toBe('500000000');
  });

  it('should throw for invalid format', () => {
    expect(() => parseFee('invalid')).toThrow('Invalid fee format');
  });
});
