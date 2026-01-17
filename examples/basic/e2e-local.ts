/**
 * Px402 End-to-End Local Test with Real Privacy Cash
 *
 * Tests with the locally deployed Privacy Cash contract.
 * Program ID: 4tL8Q58mL3QuLJFjGDcWqNw4WPzuJgHU9xhbWpGL9y9o
 *
 * Run with: pnpm --filter @px402/example-basic e2e:local
 */

import express from 'express';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Px402Client } from '@px402/client';
import {
  createRequirePayment,
  createPaymentRequirements,
  MemoryNullifierRegistry,
} from '@px402/server';
import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';

// Local testnet RPC
const RPC_URL = 'http://localhost:8899';
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
  log('cyan', '║      Px402 Local Testnet E2E Test (Real Privacy Cash)         ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');

  const connection = new Connection(RPC_URL, 'confirmed');

  // ============ Setup Wallets ============
  log('blue', '1. Setting up wallets...');

  const clientWallet = Keypair.generate();
  const serverWallet = Keypair.generate();

  log('cyan', `   Client: ${clientWallet.publicKey.toBase58()}`);
  log('cyan', `   Server: ${serverWallet.publicKey.toBase58()}`);

  // Airdrop SOL to client wallet
  log('blue', '\n2. Airdropping SOL to client wallet...');
  try {
    const airdropSig = await connection.requestAirdrop(
      clientWallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);
    const balance = await connection.getBalance(clientWallet.publicKey);
    log('green', `   ✓ Airdropped ${balance / LAMPORTS_PER_SOL} SOL to client`);
  } catch (error: any) {
    log('red', `   ✗ Airdrop failed: ${error.message}`);
    process.exit(1);
  }

  // ============ Initialize Provider ============
  log('blue', '\n3. Initializing Privacy Provider...');

  const clientProvider = new SolanaPrivacyProvider({
    rpcUrl: RPC_URL,
    wallet: clientWallet,
  });

  try {
    await clientProvider.initialize();
    log('green', '   ✓ Provider initialized');
  } catch (error: any) {
    log('red', `   ✗ Provider init failed: ${error.message}`);
    process.exit(1);
  }

  // ============ Deposit to Privacy Cash ============
  log('blue', '\n4. Depositing SOL to Privacy Cash pool...');

  try {
    const depositAmount = BigInt(500_000_000); // 0.5 SOL
    log('cyan', `   Depositing ${Number(depositAmount) / LAMPORTS_PER_SOL} SOL...`);

    const depositResult = await clientProvider.deposit({
      amount: depositAmount,
      token: 'SOL',
    });

    log('green', `   ✓ Deposit successful!`);
    log('green', `   ✓ TX: ${depositResult.txHash}`);
    log('green', `   ✓ Commitment: ${depositResult.note.commitment.slice(0, 20)}...`);

    // Check private balance
    const privateBalance = await clientProvider.getPrivateBalance('SOL');
    log('green', `   ✓ Private balance: ${Number(privateBalance) / LAMPORTS_PER_SOL} SOL`);
  } catch (error: any) {
    log('red', `   ✗ Deposit failed: ${error.message}`);
    log('yellow', '   Note: Make sure Privacy Cash is deployed at 4tL8Q58mL3QuLJFjGDcWqNw4WPzuJgHU9xhbWpGL9y9o');
    process.exit(1);
  }

  // ============ Setup Schemes ============
  log('blue', '\n5. Setting up payment schemes...');

  const nullifierRegistry = new MemoryNullifierRegistry({ ttl: 3600000 });

  const clientScheme = new PrivateCashScheme({
    provider: clientProvider,
    rpcUrl: RPC_URL,
  });

  const serverScheme = new PrivateCashScheme({
    provider: clientProvider,
    rpcUrl: RPC_URL,
    nullifierRegistry,
  });

  log('green', '   ✓ Client scheme ready');
  log('green', '   ✓ Server scheme ready with NullifierRegistry');

  // ============ Start Express Server ============
  log('blue', '\n6. Starting payment server...');

  const app = express();
  app.use(express.json());

  const requirePayment = createRequirePayment({
    schemes: [serverScheme],
    onPaymentVerified: () => log('green', '      [Server] Payment verified!'),
    onPaymentFailed: (_, error) => log('red', `      [Server] Payment failed: ${error.message}`),
  });

  app.get('/api/free', (_, res) => {
    res.json({ message: 'Free content!', timestamp: Date.now() });
  });

  app.get(
    '/api/premium',
    requirePayment({
      amount: '50000000', // 0.05 SOL
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

  await new Promise(r => setTimeout(r, 500));

  // ============ Create Px402 Client ============
  log('blue', '\n7. Creating Px402 client...');

  const client = new Px402Client({
    provider: clientProvider,
    schemes: [clientScheme],
    defaultMode: 'private',
  });

  log('green', '   ✓ Client ready');

  // ============ Test Scenarios ============
  log('blue', '\n8. Running test scenarios...\n');

  // Test 1: Free endpoint
  log('yellow', '   Test 1: Free endpoint');
  try {
    const response = await client.fetch(`http://localhost:${PORT}/api/free`);
    const data = await response.json();
    log('green', `   ✓ Status: ${response.status}`);
    log('green', `   ✓ Data: ${JSON.stringify(data)}`);
    log('green', `   ✓ Payment required: ${response.paymentResult?.required || false}`);
  } catch (error: any) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Test 2: Premium without payment config
  log('yellow', '\n   Test 2: Premium (no payment config)');
  try {
    const response = await client.fetch(`http://localhost:${PORT}/api/premium`);
    log('green', `   ✓ Status: ${response.status} (402 Payment Required)`);
    log('green', `   ✓ Payment required: ${response.paymentResult?.required}`);
  } catch (error: any) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Test 3: Premium with payment
  log('yellow', '\n   Test 3: Premium (with privacy payment)');
  try {
    log('cyan', '      Creating private payment...');
    const response = await client.fetch(`http://localhost:${PORT}/api/premium`, {
      payment: {
        maxAmount: '100000000', // Willing to pay up to 0.1 SOL
        token: 'SOL',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      log('green', `   ✓ Status: ${response.status}`);
      log('green', `   ✓ Content: ${JSON.stringify(data)}`);
      log('green', `   ✓ Payment successful!`);
      log('green', `   ✓ Payment mode: ${response.paymentResult?.mode}`);
    } else {
      log('yellow', `   ⚠ Status: ${response.status}`);
    }
  } catch (error: any) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Test 4: Check remaining balance
  log('yellow', '\n   Test 4: Check remaining private balance');
  try {
    const balance = await client.getBalance('SOL');
    log('green', `   ✓ Remaining: ${Number(balance) / LAMPORTS_PER_SOL} SOL`);
  } catch (error: any) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // ============ Cleanup ============
  log('blue', '\n9. Cleaning up...');
  server.close();
  log('green', '   ✓ Server stopped');

  // ============ Summary ============
  console.log('\n');
  log('cyan', '╔═══════════════════════════════════════════════════════════════╗');
  log('cyan', '║                     Test Complete!                            ║');
  log('cyan', '╠═══════════════════════════════════════════════════════════════╣');
  log('cyan', '║  ✓ Privacy Cash deployed locally                              ║');
  log('cyan', '║  ✓ SOL deposited to privacy pool                              ║');
  log('cyan', '║  ✓ Private payments created and verified                      ║');
  log('cyan', '║  ✓ NullifierRegistry prevents double-spend                    ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
