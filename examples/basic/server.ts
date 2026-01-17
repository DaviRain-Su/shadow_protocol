/**
 * Px402 Server Example
 *
 * Demonstrates how to set up an Express server with x402 payment endpoints.
 *
 * Run with: pnpm --filter @px402/example-basic server
 */

import express from 'express';
import { Keypair } from '@solana/web3.js';
import {
  px402Middleware,
  createRequirePayment,
  send402Response,
  createPaymentRequirements,
} from '@px402/server';
import { SolanaPrivacyProvider, PrivateCashScheme } from '@px402/solana';

// Configuration
const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || Keypair.generate().publicKey.toBase58();

async function main() {
  console.log('Setting up Px402 server...');

  // Create provider and scheme
  const wallet = Keypair.generate(); // Use your actual wallet in production
  const provider = new SolanaPrivacyProvider({
    rpcUrl: RPC_URL,
    wallet,
  });
  await provider.initialize();

  const scheme = new PrivateCashScheme({
    provider,
    rpcUrl: RPC_URL,
  });

  // Create Express app
  const app = express();
  app.use(express.json());

  // Create payment middleware with schemes
  const requirePayment = createRequirePayment({
    schemes: [scheme],
    onPaymentVerified: (req, result) => {
      console.log('Payment verified:', result);
    },
    onPaymentFailed: (req, error) => {
      console.log('Payment failed:', error.message);
    },
  });

  // Health check (free)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Free endpoint
  app.get('/api/free', (req, res) => {
    res.json({
      message: 'This is free content!',
      data: { free: true },
    });
  });

  // Premium endpoint - requires payment
  app.get(
    '/api/premium',
    requirePayment({
      amount: '10000000', // 0.01 SOL in lamports
      token: 'SOL',
      recipient: WALLET_ADDRESS,
      description: 'Access to premium content',
    }),
    (req, res) => {
      res.json({
        message: 'Welcome to premium content!',
        data: {
          premium: true,
          secret: 'The answer is 42',
        },
        paymentResult: req.paymentResult,
      });
    }
  );

  // AI inference endpoint - requires payment
  app.post(
    '/api/inference',
    requirePayment({
      amount: '5000000', // 0.005 SOL
      token: 'SOL',
      recipient: WALLET_ADDRESS,
      description: 'AI inference request',
    }),
    (req, res) => {
      const { prompt } = req.body || {};
      res.json({
        result: `AI response to: ${prompt || 'empty prompt'}`,
        model: 'px402-demo-v1',
        paymentResult: req.paymentResult,
      });
    }
  );

  // Manual 402 response example
  app.get('/api/manual-402', (req, res) => {
    const requirements = createPaymentRequirements({
      amount: '1000000',
      token: 'SOL',
      recipient: WALLET_ADDRESS,
      description: 'Manual 402 example',
    });
    send402Response(res, requirements);
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    Px402 Demo Server                      ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                 ║
║  Recipient wallet:  ${WALLET_ADDRESS.slice(0, 20)}...       ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  GET  /health       - Health check (free)                 ║
║  GET  /api/free     - Free content                        ║
║  GET  /api/premium  - Premium content (0.01 SOL)          ║
║  POST /api/inference - AI inference (0.005 SOL)           ║
║  GET  /api/manual-402 - Manual 402 response               ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch(console.error);
