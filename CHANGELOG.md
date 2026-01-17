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

## [Unreleased]

### Planned
- Phase 2: Agent SDK (Express/Fastify middleware, HTTP client)
- Phase 3: Privacy relay network
- Phase 4: EVM extension (Base/Ethereum)
- Phase 5: Multi-chain unification
