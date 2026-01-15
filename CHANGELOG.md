# Changelog

## Unreleased

- Align Groth16 verifier and public inputs with Privacy Cash transaction2 JoinSplit
- Update Merkle tree default depth to 26
- Refresh technical documentation for transaction2 proof flow
- Replace DFlow adapter design with Jupiter V6 sharedAccountsRoute
- Add Jupiter V6 sharedAccountsRoute CPI helper skeleton
- Add Jupiter sharedAccountsRoute data encoder and swap instruction skeleton
- Add Borsh encoding for Jupiter RoutePlanStep and Swap enums
- Rewrite privacy_pool program to Anchor Context/Accounts
- Store pool PDA bump at initialization and validate PDA on entry
- Enforce swap token account mint/owner constraints and vault PDA usage
- Validate token_2022 program id and platform fee account on swap
- Emit Anchor events for initialize/deposit/withdraw/pause/unpause/swap
- Add swap vault validation tests and route plan encoding boundary tests
- Document swap visibility and privacy boundary
- Introduce explicit PrivacyPoolError variants for instruction validation
- Add swap validation tests for authority id, token_2022, and platform fee account
