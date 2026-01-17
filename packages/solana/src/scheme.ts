/**
 * @px402/solana - Private Cash Scheme
 * x402 payment scheme using Privacy Cash for anonymous payments
 */

import { Connection } from '@solana/web3.js';
import type {
  X402Scheme,
  PaymentRequirements,
  PaymentPayload,
  VerificationResult,
  SCHEME_NAMES,
} from '@px402/core';
import type { SolanaPrivacyProvider } from './provider.js';

// ============ Types ============

/**
 * Private Cash scheme configuration
 */
export interface PrivateCashSchemeConfig {
  /** Privacy provider instance */
  provider: SolanaPrivacyProvider;
  /** Solana RPC endpoint */
  rpcUrl: string;
}

/**
 * Private Cash payment payload data
 */
export interface PrivateCashPayloadData {
  /** Transaction signature */
  signature: string;
  /** Nullifier hash (hashed) */
  nullifierHash: string;
  /** Payment amount */
  amount: string;
  /** Token identifier */
  token: string;
  /** Timestamp */
  timestamp: number;
}

// ============ Scheme Implementation ============

/**
 * Private Cash Scheme
 * Implements x402 payment scheme using Privacy Cash
 */
export class PrivateCashScheme implements X402Scheme {
  readonly name = 'private-exact';
  readonly supportedNetworks = ['solana'];

  private provider: SolanaPrivacyProvider;
  private connection: Connection;

  constructor(config: PrivateCashSchemeConfig) {
    this.provider = config.provider;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  /**
   * Create a payment for given requirements
   */
  async createPayment(requirements: PaymentRequirements): Promise<PaymentPayload> {
    // Validate requirements
    this.validateRequirements(requirements);

    const { payTo, maxAmountRequired, asset } = requirements;
    const amount = BigInt(maxAmountRequired);

    // 1. Find suitable note
    const note = await this.provider.findNoteForPayment(asset, amount);
    if (!note) {
      throw new Error(
        `Insufficient balance in privacy pool for ${asset}. Required: ${maxAmountRequired}`
      );
    }

    // 2. Generate payment proof (executes private withdrawal)
    const proof = await this.provider.generatePaymentProof({
      note,
      recipient: payTo,
      amount,
    });

    // 3. Build payload data
    const payloadData: PrivateCashPayloadData = {
      signature: proof.proof,
      nullifierHash: note.nullifier, // Already hashed in Privacy Cash
      amount: maxAmountRequired,
      token: asset,
      timestamp: proof.metadata.timestamp,
    };

    // 4. Return x402 PaymentPayload
    return {
      x402Version: requirements.x402Version,
      scheme: 'private-exact',
      network: 'solana',
      payload: payloadData as unknown as Record<string, unknown>,
    };
  }

  /**
   * Verify a payment
   */
  async verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    // Validate scheme and network
    if (payload.scheme !== 'private-exact') {
      return {
        valid: false,
        reason: `Invalid scheme: expected private-exact, got ${payload.scheme}`,
      };
    }

    if (payload.network !== 'solana') {
      return {
        valid: false,
        reason: `Invalid network: expected solana, got ${payload.network}`,
      };
    }

    const data = payload.payload as unknown as PrivateCashPayloadData;

    // 1. Validate amount
    if (BigInt(data.amount) < BigInt(requirements.maxAmountRequired)) {
      return {
        valid: false,
        reason: `Insufficient amount: required ${requirements.maxAmountRequired}, got ${data.amount}`,
      };
    }

    // 2. Validate token
    if (data.token !== requirements.asset) {
      return {
        valid: false,
        reason: `Token mismatch: expected ${requirements.asset}, got ${data.token}`,
      };
    }

    // 3. Verify on-chain transaction
    try {
      const tx = await this.connection.getTransaction(data.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return {
          valid: false,
          reason: 'Transaction not found',
        };
      }

      // Check transaction was successful
      if (tx.meta?.err) {
        return {
          valid: false,
          reason: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
        };
      }

      // 4. Parse and verify transfer details
      const verificationDetails = await this.verifyTransferDetails(
        tx,
        requirements.payTo,
        BigInt(requirements.maxAmountRequired),
        requirements.asset
      );

      if (!verificationDetails.valid) {
        return verificationDetails;
      }

      return {
        valid: true,
        details: {
          signature: data.signature,
          timestamp: data.timestamp,
          slot: tx.slot,
        },
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if scheme supports a network
   */
  supportsNetwork(network: string): boolean {
    return this.supportedNetworks.includes(network);
  }

  /**
   * Check if scheme supports an asset
   */
  async supportsAsset(asset: string, network: string): Promise<boolean> {
    if (network !== 'solana') {
      return false;
    }

    // Support SOL and known SPL tokens
    const supportedTokens = [
      'SOL',
      'So11111111111111111111111111111111111111112', // Wrapped SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ];

    return supportedTokens.includes(asset);
  }

  // ============ Private Methods ============

  /**
   * Validate payment requirements
   */
  private validateRequirements(requirements: PaymentRequirements): void {
    if (requirements.scheme !== 'private-exact') {
      throw new Error(
        `Scheme mismatch: expected private-exact, got ${requirements.scheme}`
      );
    }

    if (!this.supportsNetwork(requirements.network)) {
      throw new Error(`Network not supported: ${requirements.network}`);
    }

    if (!requirements.payTo) {
      throw new Error('payTo address is required');
    }

    if (!requirements.maxAmountRequired) {
      throw new Error('maxAmountRequired is required');
    }

    if (!requirements.asset) {
      throw new Error('asset is required');
    }
  }

  /**
   * Verify transfer details in transaction
   */
  private async verifyTransferDetails(
    tx: Awaited<ReturnType<Connection['getTransaction']>>,
    expectedRecipient: string,
    expectedAmount: bigint,
    asset: string
  ): Promise<VerificationResult> {
    if (!tx || !tx.meta) {
      return { valid: false, reason: 'Transaction metadata not available' };
    }

    // For SOL transfers, check postBalances - preBalances
    if (asset === 'SOL' || asset === 'So11111111111111111111111111111111111111112') {
      const accountKeys = tx.transaction.message.getAccountKeys();
      const recipientIndex = accountKeys.staticAccountKeys.findIndex(
        (key) => key.toBase58() === expectedRecipient
      );

      if (recipientIndex === -1) {
        return { valid: false, reason: 'Recipient not found in transaction' };
      }

      const preBalance = tx.meta.preBalances[recipientIndex] || 0;
      const postBalance = tx.meta.postBalances[recipientIndex] || 0;
      const received = BigInt(postBalance - preBalance);

      if (received < expectedAmount) {
        return {
          valid: false,
          reason: `Insufficient transfer: expected ${expectedAmount}, received ${received}`,
        };
      }

      return { valid: true };
    }

    // For SPL tokens, check token balance changes
    const preTokenBalances = tx.meta.preTokenBalances || [];
    const postTokenBalances = tx.meta.postTokenBalances || [];

    // Find recipient's token account balance change
    const postBalance = postTokenBalances.find(
      (b) =>
        b.owner === expectedRecipient &&
        b.mint === asset
    );

    const preBalance = preTokenBalances.find(
      (b) =>
        b.owner === expectedRecipient &&
        b.mint === asset
    );

    if (!postBalance) {
      return { valid: false, reason: 'Token transfer to recipient not found' };
    }

    const pre = BigInt(preBalance?.uiTokenAmount.amount || '0');
    const post = BigInt(postBalance.uiTokenAmount.amount);
    const received = post - pre;

    if (received < expectedAmount) {
      return {
        valid: false,
        reason: `Insufficient token transfer: expected ${expectedAmount}, received ${received}`,
      };
    }

    return { valid: true };
  }
}

/**
 * Create a Private Cash scheme instance
 */
export function createPrivateCashScheme(
  config: PrivateCashSchemeConfig
): PrivateCashScheme {
  return new PrivateCashScheme(config);
}
