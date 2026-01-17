/**
 * Px402 End-to-End Devnet Test
 *
 * Complete test with real Privacy Cash on Devnet.
 * Requires devnet SOL - use `solana airdrop` first.
 *
 * Run with: pnpm --filter @px402/example-basic e2e:devnet
 */

import express from 'express';
import { Keypair } from '@solana/web3.js';
import { Px402Client } from '@px402/client';
import {
  createRequirePayment,
  createPaymentRequirements,
  MemoryNullifierRegistry,
} from '@px402/server';
import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';

// Devnet RPC
const RPC_URL = 'https://api.devnet.solana.com';
const PORT = 3402;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, ...args: unknown[]) {
  console.log(colors[color], ...args, colors.reset);
}

async function main() {
  console.log('\n');
  log('cyan', '╔═══════════════════════════════════════════════════════════════╗');
  log('cyan', '║          Px402 Devnet End-to-End Test                         ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');

  // ============ Setup ============
  log('blue', '1. Setting up wallets and providers...');

  // Generate fresh wallets
  const clientWallet = Keypair.generate();
  const serverWallet = Keypair.generate();

  log('yellow', `   Client wallet: ${clientWallet.publicKey.toBase58()}`);
  log('yellow', `   Server wallet: ${serverWallet.publicKey.toBase58()}`);
  log('yellow', '\n   Please run the following to fund the client wallet on Devnet:');
  log('cyan', `   solana airdrop 2 ${clientWallet.publicKey.toBase58()} --url devnet\n`);

  // Wait for user to fund wallet
  log('blue', '   Checking balance (waiting for airdrop)...');

  const { Connection } = await import('@solana/web3.js');
  const connection = new Connection(RPC_URL, 'confirmed');

  let balance = 0;
  let attempts = 0;
  while (balance < 1_000_000_000 && attempts < 60) { // 1 SOL minimum
    balance = await connection.getBalance(clientWallet.publicKey);
    if (balance < 1_000_000_000) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
      if (attempts % 5 === 0) {
        log('yellow', `   Still waiting for airdrop... (${attempts * 2}s)`);
      }
    }
  }

  if (balance < 1_000_000_000) {
    log('red', '   Timeout waiting for airdrop. Please run the airdrop command and try again.');
    process.exit(1);
  }

  log('green', `   ✓ Wallet funded with ${balance / 1e9} SOL`);

  // Client-side provider
  const clientProvider = new SolanaPrivacyProvider({
    rpcUrl: RPC_URL,
    wallet: clientWallet,
  });
  await clientProvider.initialize();

  // Deposit to Privacy Cash
  log('blue', '\n2. Depositing SOL to Privacy Cash...');
  try {
    const depositResult = await clientProvider.deposit({
      amount: BigInt(100_000_000), // 0.1 SOL
      token: 'SOL',
    });
    log('green', `   ✓ Deposited 0.1 SOL to Privacy Cash`);
    log('green', `   ✓ TX: ${depositResult.txHash}`);
  } catch (error: any) {
    log('red', `   ✗ Deposit failed: ${error.message}`);
    process.exit(1);
  }

  // Server-side nullifier registry
  const nullifierRegistry = new MemoryNullifierRegistry({ ttl: 3600000 });

  // Client scheme
  const clientScheme = new PrivateCashScheme({
    provider: clientProvider,
    rpcUrl: RPC_URL,
  });

  // Server scheme with nullifier registry
  const serverScheme = new PrivateCashScheme({
    provider: clientProvider,
    rpcUrl: RPC_URL,
    nullifierRegistry,
  });

  // ============ Create Express Server ============
  log('blue', '\n3. Starting Express server...');

  const app = express();
  app.use(express.json());

  const requirePayment = createRequirePayment({
    schemes: [serverScheme],
    onPaymentVerified: () => log('green', '   ✓ Payment verified!'),
    onPaymentFailed: (_, error) => log('red', `   ✗ Payment failed: ${error.message}`),
  });

  // Free endpoint
  app.get('/api/free', (_, res) => {
    res.json({ message: 'Free content!', free: true });
  });

  // Premium endpoint (0.01 SOL)
  app.get(
    '/api/premium',
    requirePayment({
      amount: '10000000', // 0.01 SOL
      token: 'SOL',
      recipient: serverWallet.publicKey.toBase58(),
      description: 'Premium content access',
    }),
    (_, res) => {
      res.json({
        message: 'Welcome to premium content!',
        secret: 'The answer is 42',
        premium: true,
      });
    }
  );

  const server = app.listen(PORT, () => {
    log('green', `   ✓ Server running at http://localhost:${PORT}`);
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // ============ Create Client ============
  log('blue', '\n4. Creating Px402 client...');

  const client = new Px402Client({
    provider: clientProvider,
    schemes: [clientScheme],
    defaultMode: 'private',
  });

  log('green', '   ✓ Client initialized');

  // ============ Test Payment Flow ============
  log('blue', '\n5. Testing payment flow...');

  try {
    // Test free endpoint
    log('yellow', '   Testing free endpoint...');
    const freeResponse = await client.fetch(`http://localhost:${PORT}/api/free`);
    const freeData = await freeResponse.json();
    log('green', `   ✓ Free endpoint: ${JSON.stringify(freeData)}`);

    // Test premium endpoint with payment
    log('yellow', '   Testing premium endpoint with payment...');
    const paidResponse = await client.fetch(`http://localhost:${PORT}/api/premium`, {
      payment: {
        maxAmount: '50000000',
        token: 'SOL',
      },
    });

    if (paidResponse.status === 200) {
      const data = await paidResponse.json();
      log('green', `   ✓ Premium content received: ${JSON.stringify(data)}`);
    } else {
      log('red', `   ✗ Premium request failed: ${paidResponse.status}`);
    }
  } catch (error: any) {
    log('yellow', `   ⚠ Test error: ${error.message}`);
  }

  // ============ Cleanup ============
  log('blue', '\n6. Cleaning up...');
  server.close();
  log('green', '   ✓ Server stopped');

  // ============ Summary ============
  console.log('\n');
  log('cyan', '╔═══════════════════════════════════════════════════════════════╗');
  log('cyan', '║                     Test Complete                             ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
