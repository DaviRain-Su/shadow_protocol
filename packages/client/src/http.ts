/**
 * @px402/client - HTTP 402 Handling
 */

import type { PaymentRequirements, PaymentPayload } from '@px402/core';
import { X402_HEADERS, X402_VERSION } from './types.js';

/**
 * Parse payment requirements from 402 response
 */
export function parsePaymentRequirements(
  response: Response
): PaymentRequirements | null {
  // Try X-Payment-Requirements header first
  const requirementsHeader = response.headers.get(
    X402_HEADERS.PAYMENT_REQUIREMENTS
  );

  if (requirementsHeader) {
    try {
      return JSON.parse(requirementsHeader) as PaymentRequirements;
    } catch {
      // Fall through to try other methods
    }
  }

  // Try WWW-Authenticate header (standard HTTP auth)
  const wwwAuth = response.headers.get('WWW-Authenticate');
  if (wwwAuth?.startsWith('X402')) {
    try {
      const jsonPart = wwwAuth.replace('X402 ', '');
      return JSON.parse(jsonPart) as PaymentRequirements;
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Parse payment requirements from response body (fallback)
 */
export async function parsePaymentRequirementsFromBody(
  response: Response
): Promise<PaymentRequirements | null> {
  try {
    const cloned = response.clone();
    const body = await cloned.json();

    // Check if body contains payment requirements
    if (body && typeof body === 'object' && 'x402Version' in body) {
      return body as PaymentRequirements;
    }

    // Check nested structure
    const bodyObj = body as Record<string, unknown>;
    if (bodyObj?.paymentRequirements) {
      return bodyObj.paymentRequirements as PaymentRequirements;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Create payment header value from payload
 */
export function createPaymentHeader(payload: PaymentPayload): string {
  return JSON.stringify(payload);
}

/**
 * Create payment header value (Base64 encoded)
 */
export function createPaymentHeaderBase64(payload: PaymentPayload): string {
  const json = JSON.stringify(payload);
  // Use btoa for browser, Buffer for Node
  if (typeof btoa !== 'undefined') {
    return btoa(json);
  }
  return Buffer.from(json).toString('base64');
}

/**
 * Parse payment header from request
 */
export function parsePaymentHeader(header: string): PaymentPayload | null {
  try {
    // Try JSON first
    if (header.startsWith('{')) {
      return JSON.parse(header) as PaymentPayload;
    }

    // Try Base64
    let decoded: string;
    if (typeof atob !== 'undefined') {
      decoded = atob(header);
    } else {
      decoded = Buffer.from(header, 'base64').toString('utf-8');
    }
    return JSON.parse(decoded) as PaymentPayload;
  } catch {
    return null;
  }
}

/**
 * Check if response is a 402 Payment Required
 */
export function is402Response(response: Response): boolean {
  return response.status === 402;
}

/**
 * Create 402 response headers
 */
export function create402Headers(
  requirements: PaymentRequirements
): Record<string, string> {
  return {
    [X402_HEADERS.PAYMENT_REQUIREMENTS]: JSON.stringify(requirements),
    [X402_HEADERS.VERSION]: String(X402_VERSION),
    'WWW-Authenticate': `X402 ${JSON.stringify(requirements)}`,
  };
}

/**
 * Validate payment requirements
 */
export function validatePaymentRequirements(
  requirements: PaymentRequirements
): { valid: boolean; error?: string } {
  if (!requirements.x402Version) {
    return { valid: false, error: 'Missing x402Version' };
  }

  if (!requirements.scheme) {
    return { valid: false, error: 'Missing scheme' };
  }

  if (!requirements.network) {
    return { valid: false, error: 'Missing network' };
  }

  if (!requirements.payTo) {
    return { valid: false, error: 'Missing payTo address' };
  }

  if (!requirements.maxAmountRequired) {
    return { valid: false, error: 'Missing maxAmountRequired' };
  }

  if (!requirements.asset) {
    return { valid: false, error: 'Missing asset' };
  }

  return { valid: true };
}
