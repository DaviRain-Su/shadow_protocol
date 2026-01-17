/**
 * @px402/relay - Incentive Mechanism
 *
 * Handles fee calculation, payment verification, and earnings tracking
 */

import type { FeeConfig, IncentiveRecord, RelayMessage } from './types.js';

/**
 * Incentive manager configuration
 */
export interface IncentiveConfig {
  /** Minimum fee per relay */
  minFee: string;

  /** Fee token */
  feeToken: string;

  /** Fee per KB (optional) */
  feePerKB?: string;

  /** Maximum pending payments */
  maxPendingPayments?: number;

  /** Payment verification timeout (ms) */
  verificationTimeout?: number;
}

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'expired';

/**
 * Pending payment
 */
export interface PendingPayment {
  /** Message ID */
  messageId: string;

  /** Payer node ID */
  payer: string;

  /** Amount */
  amount: string;

  /** Token */
  token: string;

  /** Payment proof/signature */
  proof?: string;

  /** Status */
  status: PaymentStatus;

  /** Created timestamp */
  createdAt: number;

  /** Verification timeout */
  expiresAt: number;
}

/**
 * Earnings summary
 */
export interface EarningsSummary {
  /** Total earned (by token) */
  byToken: Record<string, string>;

  /** Total messages relayed */
  messagesRelayed: number;

  /** Pending payments count */
  pendingCount: number;

  /** Failed payments count */
  failedCount: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  maxPendingPayments: 100,
  verificationTimeout: 60000, // 1 minute
};

/**
 * Manages relay incentives
 */
export class IncentiveManager {
  private config: IncentiveConfig & typeof DEFAULT_CONFIG;
  private pendingPayments: Map<string, PendingPayment> = new Map();
  private records: IncentiveRecord[] = [];
  private earnings: Map<string, bigint> = new Map();
  private messagesRelayed: number = 0;
  private failedCount: number = 0;

  constructor(config: IncentiveConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Get fee configuration
   */
  getFeeConfig(): FeeConfig {
    return {
      minFee: this.config.minFee,
      feeToken: this.config.feeToken,
      feePerKB: this.config.feePerKB,
    };
  }

  /**
   * Calculate fee for a message
   */
  calculateFee(messageSize: number): string {
    let fee = BigInt(this.config.minFee);

    // Add per-KB fee if configured
    if (this.config.feePerKB) {
      const kbFee = BigInt(this.config.feePerKB);
      const kbs = Math.ceil(messageSize / 1024);
      fee += kbFee * BigInt(kbs);
    }

    return fee.toString();
  }

  /**
   * Validate message fee
   */
  validateFee(message: RelayMessage, messageSize?: number): boolean {
    const requiredFee = this.calculateFee(messageSize ?? 0);
    const providedFee = BigInt(message.fee);
    const required = BigInt(requiredFee);

    return providedFee >= required && message.feeToken === this.config.feeToken;
  }

  /**
   * Register pending payment for a relayed message
   */
  registerPayment(
    messageId: string,
    payer: string,
    amount: string,
    token: string,
    proof?: string
  ): PendingPayment {
    // Check if we have too many pending payments
    if (this.pendingPayments.size >= this.config.maxPendingPayments) {
      this.cleanupExpiredPayments();

      if (this.pendingPayments.size >= this.config.maxPendingPayments) {
        throw new Error('Too many pending payments');
      }
    }

    const now = Date.now();
    const payment: PendingPayment = {
      messageId,
      payer,
      amount,
      token,
      proof,
      status: 'pending',
      createdAt: now,
      expiresAt: now + this.config.verificationTimeout,
    };

    this.pendingPayments.set(messageId, payment);
    return payment;
  }

  /**
   * Mark payment as verified
   */
  verifyPayment(messageId: string): boolean {
    const payment = this.pendingPayments.get(messageId);
    if (!payment) {
      return false;
    }

    if (payment.status !== 'pending') {
      return payment.status === 'verified';
    }

    // Check expiry
    if (Date.now() > payment.expiresAt) {
      payment.status = 'expired';
      return false;
    }

    payment.status = 'verified';
    this.messagesRelayed++;

    // Add to earnings
    const current = this.earnings.get(payment.token) ?? 0n;
    this.earnings.set(payment.token, current + BigInt(payment.amount));

    // Record
    this.records.push({
      messageId: payment.messageId,
      payer: payment.payer,
      amount: payment.amount,
      token: payment.token,
      timestamp: Date.now(),
      verified: true,
    });

    // Remove from pending
    this.pendingPayments.delete(messageId);

    return true;
  }

  /**
   * Mark payment as failed
   */
  failPayment(messageId: string, reason?: string): boolean {
    const payment = this.pendingPayments.get(messageId);
    if (!payment) {
      return false;
    }

    payment.status = 'failed';
    this.failedCount++;

    // Record
    this.records.push({
      messageId: payment.messageId,
      payer: payment.payer,
      amount: payment.amount,
      token: payment.token,
      timestamp: Date.now(),
      verified: false,
    });

    this.pendingPayments.delete(messageId);
    return true;
  }

  /**
   * Get pending payment
   */
  getPendingPayment(messageId: string): PendingPayment | undefined {
    return this.pendingPayments.get(messageId);
  }

  /**
   * Get all pending payments
   */
  getAllPendingPayments(): PendingPayment[] {
    return Array.from(this.pendingPayments.values());
  }

  /**
   * Get earnings summary
   */
  getEarningsSummary(): EarningsSummary {
    const byToken: Record<string, string> = {};
    for (const [token, amount] of this.earnings) {
      byToken[token] = amount.toString();
    }

    return {
      byToken,
      messagesRelayed: this.messagesRelayed,
      pendingCount: this.pendingPayments.size,
      failedCount: this.failedCount,
    };
  }

  /**
   * Get total earnings for a token
   */
  getTotalEarnings(token: string): string {
    return (this.earnings.get(token) ?? 0n).toString();
  }

  /**
   * Get recent records
   */
  getRecentRecords(count: number = 100): IncentiveRecord[] {
    return this.records.slice(-count);
  }

  /**
   * Clean up expired pending payments
   */
  cleanupExpiredPayments(): number {
    const now = Date.now();
    let count = 0;

    for (const [id, payment] of this.pendingPayments) {
      if (now > payment.expiresAt && payment.status === 'pending') {
        payment.status = 'expired';
        this.pendingPayments.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Reset statistics (for testing)
   */
  reset(): void {
    this.pendingPayments.clear();
    this.records = [];
    this.earnings.clear();
    this.messagesRelayed = 0;
    this.failedCount = 0;
  }

  /**
   * Export earnings data
   */
  exportData(): {
    records: IncentiveRecord[];
    summary: EarningsSummary;
  } {
    return {
      records: [...this.records],
      summary: this.getEarningsSummary(),
    };
  }
}

/**
 * Create incentive manager
 */
export function createIncentiveManager(
  config: IncentiveConfig
): IncentiveManager {
  return new IncentiveManager(config);
}

/**
 * Format fee for display
 */
export function formatFee(amount: string, token: string, decimals: number = 9): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (fraction === 0n) {
    return `${whole} ${token}`;
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.replace(/0+$/, '');
  return `${whole}.${trimmed} ${token}`;
}

/**
 * Parse fee from display format
 */
export function parseFee(formatted: string, decimals: number = 9): { amount: string; token: string } {
  const parts = formatted.trim().split(' ');
  if (parts.length !== 2) {
    throw new Error(`Invalid fee format: ${formatted}`);
  }

  const [valueStr, token] = parts;
  const [whole, fraction = ''] = valueStr.split('.');

  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const amount = BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);

  return {
    amount: amount.toString(),
    token,
  };
}
