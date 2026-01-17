/**
 * @px402/client - Client Types
 */

import type { PrivacyProvider, X402Scheme, PaymentRequirements } from '@px402/core';

/**
 * Payment mode
 */
export type PaymentMode = 'public' | 'private';

/**
 * Transport response type
 */
export interface TransportResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Transport interface for custom HTTP routing (e.g., relay network)
 */
export interface Transport {
  /** Connect to transport layer */
  connect(): Promise<void>;
  /** Disconnect from transport layer */
  disconnect(): Promise<void>;
  /** Send request through transport */
  request(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<TransportResponse>;
  /** Check if connected */
  isConnected(): boolean;
}

/**
 * Px402 client configuration
 */
export interface Px402ClientConfig {
  /** Privacy provider instance */
  provider: PrivacyProvider;
  /** Payment schemes to use */
  schemes?: X402Scheme[];
  /** Default payment mode */
  defaultMode?: PaymentMode;
  /** Maximum retry attempts for payment */
  maxRetries?: number;
  /** Timeout for payment verification (ms) */
  paymentTimeout?: number;
  /** Custom transport (e.g., RelayTransport for anonymity) */
  transport?: Transport;
}

/**
 * Payment options for a request
 */
export interface PaymentOptions {
  /** Maximum amount willing to pay */
  maxAmount: string;
  /** Token to pay with */
  token: string;
  /** Override default payment mode */
  mode?: PaymentMode;
  /** Preferred scheme name */
  scheme?: string;
}

/**
 * Relay configuration for request
 */
export interface RelayOptions {
  /** Use relay network for this request */
  enabled: boolean;
  /** Number of relay hops (default: 3) */
  hops?: number;
  /** Maximum relay fee willing to pay */
  maxFee?: string;
}

/**
 * Extended RequestInit with payment options
 */
export interface Px402RequestInit extends RequestInit {
  /** Payment configuration */
  payment?: PaymentOptions;
  /** Relay configuration (requires transport in client config) */
  relay?: RelayOptions;
}

/**
 * Payment result information
 */
export interface PaymentResult {
  /** Whether payment was required */
  required: boolean;
  /** Whether payment was successful */
  success: boolean;
  /** Amount paid (if any) */
  amount?: string;
  /** Token used */
  token?: string;
  /** Transaction hash/proof */
  proof?: string;
  /** Payment mode used */
  mode?: PaymentMode;
}

/**
 * Response with payment metadata
 */
export interface Px402Response extends Response {
  /** Payment result information */
  paymentResult?: PaymentResult;
}

/**
 * x402 header names
 */
export const X402_HEADERS = {
  /** Payment payload header */
  PAYMENT: 'X-Payment',
  /** Payment requirements (in 402 response) */
  PAYMENT_REQUIREMENTS: 'X-Payment-Requirements',
  /** Payment version */
  VERSION: 'X-402-Version',
} as const;

/**
 * x402 protocol version
 */
export const X402_VERSION = 1;
