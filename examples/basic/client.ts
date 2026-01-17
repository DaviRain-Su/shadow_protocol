/**
 * Px402 Client Example
 *
 * Demonstrates how to use the Px402 client for automatic 402 payment handling.
 *
 * Run with: pnpm --filter @px402/example-basic client
 */

import { Keypair } from '@solana/web3.js';
import { Px402Client } from '@px402/client';
import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

async function main() {
  console.log('Setting up Px402 client...\n');

  // Create wallet (use your actual wallet in production)
  const wallet = Keypair.generate();
  console.log(`Client wallet: ${wallet.publicKey.toBase58()}`);

  // Create provider
  const provider = new SolanaPrivacyProvider({
    rpcUrl: RPC_URL,
    wallet,
  });
  await provider.initialize();

  // Create scheme
  const scheme = new PrivateCashScheme({
    provider,
    rpcUrl: RPC_URL,
  });

  // Create Px402 client
  const client = new Px402Client({
    provider,
    schemes: [scheme],
    defaultMode: 'private',
  });

  console.log('\n--- Testing Endpoints ---\n');

  // Test 1: Free endpoint (no payment needed)
  console.log('1. Fetching free endpoint...');
  try {
    const freeResponse = await client.fetch(`${SERVER_URL}/api/free`);
    const freeData = await freeResponse.json();
    console.log('   Response:', freeData);
    console.log('   Payment required:', freeResponse.paymentResult?.required);
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 2: Premium endpoint without payment options
  console.log('\n2. Fetching premium endpoint WITHOUT payment...');
  try {
    const premiumResponse = await client.fetch(`${SERVER_URL}/api/premium`);
    console.log('   Status:', premiumResponse.status);
    console.log('   Payment required:', premiumResponse.paymentResult?.required);

    if (premiumResponse.status === 402) {
      console.log('   Got 402 Payment Required (expected)');
    }
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 3: Premium endpoint WITH payment options
  console.log('\n3. Fetching premium endpoint WITH payment...');
  console.log('   Note: This will fail in demo mode (no real funds)');
  try {
    const paidResponse = await client.fetch(`${SERVER_URL}/api/premium`, {
      payment: {
        maxAmount: '10000000', // 0.01 SOL
        token: 'SOL',
      },
    });
    console.log('   Status:', paidResponse.status);
    console.log('   Payment result:', paidResponse.paymentResult);

    if (paidResponse.ok) {
      const data = await paidResponse.json();
      console.log('   Data:', data);
    }
  } catch (error) {
    console.error('   Expected error (demo mode):', (error as Error).message);
  }

  // Test 4: Check balance
  console.log('\n4. Checking private balance...');
  try {
    const balance = await client.getBalance('SOL');
    console.log('   Balance:', balance.toString(), 'lamports');
  } catch (error) {
    console.error('   Error:', error);
  }

  console.log('\n--- Demo Complete ---');
  console.log('\nNote: In production, you would:');
  console.log('1. Deposit funds to Privacy Cash');
  console.log('2. The client would automatically pay using private funds');
  console.log('3. Server verifies payment and grants access');
}

main().catch(console.error);
