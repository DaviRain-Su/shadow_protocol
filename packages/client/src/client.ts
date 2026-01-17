/**
 * @px402/client - Px402 Client
 * Main client class for automatic 402 payment handling
 */

import type {
  PrivacyProvider,
  X402Scheme,
  PaymentRequirements,
  PaymentPayload,
  SchemeRegistry,
} from '@px402/core';
import type {
  Px402ClientConfig,
  Px402RequestInit,
  PaymentOptions,
  PaymentResult,
  Px402Response,
  PaymentMode,
  Transport,
  TransportResponse,
} from './types.js';
import {
  parsePaymentRequirements,
  parsePaymentRequirementsFromBody,
  createPaymentHeader,
  is402Response,
  validatePaymentRequirements,
} from './http.js';
import { X402_HEADERS } from './types.js';

/**
 * Px402 Client
 * Automatically handles HTTP 402 Payment Required responses
 */
export class Px402Client {
  private provider: PrivacyProvider;
  private schemes: Map<string, X402Scheme> = new Map();
  private defaultMode: PaymentMode;
  private maxRetries: number;
  private paymentTimeout: number;
  private transport?: Transport;

  constructor(config: Px402ClientConfig) {
    this.provider = config.provider;
    this.defaultMode = config.defaultMode || 'private';
    this.maxRetries = config.maxRetries || 3;
    this.paymentTimeout = config.paymentTimeout || 30000;
    this.transport = config.transport;

    // Register provided schemes
    if (config.schemes) {
      for (const scheme of config.schemes) {
        this.registerScheme(scheme);
      }
    }
  }

  /**
   * Check if relay transport is available
   */
  hasTransport(): boolean {
    return !!this.transport;
  }

  /**
   * Get the transport (if available)
   */
  getTransport(): Transport | undefined {
    return this.transport;
  }

  /**
   * Register a payment scheme
   */
  registerScheme(scheme: X402Scheme): void {
    this.schemes.set(scheme.name, scheme);
  }

  /**
   * Get a registered scheme by name
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
   * Get current private balance for a token
   */
  async getBalance(token: string): Promise<bigint> {
    return this.provider.getPrivateBalance(token);
  }

  /**
   * Get the underlying privacy provider
   */
  getProvider(): PrivacyProvider {
    return this.provider;
  }

  /**
   * Fetch with automatic 402 payment handling
   */
  async fetch(url: string, init?: Px402RequestInit): Promise<Px402Response> {
    const paymentOptions = init?.payment;
    const useRelay = init?.relay?.enabled && this.transport;

    // Make initial request
    let response: Response;

    if (useRelay) {
      response = await this.fetchViaTransport(url, init);
    } else {
      response = await globalThis.fetch(url, init);
    }

    // Check if payment is required
    if (!is402Response(response)) {
      return this.createPx402Response(response, {
        required: false,
        success: true,
      });
    }

    // Payment required - check if we have payment options
    if (!paymentOptions) {
      // Return 402 response without attempting payment
      return this.createPx402Response(response, {
        required: true,
        success: false,
      });
    }

    // Parse payment requirements
    let requirements = parsePaymentRequirements(response);
    if (!requirements) {
      requirements = await parsePaymentRequirementsFromBody(response);
    }

    if (!requirements) {
      throw new Px402Error(
        'INVALID_402_RESPONSE',
        'Could not parse payment requirements from 402 response'
      );
    }

    // Validate requirements
    const validation = validatePaymentRequirements(requirements);
    if (!validation.valid) {
      throw new Px402Error('INVALID_REQUIREMENTS', validation.error!);
    }

    // Check if amount exceeds max
    if (BigInt(requirements.maxAmountRequired) > BigInt(paymentOptions.maxAmount)) {
      throw new Px402Error(
        'AMOUNT_EXCEEDS_MAX',
        `Required amount ${requirements.maxAmountRequired} exceeds max ${paymentOptions.maxAmount}`
      );
    }

    // Check token matches
    if (requirements.asset !== paymentOptions.token) {
      throw new Px402Error(
        'TOKEN_MISMATCH',
        `Required token ${requirements.asset} does not match ${paymentOptions.token}`
      );
    }

    // Execute payment and retry
    const paymentResult = await this.executePayment(
      requirements,
      paymentOptions
    );

    // Retry request with payment header
    const retryInit: Px402RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        [X402_HEADERS.PAYMENT]: createPaymentHeader(paymentResult.payload),
      },
    };

    if (useRelay) {
      response = await this.fetchViaTransport(url, retryInit);
    } else {
      response = await globalThis.fetch(url, retryInit);
    }

    // Check if payment was accepted
    if (is402Response(response)) {
      throw new Px402Error(
        'PAYMENT_REJECTED',
        'Payment was not accepted by server'
      );
    }

    return this.createPx402Response(response, {
      required: true,
      success: true,
      amount: requirements.maxAmountRequired,
      token: requirements.asset,
      proof: paymentResult.payload.payload.signature as string,
      mode: paymentOptions.mode || this.defaultMode,
    });
  }

  /**
   * Execute payment for requirements
   */
  private async executePayment(
    requirements: PaymentRequirements,
    options: PaymentOptions
  ): Promise<{ payload: PaymentPayload }> {
    // Find appropriate scheme
    const schemeName = options.scheme || requirements.scheme;
    const scheme = this.schemes.get(schemeName);

    if (!scheme) {
      throw new Px402Error(
        'SCHEME_NOT_FOUND',
        `Payment scheme '${schemeName}' not registered`
      );
    }

    // Check scheme supports network
    if (!scheme.supportsNetwork(requirements.network)) {
      throw new Px402Error(
        'NETWORK_NOT_SUPPORTED',
        `Scheme '${schemeName}' does not support network '${requirements.network}'`
      );
    }

    // Create payment
    const payload = await scheme.createPayment(requirements);

    return { payload };
  }

  /**
   * Create Px402Response with payment metadata
   */
  private createPx402Response(
    response: Response,
    paymentResult: PaymentResult
  ): Px402Response {
    const px402Response = response as Px402Response;
    px402Response.paymentResult = paymentResult;
    return px402Response;
  }

  /**
   * Fetch via transport (relay network)
   */
  private async fetchViaTransport(
    url: string,
    init?: Px402RequestInit
  ): Promise<Response> {
    if (!this.transport) {
      throw new Px402Error('TRANSPORT_NOT_AVAILABLE', 'No transport configured');
    }

    // Ensure connected
    if (!this.transport.isConnected()) {
      await this.transport.connect();
    }

    // Convert RequestInit to transport format
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          headers[key] = value;
        }
      } else {
        Object.assign(headers, init.headers);
      }
    }

    // Make request via transport
    const transportResponse = await this.transport.request(url, {
      method: init?.method,
      headers,
      body: init?.body as string | undefined,
    });

    // Convert transport response to Response
    return this.transportResponseToResponse(transportResponse);
  }

  /**
   * Convert transport response to standard Response
   */
  private transportResponseToResponse(tr: TransportResponse): Response {
    const headers = new Headers(tr.headers);
    return new Response(tr.body, {
      status: tr.status,
      headers,
    });
  }
}

/**
 * Px402 Client Error
 */
export class Px402Error extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'Px402Error';
  }
}

/**
 * Create a Px402 client instance
 */
export function createPx402Client(config: Px402ClientConfig): Px402Client {
  return new Px402Client(config);
}
