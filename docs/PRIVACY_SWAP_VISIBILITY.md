## Private Swap Visibility (Pool + Jupiter CPI)

ASCII Diagram (What observers can see)

```
User Wallet
  |  deposit(commitment)
  v
Pool Program (PDA authority)
  |  vault PDA holds pooled funds
  |  emits deposit/withdraw/swap logs
  v
Jupiter CPI (sharedAccountsRoute)
  |  route plan + accounts are visible
  v
AMM Programs / Token Accounts
```

### Visible On-Chain

- deposit/withdraw/swap instructions and logs
- Jupiter CPI call + route plan (AMM path, split, params)
- All involved accounts (vault PDA, token accounts, mints, program authority)
- Token amount changes in vault and destination accounts

### Not Directly Visible

- Which specific user caused a swap
- A direct link between a user's deposit and a later swap
- Internal mapping from commitments to swap actions

### Key Point

Observers see "the pool swapped", not "which user swapped".
