/**
 * @px402/server - Payment Verifier
 */

import type {
  X402Scheme,
  PaymentPayload,
  PaymentRequirements,
  VerificationResult,
} from '@px402/core';
import type { VerifierConfig } from './types.js';

/**
 * Payment Verifier
 * Verifies payment proofs against requirements
 */
export class PaymentVerifier {
  private schemes: Map<string, X402Scheme> = new Map();

  constructor(config: VerifierConfig) {
    for (const scheme of config.schemes) {
      this.registerScheme(scheme);
    }
  }

  /**
   * Register a payment scheme
   */
  registerScheme(scheme: X402Scheme): void {
    this.schemes.set(scheme.name, scheme);
  }

  /**
   * Get a registered scheme
   */
  getScheme(name: string): X402Scheme | undefined {
    return this.schemes.get(name);
  }

  /**
   * Get all registered scheme names
   */
  getSchemeNames(): string[] {
    return Array.from(this.schemes.keys());
  }

  /**
   * Verify payment from header string
   */
  async verify(
    paymentHeader: string,
    requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    // Parse payment payload
    const payload = this.parsePaymentHeader(paymentHeader);
    if (!payload) {
      return {
        valid: false,
        reason: 'Invalid payment header format',
      };
    }

    // Verify payload structure
    const structureValidation = this.validatePayloadStructure(payload);
    if (!structureValidation.valid) {
      return structureValidation;
    }

    // Get scheme
    const scheme = this.schemes.get(payload.scheme);
    if (!scheme) {
      return {
        valid: false,
        reason: `Unknown payment scheme: ${payload.scheme}`,
      };
    }

    // Verify scheme matches requirements
    if (payload.scheme !== requirements.scheme) {
      return {
        valid: false,
        reason: `Scheme mismatch: expected ${requirements.scheme}, got ${payload.scheme}`,
      };
    }

    // Verify network matches
    if (payload.network !== requirements.network) {
      return {
        valid: false,
        reason: `Network mismatch: expected ${requirements.network}, got ${payload.network}`,
      };
    }

    // Delegate to scheme for actual verification
    try {
      return await scheme.verifyPayment(payload, requirements);
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify payment payload directly
   */
  async verifyPayload(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    const scheme = this.schemes.get(payload.scheme);
    if (!scheme) {
      return {
        valid: false,
        reason: `Unknown payment scheme: ${payload.scheme}`,
      };
    }

    return scheme.verifyPayment(payload, requirements);
  }

  /**
   * Parse payment header string
   */
  private parsePaymentHeader(header: string): PaymentPayload | null {
    try {
      // Try JSON directly
      if (header.startsWith('{')) {
        return JSON.parse(header) as PaymentPayload;
      }

      // Try Base64
      const decoded = Buffer.from(header, 'base64').toString('utf-8');
      return JSON.parse(decoded) as PaymentPayload;
    } catch {
      return null;
    }
  }

  /**
   * Validate payment payload structure
   */
  private validatePayloadStructure(
    payload: PaymentPayload
  ): VerificationResult {
    if (!payload.x402Version) {
      return { valid: false, reason: 'Missing x402Version' };
    }

    if (!payload.scheme) {
      return { valid: false, reason: 'Missing scheme' };
    }

    if (!payload.network) {
      return { valid: false, reason: 'Missing network' };
    }

    if (!payload.payload || typeof payload.payload !== 'object') {
      return { valid: false, reason: 'Missing or invalid payload' };
    }

    return { valid: true };
  }
}

/**
 * Create a payment verifier instance
 */
export function createVerifier(config: VerifierConfig): PaymentVerifier {
  return new PaymentVerifier(config);
}
