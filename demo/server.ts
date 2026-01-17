/**
 * Px402 Demo Server
 *
 * Combined demo with:
 * - Static HTML frontend
 * - Payment API endpoints
 * - Relayer service
 *
 * Run: npx tsx demo/server.ts
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createRequirePayment,
  MemoryNullifierRegistry,
} from '@px402/server';
import { PrivateCashScheme } from '@px402/solana';
import { PrivacyCashRelayer } from '@px402/relayer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3404;
const RELAYER_PORT = 3501;
const RPC_URL = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
const PROGRAM_ID = process.env.PRIVACY_CASH_PROGRAM_ID || '4tL8Q58mL3QuLJFjGDcWqNw4WPzuJgHU9xhbWpGL9y9o';

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(color: keyof typeof colors, ...args: unknown[]) {
  console.log(colors[color], ...args, colors.reset);
}

async function main() {
  console.log('\n');
  log('cyan', '╔═══════════════════════════════════════════════════════════════╗');
  log('cyan', '║                    Px402 Demo Server                          ║');
  log('cyan', '║          Privacy Payments for HTTP 402 on Solana              ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');

  // ============ Setup Wallets ============
  const serverWallet = Keypair.generate();
  const relayerWallet = Keypair.generate();

  log('blue', 'Wallets:');
  log('cyan', `  Server:  ${serverWallet.publicKey.toBase58()}`);
  log('cyan', `  Relayer: ${relayerWallet.publicKey.toBase58()}`);

  // ============ Start Relayer ============
  log('blue', '\nStarting Relayer service...');

  const relayer = new PrivacyCashRelayer({
    rpcUrl: RPC_URL,
    programId: PROGRAM_ID,
    secretKey: relayerWallet.secretKey,
    fee: BigInt(1000000),
    network: 'localnet',
  });

  await relayer.initialize();

  // Relayer API
  const relayerApp = express();
  relayerApp.use(express.json());
  relayerApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  relayerApp.get('/', (_, res) => {
    res.json({
      name: 'Px402 Relayer',
      version: '0.1.0',
      network: 'localnet',
    });
  });

  relayerApp.get('/stats', (_, res) => {
    const stats = relayer.getStats();
    res.json({
      ...stats,
      merkleRoot: relayer.getMerkleRoot(),
    });
  });

  relayerApp.get('/merkle-root', (_, res) => {
    res.json({
      root: relayer.getMerkleRoot(),
      leafCount: relayer.getIndexer().getLeafCount(),
    });
  });

  relayerApp.post('/commitment', (req, res) => {
    const { commitment } = req.body;
    if (!commitment) {
      return res.status(400).json({ error: 'Missing commitment' });
    }
    const leafIndex = relayer.getIndexer().addCommitment(commitment);
    res.json({
      success: true,
      commitment,
      leafIndex,
      merkleRoot: relayer.getMerkleRoot(),
    });
  });

  relayerApp.post('/withdraw', (req, res) => {
    const { nullifier, recipient } = req.body;
    if (!nullifier || !recipient) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (relayer.isNullifierUsed(nullifier)) {
      return res.status(400).json({
        success: false,
        error: 'Double-spend detected',
      });
    }
    relayer.getIndexer().registerNullifier(nullifier, `tx_${Date.now()}`);
    res.json({ success: true, signature: `relayer_${Date.now()}` });
  });

  relayerApp.listen(RELAYER_PORT, () => {
    log('green', `  ✓ Relayer running at http://localhost:${RELAYER_PORT}`);
  });

  // ============ Setup Payment Scheme ============
  const nullifierRegistry = new MemoryNullifierRegistry({ ttl: 3600000 });

  // Mock provider for demo
  const mockProvider = {
    chainId: 'solana',
    initialize: async () => {},
    deposit: async () => ({ txHash: '', note: {} }),
    withdraw: async () => ({ txHash: '', nullifierHash: '', recipient: '' }),
    getPrivateBalance: async () => BigInt(0),
    getPools: async () => [],
    generatePaymentProof: async (params: any) => ({
      chainId: 'solana',
      proofType: 'transfer',
      proof: `demo_proof_${Date.now()}`,
      metadata: { amount: params.amount, token: 'SOL', timestamp: Date.now() },
    }),
    verifyPaymentProof: async () => true,
    generateStealthAddress: async () => ({ address: '', ephemeralPubKey: '' }),
    getNotes: async () => [],
    getUnspentNotes: async () => [],
    saveNote: async () => {},
    deleteNote: async () => {},
    isNoteSpent: async () => false,
    findNoteForPayment: async () => undefined,
  };

  const serverScheme = new PrivateCashScheme({
    provider: mockProvider as any,
    rpcUrl: RPC_URL,
    nullifierRegistry,
    skipOnChainVerification: true,
  });

  // ============ Payment API ============
  log('blue', '\nStarting Payment API...');

  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Payment');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Serve static files
  app.use(express.static(__dirname));

  const requirePayment = createRequirePayment({
    schemes: [serverScheme],
    onPaymentVerified: (req) => {
      log('green', `  ✓ Payment verified for ${req.url}`);
    },
    onPaymentFailed: (req, error) => {
      log('yellow', `  ⚠ Payment failed for ${req.url}: ${error.message}`);
    },
  });

  // Free endpoint
  app.get('/api/free', (_, res) => {
    res.json({
      message: 'Free content!',
      timestamp: Date.now(),
    });
  });

  // Premium endpoints
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

  app.get(
    '/api/ai-inference',
    requirePayment({
      amount: '100000000', // 0.1 SOL
      token: 'SOL',
      recipient: serverWallet.publicKey.toBase58(),
      description: 'AI inference request',
    }),
    (_, res) => {
      res.json({
        message: 'AI Inference Complete',
        result: 'Sentiment: Positive (0.92)',
        model: 'gpt-4-turbo',
        tokens: 150,
      });
    }
  );

  // Relayer info
  app.get('/api/relayer', (_, res) => {
    res.json({
      url: `http://localhost:${RELAYER_PORT}`,
      fee: '1000000',
      publicKey: relayerWallet.publicKey.toBase58(),
    });
  });

  app.listen(PORT, () => {
    log('green', `  ✓ Payment API running at http://localhost:${PORT}`);
  });

  // ============ Ready ============
  console.log('\n');
  log('cyan', '╔═══════════════════════════════════════════════════════════════╗');
  log('cyan', '║                     Demo Ready!                               ║');
  log('cyan', '╠═══════════════════════════════════════════════════════════════╣');
  log('cyan', `║  Frontend:  http://localhost:${PORT}/index.html                    ║`);
  log('cyan', `║  API:       http://localhost:${PORT}/api/*                         ║`);
  log('cyan', `║  Relayer:   http://localhost:${RELAYER_PORT}/                           ║`);
  log('cyan', '╠═══════════════════════════════════════════════════════════════╣');
  log('cyan', '║  Endpoints:                                                   ║');
  log('cyan', '║    GET /api/free        - Free (no payment)                   ║');
  log('cyan', '║    GET /api/premium     - 0.05 SOL (private payment)          ║');
  log('cyan', '║    GET /api/ai-inference - 0.1 SOL (private payment)          ║');
  log('cyan', '╚═══════════════════════════════════════════════════════════════╝\n');

  log('yellow', 'Press Ctrl+C to stop\n');
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

main().catch(console.error);
