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
  RelayerConfig,
} from '@px402/core';
import type { SolanaPrivacyProvider } from './provider.js';

// ============ Types ============

/**
 * Nullifier registry interface (from @px402/server)
 * Redefined here to avoid circular dependency
 */
export interface NullifierRegistry {
  register(info: {
    nullifier: string;
    txSignature: string;
    registeredAt: number;
    amount: string;
    token: string;
    recipient: string;
  }): Promise<boolean>;
  isUsed(nullifier: string): Promise<boolean>;
}

/**
 * Relayer configuration for payment scheme
 */
export interface SchemeRelayerConfig {
  /** Relayer API URL */
  url: string;
  /** Relayer fee in lamports */
  fee: bigint;
}

/**
 * Private Cash scheme configuration
 */
export interface PrivateCashSchemeConfig {
  /** Privacy provider instance */
  provider: SolanaPrivacyProvider;
  /** Solana RPC endpoint */
  rpcUrl: string;
  /** Nullifier registry for double-spend prevention (optional for client) */
  nullifierRegistry?: NullifierRegistry;
  /** Default relayer for anonymous transactions */
  defaultRelayer?: SchemeRelayerConfig;
  /**
   * Skip on-chain verification (for local testing with simulated transactions)
   * WARNING: Only use in development/testing environments
   */
  skipOnChainVerification?: boolean;
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
  /** Relayer fee paid (if any) */
  relayerFee?: string;
  /** Relayer address (if any) */
  relayerUrl?: string;
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
  private nullifierRegistry?: NullifierRegistry;
  private defaultRelayer?: SchemeRelayerConfig;
  private skipOnChainVerification: boolean;

  constructor(config: PrivateCashSchemeConfig) {
    this.provider = config.provider;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.nullifierRegistry = config.nullifierRegistry;
    this.defaultRelayer = config.defaultRelayer;
    this.skipOnChainVerification = config.skipOnChainVerification ?? false;

    if (this.skipOnChainVerification) {
      console.warn('[PrivateCashScheme] On-chain verification disabled - for testing only!');
    }
  }

  /**
   * Set default relayer for anonymous transactions
   */
  setDefaultRelayer(relayer: SchemeRelayerConfig | undefined): void {
    this.defaultRelayer = relayer;
  }

  /**
   * Get current default relayer
   */
  getDefaultRelayer(): SchemeRelayerConfig | undefined {
    return this.defaultRelayer;
  }

  /**
   * Set nullifier registry (useful for late initialization)
   */
  setNullifierRegistry(registry: NullifierRegistry): void {
    this.nullifierRegistry = registry;
  }

  /**
   * Create a payment for given requirements
   */
  async createPayment(requirements: PaymentRequirements): Promise<PaymentPayload> {
    // Validate requirements
    this.validateRequirements(requirements);

    const { payTo, maxAmountRequired, asset } = requirements;
    const amount = BigInt(maxAmountRequired);

    // Get relayer config (from requirements.extra or default)
    const relayer = this.getRelayerConfig(requirements);
    const relayerFee = relayer ? relayer.fee : 0n;
    const totalRequired = amount + relayerFee;

    // 1. Find suitable note (amount + relayer fee)
    const note = await this.provider.findNoteForPayment(asset, totalRequired);
    if (!note) {
      throw new Error(
        `Insufficient balance in privacy pool for ${asset}. Required: ${totalRequired.toString()} (including ${relayerFee.toString()} relayer fee)`
      );
    }

    // 2. Generate payment proof (executes private withdrawal)
    const proof = await this.provider.generatePaymentProof({
      note,
      recipient: payTo,
      amount,
      relayer: relayer ? { url: relayer.url, fee: relayer.fee } : undefined,
    });

    // 3. Build payload data
    const payloadData: PrivateCashPayloadData = {
      signature: proof.proof,
      nullifierHash: note.nullifier, // Already hashed in Privacy Cash
      amount: maxAmountRequired,
      token: asset,
      timestamp: proof.metadata.timestamp,
      relayerFee: relayerFee > 0n ? relayerFee.toString() : undefined,
      relayerUrl: relayer?.url,
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
   * Get relayer configuration from requirements or default
   */
  private getRelayerConfig(requirements: PaymentRequirements): SchemeRelayerConfig | undefined {
    // Check for relayer in requirements.extra
    const extra = requirements.extra;
    if (extra?.relayer && typeof extra.relayer === 'object') {
      const relayerExtra = extra.relayer as { url?: string; fee?: string | bigint };
      if (relayerExtra.url && relayerExtra.fee !== undefined) {
        return {
          url: relayerExtra.url,
          fee: typeof relayerExtra.fee === 'bigint'
            ? relayerExtra.fee
            : BigInt(relayerExtra.fee),
        };
      }
    }

    // Fall back to default relayer
    return this.defaultRelayer;
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

    // 3. Check nullifier for double-spend (if registry available)
    if (this.nullifierRegistry && data.nullifierHash) {
      const isUsed = await this.nullifierRegistry.isUsed(data.nullifierHash);
      if (isUsed) {
        return {
          valid: false,
          reason: 'Double-spend detected: nullifier already used',
        };
      }
    }

    // 4. Skip on-chain verification if configured (for local testing)
    if (this.skipOnChainVerification) {
      // In test mode, register nullifier and accept payment
      if (this.nullifierRegistry && data.nullifierHash) {
        const registered = await this.nullifierRegistry.register({
          nullifier: data.nullifierHash,
          txSignature: data.signature,
          registeredAt: Date.now(),
          amount: data.amount,
          token: data.token,
          recipient: requirements.payTo,
        });

        if (!registered) {
          return {
            valid: false,
            reason: 'Double-spend detected: nullifier registered by concurrent request',
          };
        }
      }

      return {
        valid: true,
        details: {
          signature: data.signature,
          timestamp: data.timestamp,
          nullifierHash: data.nullifierHash,
          testMode: true,
        },
      };
    }

    // 5. Verify on-chain transaction
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

      // 6. Parse and verify transfer details
      const verificationDetails = await this.verifyTransferDetails(
        tx,
        requirements.payTo,
        BigInt(requirements.maxAmountRequired),
        requirements.asset
      );

      if (!verificationDetails.valid) {
        return verificationDetails;
      }

      // 7. Register nullifier to prevent double-spend
      if (this.nullifierRegistry && data.nullifierHash) {
        const registered = await this.nullifierRegistry.register({
          nullifier: data.nullifierHash,
          txSignature: data.signature,
          registeredAt: Date.now(),
          amount: data.amount,
          token: data.token,
          recipient: requirements.payTo,
        });

        if (!registered) {
          // Race condition: another verification registered it first
          return {
            valid: false,
            reason: 'Double-spend detected: nullifier registered by concurrent request',
          };
        }
      }

      return {
        valid: true,
        details: {
          signature: data.signature,
          timestamp: data.timestamp,
          slot: tx.slot,
          nullifierHash: data.nullifierHash,
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
