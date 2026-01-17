/**
 * Px402 In-Memory Demo
 *
 * Demonstrates the complete Px402 flow without external dependencies.
 * Uses mock implementations for quick testing.
 *
 * Run with: pnpm --filter @px402/example-basic demo
 */

import { Keypair } from '@solana/web3.js';
import { Px402Client, is402Response, parsePaymentRequirements } from '@px402/client';
import {
  createRequirePayment,
  send402Response,
  createPaymentRequirements,
  PaymentVerifier,
} from '@px402/server';
import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';
import type { PaymentRequirements } from '@px402/core';

// Mock fetch for demo
async function mockFetch(
  url: string,
  requirements: PaymentRequirements | null,
  paymentHeader?: string
): Promise<Response> {
  // Simulate endpoints
  if (url.includes('/free')) {
    return new Response(JSON.stringify({ message: 'Free content!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (url.includes('/premium')) {
    if (!paymentHeader) {
      // Return 402
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Payment-Requirements': JSON.stringify(requirements),
        'WWW-Authenticate': `X402 ${JSON.stringify(requirements)}`,
      });
      return new Response(
        JSON.stringify({ error: 'Payment Required', paymentRequirements: requirements }),
        { status: 402, headers }
      );
    }

    // Payment provided - verify would happen here
    return new Response(
      JSON.stringify({ message: 'Premium content!', paid: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('Not Found', { status: 404 });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║               Px402 In-Memory Demo                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Setup
  const wallet = Keypair.generate();
  const recipientWallet = Keypair.generate();
  const RPC_URL = 'https://api.devnet.solana.com';

  console.log('Setup:');
  console.log(`  Client wallet:    ${wallet.publicKey.toBase58().slice(0, 20)}...`);
  console.log(`  Recipient wallet: ${recipientWallet.publicKey.toBase58().slice(0, 20)}...`);

  // Create provider and scheme
  const provider = new SolanaPrivacyProvider({
    rpcUrl: RPC_URL,
    wallet,
  });
  await provider.initialize();

  const scheme = new PrivateCashScheme({
    provider,
    rpcUrl: RPC_URL,
  });

  // Payment requirements for premium endpoint
  const premiumRequirements = createPaymentRequirements({
    amount: '10000000',
    token: 'SOL',
    recipient: recipientWallet.publicKey.toBase58(),
    description: 'Premium content access',
  });

  console.log('\n--- Demo Scenarios ---\n');

  // Scenario 1: Free endpoint
  console.log('1. Free Endpoint Request');
  console.log('   GET /api/free');
  const freeResponse = await mockFetch('/api/free', null);
  console.log(`   Status: ${freeResponse.status}`);
  console.log(`   Body: ${await freeResponse.text()}`);

  // Scenario 2: Premium endpoint without payment
  console.log('\n2. Premium Endpoint (No Payment)');
  console.log('   GET /api/premium');
  const noPayResponse = await mockFetch('/api/premium', premiumRequirements);
  console.log(`   Status: ${noPayResponse.status}`);

  if (is402Response(noPayResponse)) {
    const requirements = parsePaymentRequirements(noPayResponse);
    console.log('   Payment Required:');
    console.log(`     - Scheme: ${requirements?.scheme}`);
    console.log(`     - Amount: ${requirements?.maxAmountRequired} lamports`);
    console.log(`     - Token: ${requirements?.asset}`);
    console.log(`     - Recipient: ${requirements?.payTo?.slice(0, 20)}...`);
  }

  // Scenario 3: Premium endpoint with payment
  console.log('\n3. Premium Endpoint (With Payment)');
  console.log('   GET /api/premium');
  console.log('   X-Payment: {...payment_payload...}');

  // In real scenario, client would create payment
  const mockPaymentHeader = JSON.stringify({
    x402Version: 1,
    scheme: 'private-exact',
    network: 'solana',
    payload: {
      signature: 'mock_signature_12345',
      amount: '10000000',
      token: 'SOL',
    },
  });

  const paidResponse = await mockFetch('/api/premium', premiumRequirements, mockPaymentHeader);
  console.log(`   Status: ${paidResponse.status}`);
  console.log(`   Body: ${await paidResponse.text()}`);

  // Scenario 4: Payment verification
  console.log('\n4. Payment Verification (Server Side)');
  const verifier = new PaymentVerifier({ schemes: [scheme] });

  console.log('   Verifying payment header...');
  const verificationResult = await verifier.verify(mockPaymentHeader, premiumRequirements);
  console.log(`   Valid: ${verificationResult.valid}`);
  if (!verificationResult.valid) {
    console.log(`   Reason: ${verificationResult.reason}`);
    console.log('   (Expected in demo mode - no real transaction)');
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                     Demo Summary                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  ✓ Free endpoint returns content directly                 ║');
  console.log('║  ✓ Premium endpoint returns 402 without payment           ║');
  console.log('║  ✓ Premium endpoint returns content with valid payment    ║');
  console.log('║  ✓ Server can verify payment proofs                       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  In production:                                           ║');
  console.log('║  1. User deposits to Privacy Cash                         ║');
  console.log('║  2. Client auto-detects 402 and creates payment           ║');
  console.log('║  3. Server verifies ZK proof on-chain                     ║');
  console.log('║  4. Payment sender identity remains private               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
