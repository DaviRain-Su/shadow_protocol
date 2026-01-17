# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-17

### Added

#### @px402/core
- Core type definitions (`ChainId`, `TokenId`, `DepositNote`, `PaymentProof`, `StealthAddress`)
- `PrivacyProvider` interface for chain-agnostic privacy payment providers
- `BasePrivacyProvider` abstract class with common functionality
- `X402Scheme` interface compatible with x402 protocol specification
- `BaseX402Scheme` abstract class for building payment schemes
- `SchemeRegistry` for managing multiple payment schemes
- `NoteStorage` interface and `MemoryNoteStorage` implementation
- `NoteManager` for deposit note management
- Note serialization/deserialization utilities
- `Px402Error` error class with error codes
- 51 unit tests

#### @px402/solana
- `PrivacyCashAdapter` wrapping Privacy Cash SDK
- Mock SDK implementation for development/testing
- `SolanaPrivacyProvider` implementing `PrivacyProvider` interface
- `PrivateCashScheme` implementing `private-exact` x402 scheme
- Stealth address generation
- Note import/export functionality
- 28 unit tests

### Technical
- pnpm monorepo structure
- TypeScript 5.7+ with strict mode
- ESM-only package output
- tsup for building
- vitest for testing
- ESLint + Prettier configuration

## [0.2.0] - 2026-01-17

### Added

#### @px402/client
- `Px402Client` class for automatic 402 payment handling
- `Px402Error` custom error class with error codes
- HTTP 402 parsing utilities (`parsePaymentRequirements`, `is402Response`)
- Payment header creation (`createPaymentHeader`, `createPaymentHeaderBase64`)
- Payment requirements validation
- Support for both JSON and Base64 encoded payment headers
- Dual payment mode support (public/private)
- 31 unit tests

#### @px402/server
- `PaymentVerifier` class for payment verification
- `px402Middleware` Express middleware for automatic payment verification
- `requirePayment` middleware for route-level payment requirements
- `createRequirePayment` factory for pre-configured middleware
- `send402Response` helper for sending 402 responses
- `createPaymentRequirements` helper for creating payment requirements
- Support for multiple payment schemes
- Callbacks for payment events (onPaymentVerified, onPaymentFailed)
- 31 unit tests

#### examples/basic
- `server.ts` - Express server with paid endpoints example
- `client.ts` - Px402Client usage example
- `demo.ts` - In-memory demonstration script

### Technical
- 62 new tests (141 total)
- TypeScript strict mode compliance
- ESM-only packages

## [0.3.0] - 2026-01-17

### Added

#### @px402/relay
- `RelayNode` class for running relay nodes
- `RelayTransport` for client-side relay routing
- `PeerManager` for peer discovery and management
- `Router` for route selection with 4 strategies (lowest-fee, highest-reputation, balanced, random)
- `IncentiveManager` for fee calculation and payment verification
- Message protocol with NaCl box encryption (curve25519-xsalsa20-poly1305)
- Onion routing support for multi-hop anonymity
- Node reputation and heartbeat system
- 125 unit tests

### Technical
- Uses tweetnacl for cryptographic operations
- Supports base64 and JSON message encoding
- Event-driven architecture for relay events

## [0.3.1] - 2026-01-17

### Added

#### @px402/server
- `NullifierRegistry` interface for double-spend prevention
- `MemoryNullifierRegistry` implementation with TTL and max entries support
- 14 new tests for nullifier tracking

#### @px402/solana
- Nullifier integration in `PrivateCashScheme` for double-spend prevention
- Relayer fee support in payment flow
- `SchemeRelayerConfig` for default relayer configuration
- Requirements-level relayer override via `extra.relayer`
- 19 new integration tests (47 total)

#### @px402/client
- `Transport` interface for custom HTTP routing
- Relay transport integration in `Px402Client`
- `RelayOptions` for per-request relay configuration

#### @px402/core
- `relayer` field in `GenerateProofParams` for anonymous transactions

### Fixed
- Payment verification now properly validates recipient address
- Double-spend attacks prevented via nullifier tracking
- Sequential payments now work correctly with unique nullifiers

### Technical
- 299 total tests across all packages
- End-to-end integration tests for complete payment flow

## [Unreleased]

### Planned
- Phase 4: EVM extension (Base/Ethereum)
- Phase 5: Multi-chain unification
