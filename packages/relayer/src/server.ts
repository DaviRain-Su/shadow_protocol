/**
 * @px402/relayer - Express Server
 *
 * REST API for Privacy Cash relayer/indexer service.
 *
 * Endpoints:
 * - GET  /                     - Health check
 * - GET  /stats                - Relayer statistics
 * - GET  /merkle-root          - Current Merkle root
 * - GET  /merkle-proof/:commitment - Get Merkle proof
 * - GET  /nullifier/:hash      - Check if nullifier is used
 * - GET  /status/:txid         - Transaction status
 * - POST /deposit              - Submit deposit
 * - POST /withdraw             - Submit withdrawal
 */

import express from 'express';
import { Keypair } from '@solana/web3.js';
import { PrivacyCashRelayer } from './relayer.js';
import type { DepositRequest, WithdrawRequest } from './types.js';

// ============ Configuration ============

const PORT = parseInt(process.env.RELAYER_PORT || '3500', 10);
const RPC_URL = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
const PROGRAM_ID = process.env.PRIVACY_CASH_PROGRAM_ID || '4tL8Q58mL3QuLJFjGDcWqNw4WPzuJgHU9xhbWpGL9y9o';
const NETWORK = (process.env.SOLANA_NETWORK || 'localnet') as 'mainnet' | 'devnet' | 'testnet' | 'localnet';
const RELAYER_FEE = BigInt(process.env.RELAYER_FEE || '1000000'); // 0.001 SOL

// ============ Keypair ============

function loadOrGenerateKeypair(): Uint8Array {
  const secretKeyEnv = process.env.RELAYER_SECRET_KEY;
  if (secretKeyEnv) {
    try {
      return new Uint8Array(JSON.parse(secretKeyEnv));
    } catch {
      console.warn('[Server] Invalid RELAYER_SECRET_KEY, generating new keypair');
    }
  }

  // Generate new keypair for development
  const keypair = Keypair.generate();
  console.log('[Server] Generated relayer keypair:', keypair.publicKey.toBase58());
  console.log('[Server] Fund this address with SOL for transaction fees');
  return keypair.secretKey;
}

// ============ Express App ============

const app = express();
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============ Initialize Relayer ============

let relayer: PrivacyCashRelayer;

async function initRelayer(): Promise<void> {
  const secretKey = loadOrGenerateKeypair();

  relayer = new PrivacyCashRelayer({
    rpcUrl: RPC_URL,
    programId: PROGRAM_ID,
    secretKey,
    fee: RELAYER_FEE,
    network: NETWORK,
  });

  await relayer.initialize();
}

// ============ Routes ============

/**
 * Health check / info
 */
app.get('/', (req, res) => {
  const stats = relayer.getStats();
  res.json({
    name: 'Px402 Privacy Cash Relayer',
    version: '0.1.0',
    network: NETWORK,
    programId: PROGRAM_ID,
    relayerPubkey: stats.relayerPubkey,
    fee: stats.fee,
    endpoints: [
      'GET /',
      'GET /stats',
      'GET /merkle-root',
      'GET /merkle-proof/:commitment',
      'GET /nullifier/:hash',
      'GET /status/:txid',
      'POST /deposit',
      'POST /withdraw',
    ],
  });
});

/**
 * Get relayer statistics
 */
app.get('/stats', (req, res) => {
  const stats = relayer.getStats();
  const indexerStats = relayer.getIndexer().getStats();
  res.json({
    ...stats,
    ...indexerStats,
    merkleRoot: relayer.getMerkleRoot(),
  });
});

/**
 * Get current Merkle root
 */
app.get('/merkle-root', (req, res) => {
  res.json({
    root: relayer.getMerkleRoot(),
    leafCount: relayer.getIndexer().getLeafCount(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get Merkle proof for commitment
 */
app.get('/merkle-proof/:commitment', (req, res) => {
  const { commitment } = req.params;
  const proof = relayer.getMerkleProof(commitment);

  if (!proof) {
    return res.status(404).json({
      error: 'Commitment not found in Merkle tree',
    });
  }

  res.json({
    commitment,
    proof: proof.path,
    indices: proof.indices,
    root: relayer.getMerkleRoot(),
  });
});

/**
 * Check if nullifier is used
 */
app.get('/nullifier/:hash', (req, res) => {
  const { hash } = req.params;
  const isUsed = relayer.isNullifierUsed(hash);

  res.json({
    nullifier: hash,
    used: isUsed,
  });
});

/**
 * Get transaction status
 */
app.get('/status/:txid', async (req, res) => {
  const { txid } = req.params;
  const status = await relayer.getTransactionStatus(txid);
  res.json(status);
});

/**
 * Submit deposit
 */
app.post('/deposit', async (req, res) => {
  try {
    const { commitment, amount, assetType, userPubkey } = req.body;

    if (!commitment) {
      return res.status(400).json({ error: 'Missing commitment' });
    }

    const request: DepositRequest = {
      commitment,
      amount: BigInt(amount || 0),
      assetType: assetType || 0,
      userPubkey: userPubkey || '',
    };

    const result = await relayer.deposit(request);

    if (result.success) {
      res.json({
        success: true,
        signature: result.signature,
        explorerUrl: result.explorerUrl,
        merkleRoot: relayer.getMerkleRoot(),
        leafIndex: relayer.getIndexer().getLeafCount() - 1,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Submit withdrawal
 */
app.post('/withdraw', async (req, res) => {
  try {
    const { proof, root, nullifier, recipient, amount, assetType } = req.body;

    if (!nullifier || !recipient) {
      return res.status(400).json({
        error: 'Missing required fields (nullifier, recipient)',
      });
    }

    const request: WithdrawRequest = {
      proof,
      root: root || relayer.getMerkleRoot(),
      nullifier,
      recipient,
      amount: BigInt(amount || 0),
      assetType: assetType || 0,
    };

    const result = await relayer.withdraw(request);

    if (result.success) {
      res.json({
        success: true,
        signature: result.signature,
        explorerUrl: result.explorerUrl,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Add commitment manually (for testing)
 */
app.post('/commitment', (req, res) => {
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

// ============ Start Server ============

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          Px402 Privacy Cash Relayer/Indexer                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`Network:    ${NETWORK}`);
  console.log(`RPC URL:    ${RPC_URL}`);
  console.log(`Program ID: ${PROGRAM_ID}`);
  console.log(`Fee:        ${RELAYER_FEE} lamports\n`);

  try {
    await initRelayer();

    app.listen(PORT, () => {
      console.log(`\n[Server] Relayer API running at http://localhost:${PORT}`);
      console.log('[Server] Ready to process transactions\n');
    });
  } catch (error) {
    console.error('[Server] Failed to initialize:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  relayer?.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  relayer?.stop();
  process.exit(0);
});

main().catch(console.error);
