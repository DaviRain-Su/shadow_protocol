/**
 * @px402/server - Express Middleware
 */

import type { PaymentRequirements } from '@px402/core';
import type {
  Px402MiddlewareConfig,
  RequirePaymentOptions,
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  ExpressHandler,
} from './types.js';
import { PaymentVerifier } from './verifier.js';
import { X402_HEADERS, X402_VERSION } from './types.js';

/**
 * Create payment requirements from options
 */
export function createPaymentRequirements(
  options: RequirePaymentOptions
): PaymentRequirements {
  return {
    x402Version: X402_VERSION,
    scheme: options.scheme || 'private-exact',
    network: options.network || 'solana',
    payTo: options.recipient,
    maxAmountRequired: options.amount,
    asset: options.token,
    description: options.description,
    resource: options.resource,
  };
}

/**
 * Send 402 Payment Required response
 */
export function send402Response(
  res: ExpressResponse,
  requirements: PaymentRequirements
): void {
  const requirementsJson = JSON.stringify(requirements);

  res.status(402);
  res.setHeader(X402_HEADERS.PAYMENT_REQUIREMENTS, requirementsJson);
  res.setHeader(X402_HEADERS.VERSION, String(X402_VERSION));
  res.setHeader('WWW-Authenticate', `X402 ${requirementsJson}`);
  res.json({
    error: 'Payment Required',
    message: 'This endpoint requires payment',
    paymentRequirements: requirements,
  });
}

/**
 * Global middleware to handle X-Payment header verification
 * Attaches payment result to request if payment header is present
 */
export function px402Middleware(
  config: Px402MiddlewareConfig
): ExpressHandler {
  const verifier = new PaymentVerifier({ schemes: config.schemes });

  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    // Get payment header (case-insensitive)
    const paymentHeader = getHeader(req, X402_HEADERS.PAYMENT);

    if (!paymentHeader) {
      // No payment header - continue without verification
      return next();
    }

    // Check if we have payment requirements on the request
    const requirements = req.paymentRequirements;
    if (!requirements) {
      // No requirements set - continue (requirePayment middleware will handle)
      return next();
    }

    try {
      // Verify payment
      const result = await verifier.verify(paymentHeader, requirements);
      req.paymentResult = result;

      if (result.valid) {
        config.onPaymentVerified?.(req, result);
      } else {
        config.onPaymentFailed?.(req, new Error(result.reason || 'Invalid payment'));
      }

      next();
    } catch (error) {
      config.onPaymentFailed?.(req, error as Error);
      next(error);
    }
  };
}

/**
 * Route-level middleware to require payment
 */
export function requirePayment(
  options: RequirePaymentOptions
): ExpressHandler {
  const requirements = createPaymentRequirements(options);

  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    // Attach requirements to request for global middleware
    req.paymentRequirements = requirements;

    // Get payment header
    const paymentHeader = getHeader(req, X402_HEADERS.PAYMENT);

    if (!paymentHeader) {
      // No payment - return 402
      return send402Response(res, requirements);
    }

    // Check if payment was already verified by global middleware
    if (req.paymentResult) {
      if (req.paymentResult.valid) {
        return next();
      } else {
        // Payment was invalid
        return send402Response(res, requirements);
      }
    }

    // No global middleware - verify here
    // This allows using requirePayment without px402Middleware
    try {
      const verifier = new PaymentVerifier({ schemes: [] });

      // We need schemes to verify - this is a configuration issue
      // Return 402 with requirements
      return send402Response(res, requirements);
    } catch {
      return send402Response(res, requirements);
    }
  };
}

/**
 * Create a standalone requirePayment middleware with verifier
 */
export function createRequirePayment(
  config: Px402MiddlewareConfig
): (options: RequirePaymentOptions) => ExpressHandler {
  const verifier = new PaymentVerifier({ schemes: config.schemes });

  return (options: RequirePaymentOptions): ExpressHandler => {
    const requirements = createPaymentRequirements(options);

    return async (
      req: ExpressRequest,
      res: ExpressResponse,
      next: ExpressNextFunction
    ) => {
      req.paymentRequirements = requirements;

      const paymentHeader = getHeader(req, X402_HEADERS.PAYMENT);

      if (!paymentHeader) {
        return send402Response(res, requirements);
      }

      try {
        const result = await verifier.verify(paymentHeader, requirements);
        req.paymentResult = result;

        if (result.valid) {
          config.onPaymentVerified?.(req, result);
          return next();
        } else {
          config.onPaymentFailed?.(req, new Error(result.reason || 'Invalid payment'));
          return send402Response(res, requirements);
        }
      } catch (error) {
        config.onPaymentFailed?.(req, error as Error);
        return send402Response(res, requirements);
      }
    };
  };
}

/**
 * Get header value (case-insensitive)
 */
function getHeader(req: ExpressRequest, name: string): string | undefined {
  const lowerName = name.toLowerCase();

  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === lowerName) {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  return undefined;
}
