[**Px402 API Documentation v0.1.0**](../index.md)

***

[Px402 API Documentation](../index.md) / relayer/src

# relayer/src

## Classes

### IndexerMerkleTree

Defined in: [relayer/src/indexer.ts:27](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L27)

Simple in-memory Merkle tree for indexing

#### Constructors

##### Constructor

> **new IndexerMerkleTree**(`height`): [`IndexerMerkleTree`](#indexermerkletree)

Defined in: [relayer/src/indexer.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L34)

###### Parameters

###### height

`number` = `MERKLE_TREE_HEIGHT`

###### Returns

[`IndexerMerkleTree`](#indexermerkletree)

#### Methods

##### exportState()

> **exportState**(): [`MerkleTreeState`](#merkletreestate)

Defined in: [relayer/src/indexer.ts:223](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L223)

Export state for persistence

###### Returns

[`MerkleTreeState`](#merkletreestate)

##### getLeafCount()

> **getLeafCount**(): `number`

Defined in: [relayer/src/indexer.ts:216](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L216)

Get leaf count

###### Returns

`number`

##### getLeaves()

> **getLeaves**(): `string`[]

Defined in: [relayer/src/indexer.ts:209](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L209)

Get all leaves

###### Returns

`string`[]

##### getMerkleProof()

> **getMerkleProof**(`index`): `object`

Defined in: [relayer/src/indexer.ts:156](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L156)

Get Merkle proof for a leaf

###### Parameters

###### index

`number`

###### Returns

`object`

###### indices

> **indices**: `number`[]

###### path

> **path**: `string`[]

##### getRoot()

> **getRoot**(): `string`

Defined in: [relayer/src/indexer.ts:122](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L122)

Get current root

###### Returns

`string`

##### getRootHistory()

> **getRootHistory**(): `string`[]

Defined in: [relayer/src/indexer.ts:104](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L104)

Get root history

###### Returns

`string`[]

##### importState()

> **importState**(`state`): `void`

Defined in: [relayer/src/indexer.ts:235](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L235)

Import state from persistence

###### Parameters

###### state

[`MerkleTreeState`](#merkletreestate)

###### Returns

`void`

##### insert()

> **insert**(`leaf`): `number`

Defined in: [relayer/src/indexer.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L69)

Insert a new leaf (commitment)

###### Parameters

###### leaf

`string`

###### Returns

`number`

##### insertBatch()

> **insertBatch**(`leaves`): `number`[]

Defined in: [relayer/src/indexer.ts:111](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L111)

Batch insert leaves

###### Parameters

###### leaves

`string`[]

###### Returns

`number`[]

##### isKnownRoot()

> **isKnownRoot**(`root`): `boolean`

Defined in: [relayer/src/indexer.ts:97](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L97)

Check if a root is valid (current or in history)

###### Parameters

###### root

`string`

###### Returns

`boolean`

##### verifyProof()

> **verifyProof**(`leaf`, `index`, `proof`): `boolean`

Defined in: [relayer/src/indexer.ts:191](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L191)

Verify a Merkle proof

###### Parameters

###### leaf

`string`

###### index

`number`

###### proof

`string`[]

###### Returns

`boolean`

***

### IndexerNullifierRegistry

Defined in: [relayer/src/indexer.ts:251](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L251)

Nullifier registry for tracking used notes

#### Constructors

##### Constructor

> **new IndexerNullifierRegistry**(): [`IndexerNullifierRegistry`](#indexernullifierregistry)

###### Returns

[`IndexerNullifierRegistry`](#indexernullifierregistry)

#### Methods

##### exportState()

> **exportState**(): [`NullifierState`](#nullifierstate)

Defined in: [relayer/src/indexer.ts:293](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L293)

Export state

###### Returns

[`NullifierState`](#nullifierstate)

##### getCount()

> **getCount**(): `number`

Defined in: [relayer/src/indexer.ts:286](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L286)

Get count of used nullifiers

###### Returns

`number`

##### getTransaction()

> **getTransaction**(`nullifier`): `string` \| `undefined`

Defined in: [relayer/src/indexer.ts:279](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L279)

Get transaction signature for nullifier

###### Parameters

###### nullifier

`string`

###### Returns

`string` \| `undefined`

##### importState()

> **importState**(`state`): `void`

Defined in: [relayer/src/indexer.ts:303](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L303)

Import state

###### Parameters

###### state

[`NullifierState`](#nullifierstate)

###### Returns

`void`

##### isUsed()

> **isUsed**(`nullifier`): `boolean`

Defined in: [relayer/src/indexer.ts:272](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L272)

Check if nullifier is used

###### Parameters

###### nullifier

`string`

###### Returns

`boolean`

##### register()

> **register**(`nullifier`, `txSignature`): `boolean`

Defined in: [relayer/src/indexer.ts:259](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L259)

Register a used nullifier

###### Parameters

###### nullifier

`string`

###### txSignature

`string`

###### Returns

`boolean`

***

### PrivacyCashIndexer

Defined in: [relayer/src/indexer.ts:333](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L333)

Privacy Cash Indexer

Indexes on-chain events from Privacy Cash program:
- Deposits (new commitments)
- Withdrawals (nullifier usage)
- Transfers

#### Constructors

##### Constructor

> **new PrivacyCashIndexer**(`config`): [`PrivacyCashIndexer`](#privacycashindexer)

Defined in: [relayer/src/indexer.ts:345](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L345)

###### Parameters

###### config

[`IndexerConfig`](#indexerconfig)

###### Returns

[`PrivacyCashIndexer`](#privacycashindexer)

#### Methods

##### addCommitment()

> **addCommitment**(`commitment`): `number`

Defined in: [relayer/src/indexer.ts:494](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L494)

Add a new commitment (manual insert for local testing)

###### Parameters

###### commitment

`string`

###### Returns

`number`

##### addNote()

> **addNote**(`note`): `void`

Defined in: [relayer/src/indexer.ts:536](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L536)

Add an indexed note

###### Parameters

###### note

[`IndexedNote`](#indexednote)

###### Returns

`void`

##### getConnection()

> **getConnection**(): `Connection`

Defined in: [relayer/src/indexer.ts:567](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L567)

Get connection

###### Returns

`Connection`

##### getEvents()

> **getEvents**(): [`IndexerEvent`](#indexerevent)[]

Defined in: [relayer/src/indexer.ts:543](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L543)

Get all events

###### Returns

[`IndexerEvent`](#indexerevent)[]

##### getLeafCount()

> **getLeafCount**(): `number`

Defined in: [relayer/src/indexer.ts:475](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L475)

Get leaf count

###### Returns

`number`

##### getLeaves()

> **getLeaves**(): `string`[]

Defined in: [relayer/src/indexer.ts:468](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L468)

Get all leaves (commitments)

###### Returns

`string`[]

##### getMerkleProof()

> **getMerkleProof**(`commitment`): \{ `indices`: `number`[]; `path`: `string`[]; \} \| `null`

Defined in: [relayer/src/indexer.ts:482](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L482)

Get Merkle proof for commitment

###### Parameters

###### commitment

`string`

###### Returns

\{ `indices`: `number`[]; `path`: `string`[]; \} \| `null`

##### getMerkleRoot()

> **getMerkleRoot**(): `string`

Defined in: [relayer/src/indexer.ts:461](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L461)

Get current Merkle root

###### Returns

`string`

##### getNote()

> **getNote**(`commitment`): [`IndexedNote`](#indexednote) \| `undefined`

Defined in: [relayer/src/indexer.ts:529](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L529)

Get indexed note by commitment

###### Parameters

###### commitment

`string`

###### Returns

[`IndexedNote`](#indexednote) \| `undefined`

##### getRootHistory()

> **getRootHistory**(): `string`[]

Defined in: [relayer/src/indexer.ts:508](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L508)

Get root history

###### Returns

`string`[]

##### getStats()

> **getStats**(): `object`

Defined in: [relayer/src/indexer.ts:550](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L550)

Get indexer stats

###### Returns

`object`

###### lastProcessedSlot

> **lastProcessedSlot**: `number`

###### leafCount

> **leafCount**: `number`

###### noteCount

> **noteCount**: `number`

###### nullifierCount

> **nullifierCount**: `number`

##### isKnownRoot()

> **isKnownRoot**(`root`): `boolean`

Defined in: [relayer/src/indexer.ts:501](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L501)

Check if a root is known (current or in history)

###### Parameters

###### root

`string`

###### Returns

`boolean`

##### isNullifierUsed()

> **isNullifierUsed**(`nullifier`): `boolean`

Defined in: [relayer/src/indexer.ts:515](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L515)

Check if nullifier is used

###### Parameters

###### nullifier

`string`

###### Returns

`boolean`

##### registerNullifier()

> **registerNullifier**(`nullifier`, `txSignature`): `boolean`

Defined in: [relayer/src/indexer.ts:522](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L522)

Register a nullifier

###### Parameters

###### nullifier

`string`

###### txSignature

`string`

###### Returns

`boolean`

##### start()

> **start**(): `Promise`\<`void`\>

Defined in: [relayer/src/indexer.ts:357](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L357)

Start the indexer

###### Returns

`Promise`\<`void`\>

##### stop()

> **stop**(): `void`

Defined in: [relayer/src/indexer.ts:378](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L378)

Stop the indexer

###### Returns

`void`

***

### PrivacyCashRelayer

Defined in: [relayer/src/relayer.ts:133](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L133)

Privacy Cash Relayer

Submits transactions on behalf of users for anonymous payments.

#### Constructors

##### Constructor

> **new PrivacyCashRelayer**(`config`): [`PrivacyCashRelayer`](#privacycashrelayer)

Defined in: [relayer/src/relayer.ts:145](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L145)

###### Parameters

###### config

[`RelayerConfig`](#relayerconfig)

###### Returns

[`PrivacyCashRelayer`](#privacycashrelayer)

#### Methods

##### deposit()

> **deposit**(`request`): `Promise`\<[`TransactionResult`](#transactionresult)\>

Defined in: [relayer/src/relayer.ts:199](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L199)

Submit a deposit transaction

###### Parameters

###### request

[`DepositRequest`](#depositrequest)

###### Returns

`Promise`\<[`TransactionResult`](#transactionresult)\>

##### getFee()

> **getFee**(): `bigint`

Defined in: [relayer/src/relayer.ts:463](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L463)

Get relayer fee

###### Returns

`bigint`

##### getIndexer()

> **getIndexer**(): [`PrivacyCashIndexer`](#privacycashindexer)

Defined in: [relayer/src/relayer.ts:449](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L449)

Get the indexer instance

###### Returns

[`PrivacyCashIndexer`](#privacycashindexer)

##### getMerkleProof()

> **getMerkleProof**(`commitment`): \{ `indices`: `number`[]; `path`: `string`[]; \} \| `null`

Defined in: [relayer/src/relayer.ts:315](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L315)

Get Merkle proof for commitment

###### Parameters

###### commitment

`string`

###### Returns

\{ `indices`: `number`[]; `path`: `string`[]; \} \| `null`

##### getMerkleRoot()

> **getMerkleRoot**(): `string`

Defined in: [relayer/src/relayer.ts:308](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L308)

Get current Merkle root

###### Returns

`string`

##### getPublicKey()

> **getPublicKey**(): `string`

Defined in: [relayer/src/relayer.ts:456](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L456)

Get relayer public key

###### Returns

`string`

##### getRootHistory()

> **getRootHistory**(): `string`[]

Defined in: [relayer/src/relayer.ts:336](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L336)

Get root history

###### Returns

`string`[]

##### getStats()

> **getStats**(): `object`

Defined in: [relayer/src/relayer.ts:343](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L343)

Get relayer stats

###### Returns

`object`

###### fee

> **fee**: `string`

###### leafCount

> **leafCount**: `number`

###### nullifierCount

> **nullifierCount**: `number`

###### relayerPubkey

> **relayerPubkey**: `string`

##### getTransactionStatus()

> **getTransactionStatus**(`signature`): `Promise`\<\{ `confirmations?`: `number`; `err?`: `unknown`; `found`: `boolean`; `status`: `string`; \}\>

Defined in: [relayer/src/relayer.ts:361](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L361)

Get transaction status

###### Parameters

###### signature

`string`

###### Returns

`Promise`\<\{ `confirmations?`: `number`; `err?`: `unknown`; `found`: `boolean`; `status`: `string`; \}\>

##### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [relayer/src/relayer.ts:162](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L162)

Initialize the relayer

###### Returns

`Promise`\<`void`\>

##### isKnownRoot()

> **isKnownRoot**(`root`): `boolean`

Defined in: [relayer/src/relayer.ts:329](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L329)

Check if a Merkle root is valid (current or in history)

###### Parameters

###### root

`string`

###### Returns

`boolean`

##### isNullifierUsed()

> **isNullifierUsed**(`nullifier`): `boolean`

Defined in: [relayer/src/relayer.ts:322](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L322)

Check if nullifier is used

###### Parameters

###### nullifier

`string`

###### Returns

`boolean`

##### stop()

> **stop**(): `void`

Defined in: [relayer/src/relayer.ts:190](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L190)

Stop the relayer

###### Returns

`void`

##### withdraw()

> **withdraw**(`request`): `Promise`\<[`TransactionResult`](#transactionresult)\>

Defined in: [relayer/src/relayer.ts:237](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L237)

Submit a withdrawal transaction

###### Parameters

###### request

[`WithdrawRequest`](#withdrawrequest)

###### Returns

`Promise`\<[`TransactionResult`](#transactionresult)\>

## Interfaces

### DepositRequest

Defined in: [relayer/src/types.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L26)

Deposit request

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [relayer/src/types.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L30)

Deposit amount in lamports

##### assetType

> **assetType**: `number`

Defined in: [relayer/src/types.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L32)

Asset type: 0 = SOL, 1 = USDC

##### commitment

> **commitment**: `string`

Defined in: [relayer/src/types.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L28)

Commitment hash

##### userPubkey

> **userPubkey**: `string`

Defined in: [relayer/src/types.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L34)

User's public key

***

### HealthResponse

Defined in: [relayer/src/types.ts:166](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L166)

Health check response

#### Properties

##### lastBlockSlot?

> `optional` **lastBlockSlot**: `number`

Defined in: [relayer/src/types.ts:171](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L171)

##### leafCount?

> `optional` **leafCount**: `number`

Defined in: [relayer/src/types.ts:173](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L173)

##### merkleRoot?

> `optional` **merkleRoot**: `string`

Defined in: [relayer/src/types.ts:172](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L172)

##### network

> **network**: `string`

Defined in: [relayer/src/types.ts:169](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L169)

##### rpcConnected

> **rpcConnected**: `boolean`

Defined in: [relayer/src/types.ts:170](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L170)

##### status

> **status**: `"healthy"` \| `"degraded"` \| `"unhealthy"`

Defined in: [relayer/src/types.ts:167](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L167)

##### version

> **version**: `string`

Defined in: [relayer/src/types.ts:168](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L168)

***

### IndexedNote

Defined in: [relayer/src/types.ts:81](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L81)

Indexed note (encrypted UTXO)

#### Properties

##### commitment

> **commitment**: `string`

Defined in: [relayer/src/types.ts:83](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L83)

Commitment hash

##### encryptedData

> **encryptedData**: `string`

Defined in: [relayer/src/types.ts:87](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L87)

Encrypted note data

##### leafIndex

> **leafIndex**: `number`

Defined in: [relayer/src/types.ts:85](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L85)

Leaf index in Merkle tree

##### slot

> **slot**: `number`

Defined in: [relayer/src/types.ts:89](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L89)

Block slot when deposited

##### timestamp

> **timestamp**: `number`

Defined in: [relayer/src/types.ts:91](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L91)

Timestamp

***

### IndexerConfig

Defined in: [relayer/src/indexer.ts:314](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L314)

Privacy Cash Indexer Configuration

#### Properties

##### pollInterval?

> `optional` **pollInterval**: `number`

Defined in: [relayer/src/indexer.ts:320](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L320)

Polling interval in ms (default: 5000)

##### programId

> **programId**: `string`

Defined in: [relayer/src/indexer.ts:318](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L318)

Privacy Cash program ID

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [relayer/src/indexer.ts:316](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L316)

Solana RPC URL

##### startSlot?

> `optional` **startSlot**: `number`

Defined in: [relayer/src/indexer.ts:322](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L322)

Start slot for indexing (default: 0)

***

### IndexerEvent

Defined in: [relayer/src/types.ts:121](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L121)

Indexer event

#### Properties

##### commitment?

> `optional` **commitment**: `string`

Defined in: [relayer/src/types.ts:123](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L123)

##### nullifier?

> `optional` **nullifier**: `string`

Defined in: [relayer/src/types.ts:124](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L124)

##### signature

> **signature**: `string`

Defined in: [relayer/src/types.ts:125](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L125)

##### slot

> **slot**: `number`

Defined in: [relayer/src/types.ts:126](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L126)

##### timestamp

> **timestamp**: `number`

Defined in: [relayer/src/types.ts:127](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L127)

##### type

> **type**: `"transfer"` \| `"deposit"` \| `"withdraw"`

Defined in: [relayer/src/types.ts:122](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L122)

***

### MerkleRootResponse

Defined in: [relayer/src/types.ts:135](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L135)

Merkle root response

#### Properties

##### lastUpdated

> **lastUpdated**: `string`

Defined in: [relayer/src/types.ts:138](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L138)

##### leafCount

> **leafCount**: `number`

Defined in: [relayer/src/types.ts:137](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L137)

##### root

> **root**: `string`

Defined in: [relayer/src/types.ts:136](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L136)

***

### MerkleTreeState

Defined in: [relayer/src/types.ts:97](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L97)

Merkle tree state

#### Properties

##### leaves

> **leaves**: `string`[]

Defined in: [relayer/src/types.ts:105](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L105)

All leaves (commitments)

##### nextIndex

> **nextIndex**: `number`

Defined in: [relayer/src/types.ts:101](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L101)

Next leaf index

##### root

> **root**: `string`

Defined in: [relayer/src/types.ts:99](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L99)

Current root

##### rootHistory

> **rootHistory**: `string`[]

Defined in: [relayer/src/types.ts:103](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L103)

Root history for verification

***

### NullifierState

Defined in: [relayer/src/types.ts:111](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L111)

Nullifier state

#### Properties

##### txMap

> **txMap**: `Map`\<`string`, `string`\>

Defined in: [relayer/src/types.ts:115](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L115)

Mapping of nullifier -> transaction signature

##### used

> **used**: `Set`\<`string`\>

Defined in: [relayer/src/types.ts:113](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L113)

Set of used nullifiers

***

### PoolInfoResponse

Defined in: [relayer/src/types.ts:144](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L144)

Pool info response

#### Properties

##### merkleAccount

> **merkleAccount**: `string`

Defined in: [relayer/src/types.ts:147](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L147)

##### nullifierAccount

> **nullifierAccount**: `string`

Defined in: [relayer/src/types.ts:148](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L148)

##### poolAccount

> **poolAccount**: `string`

Defined in: [relayer/src/types.ts:146](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L146)

##### programId

> **programId**: `string`

Defined in: [relayer/src/types.ts:145](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L145)

##### treeTokenAccount

> **treeTokenAccount**: `string`

Defined in: [relayer/src/types.ts:149](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L149)

***

### RelayerConfig

Defined in: [relayer/src/types.ts:10](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L10)

Relayer configuration

#### Properties

##### fee

> **fee**: `bigint`

Defined in: [relayer/src/types.ts:18](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L18)

Relayer fee in lamports

##### network?

> `optional` **network**: `"mainnet"` \| `"devnet"` \| `"testnet"` \| `"localnet"`

Defined in: [relayer/src/types.ts:20](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L20)

Network: mainnet, devnet, testnet, localnet

##### programId

> **programId**: `string`

Defined in: [relayer/src/types.ts:14](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L14)

Privacy Cash program ID

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [relayer/src/types.ts:12](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L12)

Solana RPC endpoint

##### secretKey

> **secretKey**: `Uint8Array`

Defined in: [relayer/src/types.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L16)

Relayer keypair (for signing transactions)

***

### StatusResponse

Defined in: [relayer/src/types.ts:155](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L155)

Status response

#### Properties

##### confirmations?

> `optional` **confirmations**: `number`

Defined in: [relayer/src/types.ts:158](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L158)

##### err?

> `optional` **err**: `unknown`

Defined in: [relayer/src/types.ts:159](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L159)

##### found

> **found**: `boolean`

Defined in: [relayer/src/types.ts:156](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L156)

##### slot?

> `optional` **slot**: `number`

Defined in: [relayer/src/types.ts:160](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L160)

##### status

> **status**: `"pending"` \| `"confirmed"` \| `"finalized"` \| `"not_found"`

Defined in: [relayer/src/types.ts:157](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L157)

***

### TransactionResult

Defined in: [relayer/src/types.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L69)

Transaction result

#### Properties

##### error?

> `optional` **error**: `string`

Defined in: [relayer/src/types.ts:72](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L72)

##### explorerUrl?

> `optional` **explorerUrl**: `string`

Defined in: [relayer/src/types.ts:73](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L73)

##### signature?

> `optional` **signature**: `string`

Defined in: [relayer/src/types.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L71)

##### success

> **success**: `boolean`

Defined in: [relayer/src/types.ts:70](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L70)

***

### WithdrawRequest

Defined in: [relayer/src/types.ts:40](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L40)

Withdraw request

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [relayer/src/types.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L50)

Amount to withdraw

##### assetType

> **assetType**: `number`

Defined in: [relayer/src/types.ts:52](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L52)

Asset type

##### nullifier

> **nullifier**: `string`

Defined in: [relayer/src/types.ts:46](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L46)

Nullifier hash

##### proof?

> `optional` **proof**: [`ZkProof`](#zkproof)

Defined in: [relayer/src/types.ts:42](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L42)

ZK proof

##### recipient

> **recipient**: `string`

Defined in: [relayer/src/types.ts:48](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L48)

Recipient address

##### root

> **root**: `string`

Defined in: [relayer/src/types.ts:44](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L44)

Merkle root

***

### ZkProof

Defined in: [relayer/src/types.ts:58](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L58)

ZK Proof structure (Groth16)

#### Properties

##### curve

> **curve**: `string`

Defined in: [relayer/src/types.ts:63](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L63)

##### pi\_a

> **pi\_a**: \[`string`, `string`\]

Defined in: [relayer/src/types.ts:59](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L59)

##### pi\_b

> **pi\_b**: \[\[`string`, `string`\], \[`string`, `string`\]\]

Defined in: [relayer/src/types.ts:60](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L60)

##### pi\_c

> **pi\_c**: \[`string`, `string`\]

Defined in: [relayer/src/types.ts:61](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L61)

##### protocol

> **protocol**: `string`

Defined in: [relayer/src/types.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/types.ts#L62)

## Functions

### createIndexer()

> **createIndexer**(`config`): [`PrivacyCashIndexer`](#privacycashindexer)

Defined in: [relayer/src/indexer.ts:575](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/indexer.ts#L575)

Create a Privacy Cash indexer

#### Parameters

##### config

[`IndexerConfig`](#indexerconfig)

#### Returns

[`PrivacyCashIndexer`](#privacycashindexer)

***

### createRelayer()

> **createRelayer**(`config`): [`PrivacyCashRelayer`](#privacycashrelayer)

Defined in: [relayer/src/relayer.ts:471](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/relayer/src/relayer.ts#L471)

Create a Privacy Cash relayer

#### Parameters

##### config

[`RelayerConfig`](#relayerconfig)

#### Returns

[`PrivacyCashRelayer`](#privacycashrelayer)
