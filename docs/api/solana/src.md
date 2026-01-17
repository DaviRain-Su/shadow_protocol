[**Px402 API Documentation v0.1.0**](../index.md)

***

[Px402 API Documentation](../index.md) / solana/src

# solana/src

## Classes

### DirectPrivacyCashAdapter

Defined in: [solana/src/direct-adapter.ts:225](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L225)

Direct Privacy Cash Adapter

Interacts directly with the Privacy Cash contract using Anchor,
without requiring the indexer/relayer service.

#### Constructors

##### Constructor

> **new DirectPrivacyCashAdapter**(`config`): [`DirectPrivacyCashAdapter`](#directprivacycashadapter)

Defined in: [solana/src/direct-adapter.ts:240](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L240)

###### Parameters

###### config

[`DirectAdapterConfig`](#directadapterconfig)

###### Returns

[`DirectPrivacyCashAdapter`](#directprivacycashadapter)

#### Methods

##### deposit()

> **deposit**(`amount`): `Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

Defined in: [solana/src/direct-adapter.ts:284](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L284)

Deposit SOL into privacy pool

Note: Full ZK deposit requires circuit artifacts. This is a simplified
implementation for local testing that simulates the deposit.

###### Parameters

###### amount

`bigint`

###### Returns

`Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

##### depositSPL()

> **depositSPL**(`_mint`, `amount`): `Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

Defined in: [solana/src/direct-adapter.ts:346](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L346)

Deposit SPL token (routes to SOL for now)

###### Parameters

###### \_mint

`string`

###### amount

`bigint`

###### Returns

`Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

##### getConnection()

> **getConnection**(): `Connection`

Defined in: [solana/src/direct-adapter.ts:466](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L466)

Get connection instance

###### Returns

`Connection`

##### getMerkleRoot()

> **getMerkleRoot**(): `string`

Defined in: [solana/src/direct-adapter.ts:480](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L480)

Get merkle root

###### Returns

`string`

##### getNotes()

> **getNotes**(): `UtxoNote`[]

Defined in: [solana/src/direct-adapter.ts:473](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L473)

Get all notes

###### Returns

`UtxoNote`[]

##### getPools()

> **getPools**(): `Promise`\<[`PrivacyCashPoolInfo`](#privacycashpoolinfo)[]\>

Defined in: [solana/src/direct-adapter.ts:445](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L445)

Get available pools

###### Returns

`Promise`\<[`PrivacyCashPoolInfo`](#privacycashpoolinfo)[]\>

##### getPrivateBalance()

> **getPrivateBalance**(): `Promise`\<`bigint`\>

Defined in: [solana/src/direct-adapter.ts:425](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L425)

Get private balance for SOL

###### Returns

`Promise`\<`bigint`\>

##### getPrivateBalanceSpl()

> **getPrivateBalanceSpl**(`_mint`): `Promise`\<`bigint`\>

Defined in: [solana/src/direct-adapter.ts:438](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L438)

Get private balance for SPL token

###### Parameters

###### \_mint

`string`

###### Returns

`Promise`\<`bigint`\>

##### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [solana/src/direct-adapter.ts:254](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L254)

Initialize the adapter

###### Returns

`Promise`\<`void`\>

##### isNullifierUsed()

> **isNullifierUsed**(`nullifierHash`): `Promise`\<`boolean`\>

Defined in: [solana/src/direct-adapter.ts:459](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L459)

Check if nullifier is used

###### Parameters

###### nullifierHash

`string`

###### Returns

`Promise`\<`boolean`\>

##### withdraw()

> **withdraw**(`params`): `Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

Defined in: [solana/src/direct-adapter.ts:355](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L355)

Withdraw from privacy pool

###### Parameters

###### params

###### commitment

`string`

###### leafIndex

`number`

###### nullifier

`string`

###### recipient

`string`

###### relayer?

\{ `fee`: `bigint`; `url`: `string`; \}

###### relayer.fee

`bigint`

###### relayer.url

`string`

###### secret

`string`

###### Returns

`Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

##### withdrawSPL()

> **withdrawSPL**(`_mint`, `params`): `Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

Defined in: [solana/src/direct-adapter.ts:408](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L408)

Withdraw SPL token

###### Parameters

###### \_mint

`string`

###### params

###### commitment

`string`

###### leafIndex

`number`

###### nullifier

`string`

###### recipient

`string`

###### relayer?

\{ `fee`: `bigint`; `url`: `string`; \}

###### relayer.fee

`bigint`

###### relayer.url

`string`

###### secret

`string`

###### Returns

`Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

***

### PrivacyCashAdapter

Defined in: [solana/src/privacy-cash.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L71)

Privacy Cash SDK Adapter
Provides a clean interface to the Privacy Cash SDK

#### Constructors

##### Constructor

> **new PrivacyCashAdapter**(`config`): [`PrivacyCashAdapter`](#privacycashadapter)

Defined in: [solana/src/privacy-cash.ts:76](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L76)

###### Parameters

###### config

[`PrivacyCashConfig`](#privacycashconfig)

###### Returns

[`PrivacyCashAdapter`](#privacycashadapter)

#### Methods

##### deposit()

> **deposit**(`token`, `amount`): `Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

Defined in: [solana/src/privacy-cash.ts:169](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L169)

Deposit into privacy pool
Routes to SOL or SPL based on token

###### Parameters

###### token

`string`

###### amount

`bigint`

###### Returns

`Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

##### depositSol()

> **depositSol**(`amount`): `Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

Defined in: [solana/src/privacy-cash.ts:126](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L126)

Deposit SOL into privacy pool

###### Parameters

###### amount

`bigint`

###### Returns

`Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

##### depositSpl()

> **depositSpl**(`mint`, `amount`): `Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

Defined in: [solana/src/privacy-cash.ts:146](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L146)

Deposit SPL token into privacy pool

###### Parameters

###### mint

`string`

###### amount

`bigint`

###### Returns

`Promise`\<[`PrivacyCashDepositResult`](#privacycashdepositresult)\>

##### getConnection()

> **getConnection**(): `Connection`

Defined in: [solana/src/privacy-cash.ts:298](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L298)

Get the connection instance

###### Returns

`Connection`

##### getPools()

> **getPools**(): `Promise`\<[`PrivacyCashPoolInfo`](#privacycashpoolinfo)[]\>

Defined in: [solana/src/privacy-cash.ts:280](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L280)

Get available pools

###### Returns

`Promise`\<[`PrivacyCashPoolInfo`](#privacycashpoolinfo)[]\>

##### getPrivateBalance()

> **getPrivateBalance**(`token`): `Promise`\<`bigint`\>

Defined in: [solana/src/privacy-cash.ts:270](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L270)

Get private balance for token

###### Parameters

###### token

`string`

###### Returns

`Promise`\<`bigint`\>

##### getPrivateBalanceSol()

> **getPrivateBalanceSol**(): `Promise`\<`bigint`\>

Defined in: [solana/src/privacy-cash.ts:252](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L252)

Get private balance for SOL

###### Returns

`Promise`\<`bigint`\>

##### getPrivateBalanceSpl()

> **getPrivateBalanceSpl**(`mint`): `Promise`\<`bigint`\>

Defined in: [solana/src/privacy-cash.ts:261](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L261)

Get private balance for SPL token

###### Parameters

###### mint

`string`

###### Returns

`Promise`\<`bigint`\>

##### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [solana/src/privacy-cash.ts:84](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L84)

Initialize the adapter
Must be called before using other methods

###### Returns

`Promise`\<`void`\>

##### isNullifierUsed()

> **isNullifierUsed**(`nullifierHash`): `Promise`\<`boolean`\>

Defined in: [solana/src/privacy-cash.ts:289](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L289)

Check if a nullifier has been used (note spent)

###### Parameters

###### nullifierHash

`string`

###### Returns

`Promise`\<`boolean`\>

##### withdraw()

> **withdraw**(`note`, `recipient`, `relayer?`): `Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

Defined in: [solana/src/privacy-cash.ts:238](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L238)

Withdraw from privacy pool

###### Parameters

###### note

`DepositNote`

###### recipient

`string`

###### relayer?

`RelayerConfig`

###### Returns

`Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

##### withdrawSol()

> **withdrawSol**(`note`, `recipient`, `relayer?`): `Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

Defined in: [solana/src/privacy-cash.ts:182](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L182)

Withdraw SOL from privacy pool

###### Parameters

###### note

`DepositNote`

###### recipient

`string`

###### relayer?

`RelayerConfig`

###### Returns

`Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

##### withdrawSpl()

> **withdrawSpl**(`note`, `recipient`, `relayer?`): `Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

Defined in: [solana/src/privacy-cash.ts:210](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L210)

Withdraw SPL token from privacy pool

###### Parameters

###### note

`DepositNote`

###### recipient

`string`

###### relayer?

`RelayerConfig`

###### Returns

`Promise`\<[`PrivacyCashWithdrawResult`](#privacycashwithdrawresult)\>

***

### PrivateCashScheme

Defined in: [solana/src/scheme.ts:90](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L90)

Private Cash Scheme
Implements x402 payment scheme using Privacy Cash

#### Implements

- `X402Scheme`

#### Constructors

##### Constructor

> **new PrivateCashScheme**(`config`): [`PrivateCashScheme`](#privatecashscheme)

Defined in: [solana/src/scheme.ts:100](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L100)

###### Parameters

###### config

[`PrivateCashSchemeConfig`](#privatecashschemeconfig)

###### Returns

[`PrivateCashScheme`](#privatecashscheme)

#### Properties

##### name

> `readonly` **name**: `"private-exact"` = `'private-exact'`

Defined in: [solana/src/scheme.ts:91](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L91)

Scheme name (e.g., 'exact', 'private-exact')

###### Implementation of

`X402Scheme.name`

##### supportedNetworks

> `readonly` **supportedNetworks**: `string`[]

Defined in: [solana/src/scheme.ts:92](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L92)

Supported networks for this scheme

###### Implementation of

`X402Scheme.supportedNetworks`

#### Methods

##### createPayment()

> **createPayment**(`requirements`): `Promise`\<`PaymentPayload`\>

Defined in: [solana/src/scheme.ts:136](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L136)

Create a payment for given requirements

###### Parameters

###### requirements

`PaymentRequirements`

###### Returns

`Promise`\<`PaymentPayload`\>

###### Implementation of

`X402Scheme.createPayment`

##### getDefaultRelayer()

> **getDefaultRelayer**(): [`SchemeRelayerConfig`](#schemerelayerconfig) \| `undefined`

Defined in: [solana/src/scheme.ts:122](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L122)

Get current default relayer

###### Returns

[`SchemeRelayerConfig`](#schemerelayerconfig) \| `undefined`

##### setDefaultRelayer()

> **setDefaultRelayer**(`relayer`): `void`

Defined in: [solana/src/scheme.ts:115](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L115)

Set default relayer for anonymous transactions

###### Parameters

###### relayer

[`SchemeRelayerConfig`](#schemerelayerconfig) | `undefined`

###### Returns

`void`

##### setNullifierRegistry()

> **setNullifierRegistry**(`registry`): `void`

Defined in: [solana/src/scheme.ts:129](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L129)

Set nullifier registry (useful for late initialization)

###### Parameters

###### registry

[`NullifierRegistry`](#nullifierregistry)

###### Returns

`void`

##### supportsAsset()

> **supportsAsset**(`asset`, `network`): `Promise`\<`boolean`\>

Defined in: [solana/src/scheme.ts:370](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L370)

Check if scheme supports an asset

###### Parameters

###### asset

`string`

###### network

`string`

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

`X402Scheme.supportsAsset`

##### supportsNetwork()

> **supportsNetwork**(`network`): `boolean`

Defined in: [solana/src/scheme.ts:363](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L363)

Check if scheme supports a network

###### Parameters

###### network

`string`

###### Returns

`boolean`

###### Implementation of

`X402Scheme.supportsNetwork`

##### verifyPayment()

> **verifyPayment**(`payload`, `requirements`): `Promise`\<`VerificationResult`\>

Defined in: [solana/src/scheme.ts:209](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L209)

Verify a payment

###### Parameters

###### payload

`PaymentPayload`

###### requirements

`PaymentRequirements`

###### Returns

`Promise`\<`VerificationResult`\>

###### Implementation of

`X402Scheme.verifyPayment`

***

### SolanaPrivacyProvider

Defined in: [solana/src/provider.ts:49](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L49)

Solana Privacy Provider
Implements PrivacyProvider using Privacy Cash SDK

#### Implements

- `PrivacyProvider`

#### Constructors

##### Constructor

> **new SolanaPrivacyProvider**(`config`): [`SolanaPrivacyProvider`](#solanaprivacyprovider)

Defined in: [solana/src/provider.ts:58](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L58)

###### Parameters

###### config

[`SolanaProviderConfig`](#solanaproviderconfig)

###### Returns

[`SolanaPrivacyProvider`](#solanaprivacyprovider)

#### Properties

##### chainId

> `readonly` **chainId**: `"solana"`

Defined in: [solana/src/provider.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L50)

Chain identifier

###### Implementation of

`PrivacyProvider.chainId`

#### Methods

##### deleteNote()

> **deleteNote**(`commitment`): `Promise`\<`void`\>

Defined in: [solana/src/provider.ts:316](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L316)

Delete a deposit note (after spending)

###### Parameters

###### commitment

`string`

Note commitment to delete

###### Returns

`Promise`\<`void`\>

###### Implementation of

`PrivacyProvider.deleteNote`

##### deposit()

> **deposit**(`params`): `Promise`\<`DepositResult`\>

Defined in: [solana/src/provider.ts:89](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L89)

Deposit funds into privacy pool

###### Parameters

###### params

`DepositParams`

Deposit parameters (token, amount)

###### Returns

`Promise`\<`DepositResult`\>

Deposit result with note

###### Implementation of

`PrivacyProvider.deposit`

##### exportNotes()

> **exportNotes**(): `Promise`\<`string`\>

Defined in: [solana/src/provider.ts:368](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L368)

Export notes for backup

###### Returns

`Promise`\<`string`\>

##### findNoteForPayment()

> **findNoteForPayment**(`token`, `amount`): `Promise`\<`DepositNote` \| `undefined`\>

Defined in: [solana/src/provider.ts:350](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L350)

Find a suitable note for a payment

###### Parameters

###### token

`string`

###### amount

`bigint`

###### Returns

`Promise`\<`DepositNote` \| `undefined`\>

##### generatePaymentProof()

> **generatePaymentProof**(`params`): `Promise`\<`PaymentProof`\>

Defined in: [solana/src/provider.ts:165](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L165)

Generate payment proof for x402 verification
This executes a private withdrawal and returns proof

###### Parameters

###### params

`GenerateProofParams`

Proof generation parameters

###### Returns

`Promise`\<`PaymentProof`\>

Payment proof

###### Implementation of

`PrivacyProvider.generatePaymentProof`

##### generateStealthAddress()

> **generateStealthAddress**(): `Promise`\<`StealthAddress`\>

Defined in: [solana/src/provider.ts:291](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L291)

Generate one-time stealth address for receiving
Each transaction should use a new address

###### Returns

`Promise`\<`StealthAddress`\>

Stealth address

###### Implementation of

`PrivacyProvider.generateStealthAddress`

##### getAdapter()

> **getAdapter**(): [`PrivacyCashAdapter`](#privacycashadapter)

Defined in: [solana/src/provider.ts:361](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L361)

Get the underlying adapter

###### Returns

[`PrivacyCashAdapter`](#privacycashadapter)

##### getNotes()

> **getNotes**(): `Promise`\<`DepositNote`[]\>

Defined in: [solana/src/provider.ts:303](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L303)

Get all deposit notes

###### Returns

`Promise`\<`DepositNote`[]\>

List of deposit notes

###### Implementation of

`PrivacyProvider.getNotes`

##### getPools()

> **getPools**(`token?`): `Promise`\<`PoolInfo`[]\>

Defined in: [solana/src/provider.ts:144](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L144)

Get available privacy pools

###### Parameters

###### token?

`string`

Optional token filter

###### Returns

`Promise`\<`PoolInfo`[]\>

List of pool info

###### Implementation of

`PrivacyProvider.getPools`

##### getPrivateBalance()

> **getPrivateBalance**(`token`): `Promise`\<`bigint`\>

Defined in: [solana/src/provider.ts:134](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L134)

Get private balance for a token
Sum of all unspent notes

###### Parameters

###### token

`string`

Token identifier

###### Returns

`Promise`\<`bigint`\>

Total private balance

###### Implementation of

`PrivacyProvider.getPrivateBalance`

##### getUnspentNotes()

> **getUnspentNotes**(): `Promise`\<`DepositNote`[]\>

Defined in: [solana/src/provider.ts:307](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L307)

Get unspent deposit notes

###### Returns

`Promise`\<`DepositNote`[]\>

List of unspent notes

###### Implementation of

`PrivacyProvider.getUnspentNotes`

##### importNotes()

> **importNotes**(`json`): `Promise`\<`number`\>

Defined in: [solana/src/provider.ts:380](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L380)

Import notes from backup

###### Parameters

###### json

`string`

###### Returns

`Promise`\<`number`\>

##### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [solana/src/provider.ts:72](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L72)

Initialize the provider
Must be called before using other methods

###### Returns

`Promise`\<`void`\>

##### isNoteSpent()

> **isNoteSpent**(`commitment`): `Promise`\<`boolean`\>

Defined in: [solana/src/provider.ts:320](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L320)

Check if a note has been spent

###### Parameters

###### commitment

`string`

Note commitment

###### Returns

`Promise`\<`boolean`\>

True if spent

###### Implementation of

`PrivacyProvider.isNoteSpent`

##### saveNote()

> **saveNote**(`note`): `Promise`\<`void`\>

Defined in: [solana/src/provider.ts:312](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L312)

Save a deposit note

###### Parameters

###### note

`DepositNote`

Note to save

###### Returns

`Promise`\<`void`\>

###### Implementation of

`PrivacyProvider.saveNote`

##### verifyPaymentProof()

> **verifyPaymentProof**(`proof`): `Promise`\<`boolean`\>

Defined in: [solana/src/provider.ts:187](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L187)

Verify a payment proof

###### Parameters

###### proof

`PaymentProof`

Payment proof to verify

###### Returns

`Promise`\<`boolean`\>

True if proof is valid

###### Implementation of

`PrivacyProvider.verifyPaymentProof`

##### withdraw()

> **withdraw**(`params`): `Promise`\<`WithdrawResult`\>

Defined in: [solana/src/provider.ts:114](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L114)

Withdraw funds from privacy pool

###### Parameters

###### params

`WithdrawParams`

Withdrawal parameters (note, recipient, relayer)

###### Returns

`Promise`\<`WithdrawResult`\>

Withdrawal result

###### Implementation of

`PrivacyProvider.withdraw`

## Interfaces

### DirectAdapterConfig

Defined in: [solana/src/direct-adapter.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L26)

#### Properties

##### network?

> `optional` **network**: `"mainnet"` \| `"devnet"` \| `"testnet"` \| `"localnet"`

Defined in: [solana/src/direct-adapter.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L34)

Network: mainnet, devnet, testnet, localnet

##### programId

> **programId**: `string`

Defined in: [solana/src/direct-adapter.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L32)

Program ID (deployed Privacy Cash)

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [solana/src/direct-adapter.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L28)

Solana RPC endpoint

##### wallet

> **wallet**: `Keypair`

Defined in: [solana/src/direct-adapter.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L30)

Wallet keypair for signing transactions

***

### NullifierRegistry

Defined in: [solana/src/scheme.ts:23](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L23)

Nullifier registry interface (from @px402/server)
Redefined here to avoid circular dependency

#### Methods

##### isUsed()

> **isUsed**(`nullifier`): `Promise`\<`boolean`\>

Defined in: [solana/src/scheme.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L32)

###### Parameters

###### nullifier

`string`

###### Returns

`Promise`\<`boolean`\>

##### register()

> **register**(`info`): `Promise`\<`boolean`\>

Defined in: [solana/src/scheme.ts:24](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L24)

###### Parameters

###### info

###### amount

`string`

###### nullifier

`string`

###### recipient

`string`

###### registeredAt

`number`

###### token

`string`

###### txSignature

`string`

###### Returns

`Promise`\<`boolean`\>

***

### PrivacyCashConfig

Defined in: [solana/src/privacy-cash.ts:14](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L14)

Privacy Cash SDK configuration

#### Properties

##### network?

> `optional` **network**: `"mainnet"` \| `"devnet"` \| `"testnet"`

Defined in: [solana/src/privacy-cash.ts:20](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L20)

Network: mainnet, devnet, testnet

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [solana/src/privacy-cash.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L16)

Solana RPC endpoint

##### wallet

> **wallet**: `Keypair`

Defined in: [solana/src/privacy-cash.ts:18](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L18)

Wallet keypair for signing transactions

***

### PrivacyCashDepositResult

Defined in: [solana/src/privacy-cash.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L26)

Result from Privacy Cash deposit operation

#### Properties

##### commitment

> **commitment**: `string`

Defined in: [solana/src/privacy-cash.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L32)

Commitment hash

##### leafIndex

> **leafIndex**: `number`

Defined in: [solana/src/privacy-cash.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L38)

Leaf index in merkle tree

##### nullifier

> **nullifier**: `string`

Defined in: [solana/src/privacy-cash.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L34)

Nullifier (private)

##### poolAddress

> **poolAddress**: `string`

Defined in: [solana/src/privacy-cash.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L30)

Pool address

##### secret

> **secret**: `string`

Defined in: [solana/src/privacy-cash.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L36)

Secret (private)

##### signature

> **signature**: `string`

Defined in: [solana/src/privacy-cash.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L28)

Transaction signature

***

### PrivacyCashPoolInfo

Defined in: [solana/src/privacy-cash.ts:54](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L54)

Privacy Cash pool info

#### Properties

##### address

> **address**: `string`

Defined in: [solana/src/privacy-cash.ts:56](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L56)

Pool address

##### denomination

> **denomination**: `bigint`

Defined in: [solana/src/privacy-cash.ts:60](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L60)

Pool denomination

##### depositCount

> **depositCount**: `number`

Defined in: [solana/src/privacy-cash.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L62)

Total deposits

##### token

> **token**: `string`

Defined in: [solana/src/privacy-cash.ts:58](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L58)

Token mint address (empty for SOL)

***

### PrivacyCashWithdrawResult

Defined in: [solana/src/privacy-cash.ts:44](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L44)

Result from Privacy Cash withdraw operation

#### Properties

##### nullifierHash

> **nullifierHash**: `string`

Defined in: [solana/src/privacy-cash.ts:48](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L48)

Nullifier hash

##### signature

> **signature**: `string`

Defined in: [solana/src/privacy-cash.ts:46](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/privacy-cash.ts#L46)

Transaction signature

***

### PrivateCashPayloadData

Defined in: [solana/src/scheme.ts:67](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L67)

Private Cash payment payload data

#### Properties

##### amount

> **amount**: `string`

Defined in: [solana/src/scheme.ts:73](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L73)

Payment amount

##### nullifierHash

> **nullifierHash**: `string`

Defined in: [solana/src/scheme.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L71)

Nullifier hash (hashed)

##### relayerFee?

> `optional` **relayerFee**: `string`

Defined in: [solana/src/scheme.ts:79](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L79)

Relayer fee paid (if any)

##### relayerUrl?

> `optional` **relayerUrl**: `string`

Defined in: [solana/src/scheme.ts:81](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L81)

Relayer address (if any)

##### signature

> **signature**: `string`

Defined in: [solana/src/scheme.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L69)

Transaction signature

##### timestamp

> **timestamp**: `number`

Defined in: [solana/src/scheme.ts:77](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L77)

Timestamp

##### token

> **token**: `string`

Defined in: [solana/src/scheme.ts:75](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L75)

Token identifier

***

### PrivateCashSchemeConfig

Defined in: [solana/src/scheme.ts:48](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L48)

Private Cash scheme configuration

#### Properties

##### defaultRelayer?

> `optional` **defaultRelayer**: [`SchemeRelayerConfig`](#schemerelayerconfig)

Defined in: [solana/src/scheme.ts:56](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L56)

Default relayer for anonymous transactions

##### nullifierRegistry?

> `optional` **nullifierRegistry**: [`NullifierRegistry`](#nullifierregistry)

Defined in: [solana/src/scheme.ts:54](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L54)

Nullifier registry for double-spend prevention (optional for client)

##### provider

> **provider**: [`SolanaPrivacyProvider`](#solanaprivacyprovider)

Defined in: [solana/src/scheme.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L50)

Privacy provider instance

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [solana/src/scheme.ts:52](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L52)

Solana RPC endpoint

##### skipOnChainVerification?

> `optional` **skipOnChainVerification**: `boolean`

Defined in: [solana/src/scheme.ts:61](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L61)

Skip on-chain verification (for local testing with simulated transactions)
WARNING: Only use in development/testing environments

***

### SchemeRelayerConfig

Defined in: [solana/src/scheme.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L38)

Relayer configuration for payment scheme

#### Properties

##### fee

> **fee**: `bigint`

Defined in: [solana/src/scheme.ts:42](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L42)

Relayer fee in lamports

##### url

> **url**: `string`

Defined in: [solana/src/scheme.ts:40](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L40)

Relayer API URL

***

### SolanaProviderConfig

Defined in: [solana/src/provider.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L32)

Solana provider configuration

#### Properties

##### network?

> `optional` **network**: `"mainnet"` \| `"devnet"` \| `"testnet"`

Defined in: [solana/src/provider.ts:40](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L40)

Network: mainnet, devnet, testnet

##### privacyCash?

> `optional` **privacyCash**: `Partial`\<[`PrivacyCashConfig`](#privacycashconfig)\>

Defined in: [solana/src/provider.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L38)

Privacy Cash configuration

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [solana/src/provider.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L34)

Solana RPC endpoint

##### wallet

> **wallet**: `Keypair`

Defined in: [solana/src/provider.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L36)

Wallet keypair

## Functions

### createDirectAdapter()

> **createDirectAdapter**(`config`): [`DirectPrivacyCashAdapter`](#directprivacycashadapter)

Defined in: [solana/src/direct-adapter.ts:488](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/direct-adapter.ts#L488)

Create a direct Privacy Cash adapter

#### Parameters

##### config

[`DirectAdapterConfig`](#directadapterconfig)

#### Returns

[`DirectPrivacyCashAdapter`](#directprivacycashadapter)

***

### createPrivateCashScheme()

> **createPrivateCashScheme**(`config`): [`PrivateCashScheme`](#privatecashscheme)

Defined in: [solana/src/scheme.ts:492](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/scheme.ts#L492)

Create a Private Cash scheme instance

#### Parameters

##### config

[`PrivateCashSchemeConfig`](#privatecashschemeconfig)

#### Returns

[`PrivateCashScheme`](#privatecashscheme)

***

### createSolanaProvider()

> **createSolanaProvider**(`config`): [`SolanaPrivacyProvider`](#solanaprivacyprovider)

Defined in: [solana/src/provider.ts:408](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/solana/src/provider.ts#L408)

Create a Solana privacy provider
Factory function for convenience

#### Parameters

##### config

[`SolanaProviderConfig`](#solanaproviderconfig)

#### Returns

[`SolanaPrivacyProvider`](#solanaprivacyprovider)
