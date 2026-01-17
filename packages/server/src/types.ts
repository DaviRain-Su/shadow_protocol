/**
 * @px402/server - Server Types
 */

import type {
  X402Scheme,
  PaymentRequirements,
  PaymentPayload,
  VerificationResult,
} from '@px402/core';

/**
 * Payment verifier configuration
 */
export interface VerifierConfig {
  /** Payment schemes to use for verification */
  schemes: X402Scheme[];
}

/**
 * Middleware configuration
 */
export interface Px402MiddlewareConfig {
  /** Payment schemes to use */
  schemes: X402Scheme[];
  /** Callback when payment is verified */
  onPaymentVerified?: (
    req: ExpressRequest,
    result: VerificationResult
  ) => void;
  /** Callback when payment fails */
  onPaymentFailed?: (
    req: ExpressRequest,
    error: Error
  ) => void;
}

/**
 * Options for requiring payment on a route
 */
export interface RequirePaymentOptions {
  /** Amount required (in smallest unit) */
  amount: string;
  /** Token to accept */
  token: string;
  /** Recipient address */
  recipient: string;
  /** Scheme name (default: 'private-exact') */
  scheme?: string;
  /** Network name (default: 'solana') */
  network?: string;
  /** Description of the payment */
  description?: string;
  /** Resource identifier */
  resource?: string;
}

/**
 * Express-like request interface
 */
export interface ExpressRequest {
  headers: Record<string, string | string[] | undefined>;
  path?: string;
  url?: string;
  method?: string;
  /** Payment result attached by middleware */
  paymentResult?: VerificationResult;
  /** Payment requirements for the route */
  paymentRequirements?: PaymentRequirements;
}

/**
 * Express-like response interface
 */
export interface ExpressResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): ExpressResponse;
  setHeader(name: string, value: string): ExpressResponse;
  set(name: string, value: string): ExpressResponse;
  send(body?: unknown): ExpressResponse;
}

/**
 * Express-like next function
 */
export type ExpressNextFunction = (error?: unknown) => void;

/**
 * Express-like request handler
 */
export type ExpressHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction
) => void | Promise<void>;

/**
 * x402 header names
 */
export const X402_HEADERS = {
  PAYMENT: 'x-payment',
  PAYMENT_REQUIREMENTS: 'x-payment-requirements',
  VERSION: 'x-402-version',
} as const;

/**
 * x402 protocol version
 */
export const X402_VERSION = 1;
