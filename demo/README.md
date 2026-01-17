# Px402 Demo - Privacy Payments for HTTP 402 on Solana

Interactive demonstration of privacy-preserving micropayments using the HTTP 402 Payment Required protocol.

## Quick Start

```bash
# From project root
pnpm install
pnpm --filter @px402/demo start
```

Then open: http://localhost:3404/index.html

## Architecture

```
+--------+    +----------+    +---------------+    +----------+
| Client | -> | Relayer  | -> | Privacy Cash  | -> | Merchant |
+--------+    +----------+    | (ZK Contract) |    +----------+
                              +---------------+
                                     |
                              +------+------+
                              |  Solana     |
                              |  Blockchain |
                              +-------------+
```

## Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `/api/free` | Free | Public content |
| `/api/premium` | 0.05 SOL | Premium content |
| `/api/ai-inference` | 0.1 SOL | AI model inference |

## How It Works

1. **Client requests** protected endpoint
2. **Server returns** HTTP 402 with payment requirements
3. **Client creates** ZK proof of payment (privacy-preserving)
4. **Relayer submits** transaction anonymously
5. **Server verifies** proof and grants access

## Privacy Features

- Zero-knowledge proofs hide payment source
- Relayer anonymizes transaction origin
- Nullifiers prevent double-spending
- No link between deposit and withdrawal

## Services

- **Frontend**: http://localhost:3404 - Interactive demo UI
- **Payment API**: http://localhost:3404/api/* - Protected endpoints
- **Relayer**: http://localhost:3501 - Anonymous transaction relay

## Demo Flow

1. Click "Deposit 0.5 SOL to Privacy Pool"
2. Click "Call" on any premium endpoint
3. Watch the privacy payment flow in the transaction log
4. Verify balance updates and nullifier tracking

## Technical Details

- **Network**: Solana (localnet/devnet)
- **Program ID**: 4tL8Q58mL3QuLJFjGDcWqNw4WPzuJgHU9xhbWpGL9y9o
- **Protocol**: HTTP 402 Payment Required (x402)
- **Privacy**: ZK-SNARK based private payments
