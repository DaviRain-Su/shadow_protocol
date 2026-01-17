/**
 * @px402/core - X402 Scheme Interface
 * Defines the payment scheme interface compatible with x402 protocol
 */

// ============ x402 Standard Types ============

/**
 * x402 PaymentRequirements
 * Server returns this to specify payment requirements
 */
export interface PaymentRequirements {
  /** x402 protocol version */
  x402Version: number;
  /** Payment scheme name (e.g., 'exact', 'private-exact') */
  scheme: string;
  /** Network identifier (e.g., 'solana', 'base') */
  network: string;
  /** Payment recipient address */
  payTo: string;
  /** Maximum amount required (string for precision) */
  maxAmountRequired: string;
  /** Asset identifier (token address or symbol) */
  asset: string;
  /** Resource identifier being paid for */
  resource?: string;
  /** Payment description */
  description?: string;
  /** Additional scheme-specific fields */
  extra?: Record<string, unknown>;
}

/**
 * x402 PaymentPayload
 * Client sends this as proof of payment
 */
export interface PaymentPayload {
  /** x402 protocol version */
  x402Version: number;
  /** Payment scheme name */
  scheme: string;
  /** Network identifier */
  network: string;
  /** Scheme-specific payload data */
  payload: Record<string, unknown>;
}

/**
 * Payment verification result
 */
export interface VerificationResult {
  /** Whether payment is valid */
  valid: boolean;
  /** Reason for invalid payment */
  reason?: string;
  /** Additional verification details */
  details?: Record<string, unknown>;
}

// ============ X402Scheme Interface ============

/**
 * x402 Scheme interface
 * Defines payment scheme creation and verification logic
 */
export interface X402Scheme {
  /** Scheme name (e.g., 'exact', 'private-exact') */
  readonly name: string;

  /** Supported networks for this scheme */
  readonly supportedNetworks: string[];

  /**
   * Create a payment for given requirements
   * @param requirements Payment requirements from server
   * @returns Payment payload to send to server
   */
  createPayment(requirements: PaymentRequirements): Promise<PaymentPayload>;

  /**
   * Verify a payment (server-side)
   * @param payload Payment payload from client
   * @param requirements Original payment requirements
   * @returns Verification result
   */
  verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult>;

  /**
   * Check if scheme supports a network
   * @param network Network identifier
   * @returns True if supported
   */
  supportsNetwork(network: string): boolean;

  /**
   * Check if scheme supports an asset
   * @param asset Asset identifier
   * @param network Network identifier
   * @returns True if supported
   */
  supportsAsset(asset: string, network: string): Promise<boolean>;
}

/**
 * Abstract base class for X402 schemes
 */
export abstract class BaseX402Scheme implements X402Scheme {
  abstract readonly name: string;
  abstract readonly supportedNetworks: string[];

  abstract createPayment(requirements: PaymentRequirements): Promise<PaymentPayload>;
  abstract verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult>;

  supportsNetwork(network: string): boolean {
    return this.supportedNetworks.includes(network);
  }

  async supportsAsset(_asset: string, _network: string): Promise<boolean> {
    // Default: all assets supported
    // Override in implementations for specific asset support
    return true;
  }

  /**
   * Validate payment requirements
   * @throws Error if requirements are invalid
   */
  protected validateRequirements(requirements: PaymentRequirements): void {
    if (requirements.scheme !== this.name) {
      throw new Error(
        `Scheme mismatch: expected ${this.name}, got ${requirements.scheme}`
      );
    }

    if (!this.supportsNetwork(requirements.network)) {
      throw new Error(
        `Network not supported: ${requirements.network}`
      );
    }

    if (!requirements.payTo) {
      throw new Error('payTo address is required');
    }

    if (!requirements.maxAmountRequired) {
      throw new Error('maxAmountRequired is required');
    }
  }

  /**
   * Create base payload structure
   */
  protected createBasePayload(
    requirements: PaymentRequirements,
    payload: Record<string, unknown>
  ): PaymentPayload {
    return {
      x402Version: requirements.x402Version,
      scheme: this.name,
      network: requirements.network,
      payload,
    };
  }
}

// ============ Scheme Registry ============

/**
 * Scheme registry for managing multiple payment schemes
 */
export class SchemeRegistry {
  private schemes: Map<string, X402Scheme> = new Map();

  /**
   * Register a scheme
   * @param scheme Scheme to register
   */
  register(scheme: X402Scheme): void {
    this.schemes.set(scheme.name, scheme);
  }

  /**
   * Get a scheme by name
   * @param name Scheme name
   * @returns Scheme or undefined
   */
  get(name: string): X402Scheme | undefined {
    return this.schemes.get(name);
  }

  /**
   * Get all registered scheme names
   */
  getNames(): string[] {
    return Array.from(this.schemes.keys());
  }

  /**
   * Find schemes supporting a network
   * @param network Network identifier
   */
  findByNetwork(network: string): X402Scheme[] {
    return Array.from(this.schemes.values()).filter(
      (s) => s.supportsNetwork(network)
    );
  }

  /**
   * Create payment using appropriate scheme
   * @param requirements Payment requirements
   */
  async createPayment(requirements: PaymentRequirements): Promise<PaymentPayload> {
    const scheme = this.get(requirements.scheme);
    if (!scheme) {
      throw new Error(`Unknown scheme: ${requirements.scheme}`);
    }
    return scheme.createPayment(requirements);
  }

  /**
   * Verify payment using appropriate scheme
   * @param payload Payment payload
   * @param requirements Payment requirements
   */
  async verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    const scheme = this.get(payload.scheme);
    if (!scheme) {
      return { valid: false, reason: `Unknown scheme: ${payload.scheme}` };
    }
    return scheme.verifyPayment(payload, requirements);
  }
}

// ============ Constants ============

/**
 * Standard x402 scheme names
 */
export const SCHEME_NAMES = {
  /** Standard exact payment (Coinbase x402) */
  EXACT: 'exact',
  /** Private exact payment (Px402) */
  PRIVATE_EXACT: 'private-exact',
} as const;

/**
 * Standard x402 version
 */
export const X402_VERSION = 1;
