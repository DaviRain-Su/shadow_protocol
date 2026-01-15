# Shadow Protocol Roadmap

## v0.1.0 - JoinSplit Alignment (Privacy Cash transaction2)

- Status: ✅ Completed
- Scope:
  - JoinSplit public inputs and Groth16 verifier alignment
  - Merkle tree depth set to 26
  - Documentation updates for transaction2 flow

## v0.2.0 - Privacy Pool Instructions

- Status: ⏳ Planned
- Scope:
  - Initialize/Deposit/Withdraw instruction wiring
  - Nullifier enforcement and output commitment insertion
  - Basic integration tests

## v0.1.1 - Jupiter CPI Adapter

- Status: ✅ Completed
- Scope:
  - Replace DFlow adapter design with Jupiter V6 sharedAccountsRoute
  - Document CPI accounts and instruction parameters

## v0.1.2 - Jupiter CPI Skeleton

- Status: ✅ Completed
- Scope:
  - Implement sharedAccountsRoute CPI helper in Zig
  - Export CPI module from library

## v0.1.3 - Jupiter Swap Flow Skeleton

- Status: ✅ Completed
- Scope:
  - Add sharedAccountsRoute encoder
  - Wire swap instruction handler to Jupiter CPI

## v0.1.4 - Jupiter RoutePlan Encoding

- Status: ✅ Completed
- Scope:
  - Encode Swap/Side and RoutePlanStep (Borsh)
  - Build sharedAccountsRoute data from steps

## v0.1.5 - Anchor Program Rewrite

- Status: ✅ Completed
- Scope:
  - Rewrite privacy_pool to Anchor Context/Accounts
  - Anchor ProgramEntry dispatch

## v0.1.6 - Swap Hardening & Observability

- Status: ✅ Completed
- Scope:
  - Store pool PDA bump and validate PDA at runtime
  - Enforce swap token account/mint constraints and vault PDA usage
  - Validate token_2022 program and platform fee account
  - Emit events for core instructions
  - Add swap/vault and route plan boundary tests
  - Document swap visibility boundary

## v0.1.7 - Error Codes & Swap Negative Tests

- Status: ✅ Completed
- Scope:
  - Replace InvalidInstructionData with explicit PrivacyPoolError variants
  - Add swap validation tests for authority id, token_2022, and platform fee account
