/**
 * @px402/client - Px402 Client SDK
 *
 * Provides automatic HTTP 402 payment handling for AI agents.
 *
 * @example
 * ```typescript
 * import { Px402Client } from '@px402/client';
 * import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';
 *
 * const provider = new SolanaPrivacyProvider({ rpcUrl, wallet });
 * await provider.initialize();
 *
 * const client = new Px402Client({
 *   provider,
 *   schemes: [new PrivateCashScheme({ provider, rpcUrl })],
 *   defaultMode: 'private',
 * });
 *
 * const response = await client.fetch('https://api.example.com/data', {
 *   payment: { maxAmount: '1000000', token: 'SOL' },
 * });
 * ```
 */

// Client
export { Px402Client, Px402Error, createPx402Client } from './client.js';

// Types
export type {
  Px402ClientConfig,
  Px402RequestInit,
  PaymentOptions,
  PaymentResult,
  Px402Response,
  PaymentMode,
} from './types.js';
export { X402_HEADERS, X402_VERSION } from './types.js';

// HTTP utilities
export {
  parsePaymentRequirements,
  parsePaymentRequirementsFromBody,
  createPaymentHeader,
  createPaymentHeaderBase64,
  parsePaymentHeader,
  is402Response,
  create402Headers,
  validatePaymentRequirements,
} from './http.js';
