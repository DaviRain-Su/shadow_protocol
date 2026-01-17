/**
 * @px402/server - Px402 Server SDK
 *
 * Provides Express middleware for handling x402 payments.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { px402Middleware, requirePayment } from '@px402/server';
 * import { PrivateCashScheme } from '@px402/solana';
 *
 * const app = express();
 *
 * // Configure schemes
 * const scheme = new PrivateCashScheme({ provider, rpcUrl });
 *
 * // Global middleware (optional)
 * app.use(px402Middleware({ schemes: [scheme] }));
 *
 * // Free endpoint
 * app.get('/free', (req, res) => {
 *   res.json({ message: 'Free content' });
 * });
 *
 * // Paid endpoint
 * app.get('/premium', requirePayment({
 *   amount: '10000000', // 0.01 SOL
 *   token: 'SOL',
 *   recipient: process.env.WALLET_ADDRESS!,
 * }), (req, res) => {
 *   res.json({ message: 'Premium content!' });
 * });
 * ```
 */

// Verifier
export { PaymentVerifier, createVerifier } from './verifier.js';

// Middleware
export {
  px402Middleware,
  requirePayment,
  createRequirePayment,
  send402Response,
  createPaymentRequirements,
} from './middleware.js';

// Nullifier Registry
export {
  MemoryNullifierRegistry,
  PersistentNullifierRegistry,
  createNullifierRegistry,
  createPersistentNullifierRegistry,
  getGlobalNullifierRegistry,
  setGlobalNullifierRegistry,
} from './nullifier.js';

export type {
  NullifierInfo,
  NullifierRegistry,
  NullifierRegistryConfig,
  PersistentNullifierRegistryConfig,
} from './nullifier.js';

// Storage Adapters
export {
  MemoryStorage,
  FileStorage,
  createStorage,
} from './storage.js';

export type {
  StorageAdapter,
  StorageType,
  FileStorageConfig,
} from './storage.js';

// Types
export type {
  VerifierConfig,
  Px402MiddlewareConfig,
  RequirePaymentOptions,
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  ExpressHandler,
} from './types.js';
export { X402_HEADERS, X402_VERSION } from './types.js';
