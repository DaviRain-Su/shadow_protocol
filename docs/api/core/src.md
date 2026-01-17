[**Px402 API Documentation v0.1.0**](../index.md)

***

[Px402 API Documentation](../index.md) / core/src

# core/src

## Enumerations

### Px402ErrorCode

Defined in: [core/src/types.ts:178](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L178)

Px402 error codes

#### Enumeration Members

##### INSUFFICIENT\_BALANCE

> **INSUFFICIENT\_BALANCE**: `"INSUFFICIENT_BALANCE"`

Defined in: [core/src/types.ts:179](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L179)

##### INVALID\_NOTE

> **INVALID\_NOTE**: `"INVALID_NOTE"`

Defined in: [core/src/types.ts:180](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L180)

##### INVALID\_PROOF

> **INVALID\_PROOF**: `"INVALID_PROOF"`

Defined in: [core/src/types.ts:182](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L182)

##### NETWORK\_ERROR

> **NETWORK\_ERROR**: `"NETWORK_ERROR"`

Defined in: [core/src/types.ts:184](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L184)

##### NOTE\_ALREADY\_SPENT

> **NOTE\_ALREADY\_SPENT**: `"NOTE_ALREADY_SPENT"`

Defined in: [core/src/types.ts:181](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L181)

##### RELAYER\_ERROR

> **RELAYER\_ERROR**: `"RELAYER_ERROR"`

Defined in: [core/src/types.ts:183](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L183)

##### UNSUPPORTED\_CHAIN

> **UNSUPPORTED\_CHAIN**: `"UNSUPPORTED_CHAIN"`

Defined in: [core/src/types.ts:186](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L186)

##### UNSUPPORTED\_TOKEN

> **UNSUPPORTED\_TOKEN**: `"UNSUPPORTED_TOKEN"`

Defined in: [core/src/types.ts:185](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L185)

## Classes

### `abstract` BasePrivacyProvider

Defined in: [core/src/provider.ts:147](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L147)

Abstract base class for privacy providers
Provides common functionality

#### Implements

- [`PrivacyProvider`](#privacyprovider)

#### Constructors

##### Constructor

> **new BasePrivacyProvider**(): [`BasePrivacyProvider`](#baseprivacyprovider)

###### Returns

[`BasePrivacyProvider`](#baseprivacyprovider)

#### Properties

##### chainId

> `abstract` `readonly` **chainId**: [`ChainId`](#chainid-5)

Defined in: [core/src/provider.ts:148](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L148)

Chain identifier

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`chainId`](#chainid-4)

#### Methods

##### deleteNote()

> **deleteNote**(`commitment`): `Promise`\<`void`\>

Defined in: [core/src/provider.ts:183](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L183)

Delete a deposit note (after spending)

###### Parameters

###### commitment

`string`

Note commitment to delete

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`deleteNote`](#deletenote-4)

##### deposit()

> `abstract` **deposit**(`params`): `Promise`\<[`DepositResult`](#depositresult)\>

Defined in: [core/src/provider.ts:153](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L153)

Deposit funds into privacy pool

###### Parameters

###### params

[`DepositParams`](#depositparams)

Deposit parameters (token, amount)

###### Returns

`Promise`\<[`DepositResult`](#depositresult)\>

Deposit result with note

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`deposit`](#deposit-2)

##### generatePaymentProof()

> `abstract` **generatePaymentProof**(`params`): `Promise`\<[`PaymentProof`](#paymentproof)\>

Defined in: [core/src/provider.ts:157](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L157)

Generate payment proof for x402 verification
This executes a private withdrawal and returns proof

###### Parameters

###### params

[`GenerateProofParams`](#generateproofparams)

Proof generation parameters

###### Returns

`Promise`\<[`PaymentProof`](#paymentproof)\>

Payment proof

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`generatePaymentProof`](#generatepaymentproof-2)

##### generateStealthAddress()

> `abstract` **generateStealthAddress**(): `Promise`\<[`StealthAddress`](#stealthaddress)\>

Defined in: [core/src/provider.ts:159](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L159)

Generate one-time stealth address for receiving
Each transaction should use a new address

###### Returns

`Promise`\<[`StealthAddress`](#stealthaddress)\>

Stealth address

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`generateStealthAddress`](#generatestealthaddress-2)

##### getNotes()

> **getNotes**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/provider.ts:161](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L161)

Get all deposit notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

List of deposit notes

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`getNotes`](#getnotes-2)

##### getPools()

> `abstract` **getPools**(`token?`): `Promise`\<[`PoolInfo`](#poolinfo)[]\>

Defined in: [core/src/provider.ts:156](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L156)

Get available privacy pools

###### Parameters

###### token?

`string`

Optional token filter

###### Returns

`Promise`\<[`PoolInfo`](#poolinfo)[]\>

List of pool info

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`getPools`](#getpools-2)

##### getPrivateBalance()

> `abstract` **getPrivateBalance**(`token`): `Promise`\<`bigint`\>

Defined in: [core/src/provider.ts:155](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L155)

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

[`PrivacyProvider`](#privacyprovider).[`getPrivateBalance`](#getprivatebalance-2)

##### getUnspentNotes()

> **getUnspentNotes**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/provider.ts:165](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L165)

Get unspent deposit notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

List of unspent notes

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`getUnspentNotes`](#getunspentnotes-2)

##### isNoteSpent()

> **isNoteSpent**(`commitment`): `Promise`\<`boolean`\>

Defined in: [core/src/provider.ts:187](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L187)

Check if a note has been spent

###### Parameters

###### commitment

`string`

Note commitment

###### Returns

`Promise`\<`boolean`\>

True if spent

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`isNoteSpent`](#isnotespent-2)

##### saveNote()

> **saveNote**(`note`): `Promise`\<`void`\>

Defined in: [core/src/provider.ts:179](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L179)

Save a deposit note

###### Parameters

###### note

[`DepositNote`](#depositnote)

Note to save

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`saveNote`](#savenote-4)

##### verifyPaymentProof()

> `abstract` **verifyPaymentProof**(`proof`): `Promise`\<`boolean`\>

Defined in: [core/src/provider.ts:158](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L158)

Verify a payment proof

###### Parameters

###### proof

[`PaymentProof`](#paymentproof)

Payment proof to verify

###### Returns

`Promise`\<`boolean`\>

True if proof is valid

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`verifyPaymentProof`](#verifypaymentproof-2)

##### withdraw()

> `abstract` **withdraw**(`params`): `Promise`\<[`WithdrawResult`](#withdrawresult)\>

Defined in: [core/src/provider.ts:154](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L154)

Withdraw funds from privacy pool

###### Parameters

###### params

[`WithdrawParams`](#withdrawparams)

Withdrawal parameters (note, recipient, relayer)

###### Returns

`Promise`\<[`WithdrawResult`](#withdrawresult)\>

Withdrawal result

###### Implementation of

[`PrivacyProvider`](#privacyprovider).[`withdraw`](#withdraw-2)

***

### `abstract` BaseX402Scheme

Defined in: [core/src/scheme.ts:110](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L110)

Abstract base class for X402 schemes

#### Implements

- [`X402Scheme`](#x402scheme)

#### Constructors

##### Constructor

> **new BaseX402Scheme**(): [`BaseX402Scheme`](#basex402scheme)

###### Returns

[`BaseX402Scheme`](#basex402scheme)

#### Properties

##### name

> `abstract` `readonly` **name**: `string`

Defined in: [core/src/scheme.ts:111](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L111)

Scheme name (e.g., 'exact', 'private-exact')

###### Implementation of

[`X402Scheme`](#x402scheme).[`name`](#name-1)

##### supportedNetworks

> `abstract` `readonly` **supportedNetworks**: `string`[]

Defined in: [core/src/scheme.ts:112](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L112)

Supported networks for this scheme

###### Implementation of

[`X402Scheme`](#x402scheme).[`supportedNetworks`](#supportednetworks-1)

#### Methods

##### createPayment()

> `abstract` **createPayment**(`requirements`): `Promise`\<[`PaymentPayload`](#paymentpayload)\>

Defined in: [core/src/scheme.ts:114](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L114)

Create a payment for given requirements

###### Parameters

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Payment requirements from server

###### Returns

`Promise`\<[`PaymentPayload`](#paymentpayload)\>

Payment payload to send to server

###### Implementation of

[`X402Scheme`](#x402scheme).[`createPayment`](#createpayment-4)

##### supportsAsset()

> **supportsAsset**(`_asset`, `_network`): `Promise`\<`boolean`\>

Defined in: [core/src/scheme.ts:124](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L124)

Check if scheme supports an asset

###### Parameters

###### \_asset

`string`

###### \_network

`string`

###### Returns

`Promise`\<`boolean`\>

True if supported

###### Implementation of

[`X402Scheme`](#x402scheme).[`supportsAsset`](#supportsasset-2)

##### supportsNetwork()

> **supportsNetwork**(`network`): `boolean`

Defined in: [core/src/scheme.ts:120](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L120)

Check if scheme supports a network

###### Parameters

###### network

`string`

Network identifier

###### Returns

`boolean`

True if supported

###### Implementation of

[`X402Scheme`](#x402scheme).[`supportsNetwork`](#supportsnetwork-2)

##### verifyPayment()

> `abstract` **verifyPayment**(`payload`, `requirements`): `Promise`\<[`VerificationResult`](#verificationresult)\>

Defined in: [core/src/scheme.ts:115](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L115)

Verify a payment (server-side)

###### Parameters

###### payload

[`PaymentPayload`](#paymentpayload)

Payment payload from client

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Original payment requirements

###### Returns

`Promise`\<[`VerificationResult`](#verificationresult)\>

Verification result

###### Implementation of

[`X402Scheme`](#x402scheme).[`verifyPayment`](#verifypayment-4)

***

### MemoryNoteStorage

Defined in: [core/src/note.ts:43](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L43)

In-memory note storage
For development and testing

#### Implements

- [`NoteStorage`](#notestorage)

#### Constructors

##### Constructor

> **new MemoryNoteStorage**(): [`MemoryNoteStorage`](#memorynotestorage)

###### Returns

[`MemoryNoteStorage`](#memorynotestorage)

#### Methods

##### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [core/src/note.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L62)

Clear all notes

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`NoteStorage`](#notestorage).[`clear`](#clear-2)

##### delete()

> **delete**(`commitment`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:58](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L58)

Delete a note

###### Parameters

###### commitment

`string`

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`NoteStorage`](#notestorage).[`delete`](#delete-2)

##### get()

> **get**(`commitment`): `Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

Defined in: [core/src/note.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L50)

Get a note by commitment

###### Parameters

###### commitment

`string`

###### Returns

`Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

###### Implementation of

[`NoteStorage`](#notestorage).[`get`](#get-4)

##### getAll()

> **getAll**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:54](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L54)

Get all notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

###### Implementation of

[`NoteStorage`](#notestorage).[`getAll`](#getall-2)

##### save()

> **save**(`note`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:46](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L46)

Save a note

###### Parameters

###### note

[`DepositNote`](#depositnote)

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`NoteStorage`](#notestorage).[`save`](#save-2)

***

### NoteManager

Defined in: [core/src/note.ts:70](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L70)

Note manager for handling deposit notes

#### Constructors

##### Constructor

> **new NoteManager**(`storage`): [`NoteManager`](#notemanager)

Defined in: [core/src/note.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L71)

###### Parameters

###### storage

[`NoteStorage`](#notestorage)

###### Returns

[`NoteManager`](#notemanager)

#### Methods

##### deleteNote()

> **deleteNote**(`commitment`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:161](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L161)

Delete a note (after spending)

###### Parameters

###### commitment

`string`

###### Returns

`Promise`\<`void`\>

##### exportNotes()

> **exportNotes**(): `Promise`\<`string`\>

Defined in: [core/src/note.ts:168](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L168)

Export notes as JSON for backup

###### Returns

`Promise`\<`string`\>

##### findBestNoteForPayment()

> **findBestNoteForPayment**(`token`, `amount`, `chainId?`): `Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

Defined in: [core/src/note.ts:120](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L120)

Find best note for a payment
Prefers smallest note that covers the amount

###### Parameters

###### token

`string`

###### amount

`bigint`

###### chainId?

[`ChainId`](#chainid-5)

###### Returns

`Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

##### getAllNotes()

> **getAllNotes**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:83](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L83)

Get all notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

##### getBalance()

> **getBalance**(`token`, `chainId?`): `Promise`\<`bigint`\>

Defined in: [core/src/note.ts:148](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L148)

Calculate total balance for a token

###### Parameters

###### token

`string`

###### chainId?

[`ChainId`](#chainid-5)

###### Returns

`Promise`\<`bigint`\>

##### getNotesByChain()

> **getNotesByChain**(`chainId`): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:90](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L90)

Get notes for a specific chain

###### Parameters

###### chainId

[`ChainId`](#chainid-5)

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

##### getNotesByToken()

> **getNotesByToken**(`token`): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:98](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L98)

Get notes for a specific token

###### Parameters

###### token

`string`

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

##### getNotesWithMinAmount()

> **getNotesWithMinAmount**(`token`, `minAmount`): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:106](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L106)

Get notes with minimum amount

###### Parameters

###### token

`string`

###### minAmount

`bigint`

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

##### importNotes()

> **importNotes**(`json`): `Promise`\<`number`\>

Defined in: [core/src/note.ts:181](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L181)

Import notes from JSON backup

###### Parameters

###### json

`string`

###### Returns

`Promise`\<`number`\>

##### saveNote()

> **saveNote**(`note`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:76](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L76)

Save a deposit note

###### Parameters

###### note

[`DepositNote`](#depositnote)

###### Returns

`Promise`\<`void`\>

***

### Px402Error

Defined in: [core/src/types.ts:192](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L192)

Px402 error class

#### Extends

- `Error`

#### Constructors

##### Constructor

> **new Px402Error**(`code`, `message`, `cause?`): [`Px402Error`](#px402error)

Defined in: [core/src/types.ts:193](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L193)

###### Parameters

###### code

[`Px402ErrorCode`](#px402errorcode)

###### message

`string`

###### cause?

`unknown`

###### Returns

[`Px402Error`](#px402error)

###### Overrides

`Error.constructor`

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Defined in: [core/src/types.ts:196](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L196)

###### Inherited from

`Error.cause`

##### code

> `readonly` **code**: [`Px402ErrorCode`](#px402errorcode)

Defined in: [core/src/types.ts:194](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L194)

***

### SchemeRegistry

Defined in: [core/src/scheme.ts:177](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L177)

Scheme registry for managing multiple payment schemes

#### Constructors

##### Constructor

> **new SchemeRegistry**(): [`SchemeRegistry`](#schemeregistry)

###### Returns

[`SchemeRegistry`](#schemeregistry)

#### Methods

##### createPayment()

> **createPayment**(`requirements`): `Promise`\<[`PaymentPayload`](#paymentpayload)\>

Defined in: [core/src/scheme.ts:218](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L218)

Create payment using appropriate scheme

###### Parameters

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Payment requirements

###### Returns

`Promise`\<[`PaymentPayload`](#paymentpayload)\>

##### findByNetwork()

> **findByNetwork**(`network`): [`X402Scheme`](#x402scheme)[]

Defined in: [core/src/scheme.ts:208](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L208)

Find schemes supporting a network

###### Parameters

###### network

`string`

Network identifier

###### Returns

[`X402Scheme`](#x402scheme)[]

##### get()

> **get**(`name`): [`X402Scheme`](#x402scheme) \| `undefined`

Defined in: [core/src/scheme.ts:193](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L193)

Get a scheme by name

###### Parameters

###### name

`string`

Scheme name

###### Returns

[`X402Scheme`](#x402scheme) \| `undefined`

Scheme or undefined

##### getNames()

> **getNames**(): `string`[]

Defined in: [core/src/scheme.ts:200](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L200)

Get all registered scheme names

###### Returns

`string`[]

##### register()

> **register**(`scheme`): `void`

Defined in: [core/src/scheme.ts:184](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L184)

Register a scheme

###### Parameters

###### scheme

[`X402Scheme`](#x402scheme)

Scheme to register

###### Returns

`void`

##### verifyPayment()

> **verifyPayment**(`payload`, `requirements`): `Promise`\<[`VerificationResult`](#verificationresult)\>

Defined in: [core/src/scheme.ts:231](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L231)

Verify payment using appropriate scheme

###### Parameters

###### payload

[`PaymentPayload`](#paymentpayload)

Payment payload

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Payment requirements

###### Returns

`Promise`\<[`VerificationResult`](#verificationresult)\>

## Interfaces

### DepositNote

Defined in: [core/src/types.ts:24](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L24)

Deposit note - proof of deposit into privacy pool
Contains both public and private data

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [core/src/types.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L38)

Deposit amount in smallest unit

##### chainId

> **chainId**: [`ChainId`](#chainid-5)

Defined in: [core/src/types.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L26)

Chain identifier

##### commitment

> **commitment**: `string`

Defined in: [core/src/types.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L30)

Commitment hash (public)

##### leafIndex

> **leafIndex**: `number`

Defined in: [core/src/types.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L36)

Merkle tree leaf index

##### nullifier

> **nullifier**: `string`

Defined in: [core/src/types.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L32)

Nullifier (private - used to prevent double spending)

##### poolAddress

> **poolAddress**: `string`

Defined in: [core/src/types.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L28)

Privacy pool address

##### secret

> **secret**: `string`

Defined in: [core/src/types.ts:34](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L34)

Secret (private - needed for withdrawal)

##### timestamp

> **timestamp**: `number`

Defined in: [core/src/types.ts:42](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L42)

Deposit timestamp (unix ms)

##### token

> **token**: `string`

Defined in: [core/src/types.ts:40](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L40)

Token identifier

***

### DepositParams

Defined in: [core/src/types.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L50)

Parameters for depositing into privacy pool

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [core/src/types.ts:54](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L54)

Amount to deposit in smallest unit

##### token

> **token**: `string`

Defined in: [core/src/types.ts:52](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L52)

Token to deposit

***

### DepositResult

Defined in: [core/src/types.ts:60](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L60)

Result of a successful deposit

#### Properties

##### note

> **note**: [`DepositNote`](#depositnote)

Defined in: [core/src/types.ts:64](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L64)

Deposit note

##### txHash

> **txHash**: `string`

Defined in: [core/src/types.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L62)

Transaction hash

***

### GenerateProofParams

Defined in: [core/src/provider.ts:23](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L23)

Parameters for generating payment proof

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [core/src/provider.ts:29](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L29)

Amount to pay

##### note

> **note**: [`DepositNote`](#depositnote)

Defined in: [core/src/provider.ts:25](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L25)

Deposit note to spend

##### recipient

> **recipient**: `string`

Defined in: [core/src/provider.ts:27](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L27)

Recipient address

##### relayer?

> `optional` **relayer**: [`RelayerConfig`](#relayerconfig)

Defined in: [core/src/provider.ts:31](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L31)

Optional relayer for anonymous transaction submission

***

### NoteStorage

Defined in: [core/src/note.ts:12](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L12)

Note storage interface
Implementations can store notes in memory, localStorage, or encrypted storage

#### Methods

##### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [core/src/note.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L36)

Clear all notes

###### Returns

`Promise`\<`void`\>

##### delete()

> **delete**(`commitment`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:31](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L31)

Delete a note

###### Parameters

###### commitment

`string`

###### Returns

`Promise`\<`void`\>

##### get()

> **get**(`commitment`): `Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

Defined in: [core/src/note.ts:21](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L21)

Get a note by commitment

###### Parameters

###### commitment

`string`

###### Returns

`Promise`\<[`DepositNote`](#depositnote) \| `undefined`\>

##### getAll()

> **getAll**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/note.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L26)

Get all notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

##### save()

> **save**(`note`): `Promise`\<`void`\>

Defined in: [core/src/note.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L16)

Save a note

###### Parameters

###### note

[`DepositNote`](#depositnote)

###### Returns

`Promise`\<`void`\>

***

### PaymentMetadata

Defined in: [core/src/types.ts:132](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L132)

Payment metadata included in proof

#### Properties

##### amount

> **amount**: `bigint`

Defined in: [core/src/types.ts:134](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L134)

Payment amount in smallest unit

##### timestamp

> **timestamp**: `number`

Defined in: [core/src/types.ts:138](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L138)

Payment timestamp (unix ms)

##### token

> **token**: `string`

Defined in: [core/src/types.ts:136](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L136)

Token identifier

***

### PaymentPayload

Defined in: [core/src/scheme.ts:37](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L37)

x402 PaymentPayload
Client sends this as proof of payment

#### Properties

##### network

> **network**: `string`

Defined in: [core/src/scheme.ts:43](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L43)

Network identifier

##### payload

> **payload**: `Record`\<`string`, `unknown`\>

Defined in: [core/src/scheme.ts:45](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L45)

Scheme-specific payload data

##### scheme

> **scheme**: `string`

Defined in: [core/src/scheme.ts:41](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L41)

Payment scheme name

##### x402Version

> **x402Version**: `number`

Defined in: [core/src/scheme.ts:39](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L39)

x402 protocol version

***

### PaymentProof

Defined in: [core/src/types.ts:116](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L116)

Payment proof for x402 verification
Proves payment was made without revealing sender

#### Properties

##### chainId

> **chainId**: [`ChainId`](#chainid-5)

Defined in: [core/src/types.ts:118](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L118)

Chain where payment was made

##### metadata

> **metadata**: [`PaymentMetadata`](#paymentmetadata)

Defined in: [core/src/types.ts:126](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L126)

Payment metadata

##### proof

> **proof**: `string`

Defined in: [core/src/types.ts:122](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L122)

Proof data (hex or signature)

##### proofType

> **proofType**: [`ProofType`](#prooftype-1)

Defined in: [core/src/types.ts:120](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L120)

Type of proof

##### publicInputs?

> `optional` **publicInputs**: `string`[]

Defined in: [core/src/types.ts:124](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L124)

Public inputs for ZK proof verification

***

### PaymentRequirements

Defined in: [core/src/scheme.ts:12](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L12)

x402 PaymentRequirements
Server returns this to specify payment requirements

#### Properties

##### asset

> **asset**: `string`

Defined in: [core/src/scheme.ts:24](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L24)

Asset identifier (token address or symbol)

##### description?

> `optional` **description**: `string`

Defined in: [core/src/scheme.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L28)

Payment description

##### extra?

> `optional` **extra**: `Record`\<`string`, `unknown`\>

Defined in: [core/src/scheme.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L30)

Additional scheme-specific fields

##### maxAmountRequired

> **maxAmountRequired**: `string`

Defined in: [core/src/scheme.ts:22](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L22)

Maximum amount required (string for precision)

##### network

> **network**: `string`

Defined in: [core/src/scheme.ts:18](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L18)

Network identifier (e.g., 'solana', 'base')

##### payTo

> **payTo**: `string`

Defined in: [core/src/scheme.ts:20](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L20)

Payment recipient address

##### resource?

> `optional` **resource**: `string`

Defined in: [core/src/scheme.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L26)

Resource identifier being paid for

##### scheme

> **scheme**: `string`

Defined in: [core/src/scheme.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L16)

Payment scheme name (e.g., 'exact', 'private-exact')

##### x402Version

> **x402Version**: `number`

Defined in: [core/src/scheme.ts:14](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L14)

x402 protocol version

***

### PoolInfo

Defined in: [core/src/types.ts:160](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L160)

Privacy pool information

#### Properties

##### address

> **address**: `string`

Defined in: [core/src/types.ts:162](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L162)

Pool address

##### chainId

> **chainId**: [`ChainId`](#chainid-5)

Defined in: [core/src/types.ts:170](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L170)

Chain identifier

##### denomination?

> `optional` **denomination**: `bigint`

Defined in: [core/src/types.ts:166](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L166)

Fixed deposit amount (if applicable)

##### depositCount

> **depositCount**: `number`

Defined in: [core/src/types.ts:168](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L168)

Total deposits count

##### token

> **token**: `string`

Defined in: [core/src/types.ts:164](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L164)

Supported token

***

### PrivacyProvider

Defined in: [core/src/provider.ts:48](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L48)

Privacy payment provider interface
All chain implementations must conform to this interface

#### Properties

##### chainId

> `readonly` **chainId**: [`ChainId`](#chainid-5)

Defined in: [core/src/provider.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L50)

Chain identifier

#### Methods

##### deleteNote()

> **deleteNote**(`commitment`): `Promise`\<`void`\>

Defined in: [core/src/provider.ts:133](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L133)

Delete a deposit note (after spending)

###### Parameters

###### commitment

`string`

Note commitment to delete

###### Returns

`Promise`\<`void`\>

##### deposit()

> **deposit**(`params`): `Promise`\<[`DepositResult`](#depositresult)\>

Defined in: [core/src/provider.ts:59](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L59)

Deposit funds into privacy pool

###### Parameters

###### params

[`DepositParams`](#depositparams)

Deposit parameters (token, amount)

###### Returns

`Promise`\<[`DepositResult`](#depositresult)\>

Deposit result with note

##### generatePaymentProof()

> **generatePaymentProof**(`params`): `Promise`\<[`PaymentProof`](#paymentproof)\>

Defined in: [core/src/provider.ts:91](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L91)

Generate payment proof for x402 verification
This executes a private withdrawal and returns proof

###### Parameters

###### params

[`GenerateProofParams`](#generateproofparams)

Proof generation parameters

###### Returns

`Promise`\<[`PaymentProof`](#paymentproof)\>

Payment proof

##### generateStealthAddress()

> **generateStealthAddress**(): `Promise`\<[`StealthAddress`](#stealthaddress)\>

Defined in: [core/src/provider.ts:107](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L107)

Generate one-time stealth address for receiving
Each transaction should use a new address

###### Returns

`Promise`\<[`StealthAddress`](#stealthaddress)\>

Stealth address

##### getNotes()

> **getNotes**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/provider.ts:115](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L115)

Get all deposit notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

List of deposit notes

##### getPools()

> **getPools**(`token?`): `Promise`\<[`PoolInfo`](#poolinfo)[]\>

Defined in: [core/src/provider.ts:81](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L81)

Get available privacy pools

###### Parameters

###### token?

`string`

Optional token filter

###### Returns

`Promise`\<[`PoolInfo`](#poolinfo)[]\>

List of pool info

##### getPrivateBalance()

> **getPrivateBalance**(`token`): `Promise`\<`bigint`\>

Defined in: [core/src/provider.ts:74](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L74)

Get private balance for a token
Sum of all unspent notes

###### Parameters

###### token

`string`

Token identifier

###### Returns

`Promise`\<`bigint`\>

Total private balance

##### getUnspentNotes()

> **getUnspentNotes**(): `Promise`\<[`DepositNote`](#depositnote)[]\>

Defined in: [core/src/provider.ts:121](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L121)

Get unspent deposit notes

###### Returns

`Promise`\<[`DepositNote`](#depositnote)[]\>

List of unspent notes

##### isNoteSpent()

> **isNoteSpent**(`commitment`): `Promise`\<`boolean`\>

Defined in: [core/src/provider.ts:140](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L140)

Check if a note has been spent

###### Parameters

###### commitment

`string`

Note commitment

###### Returns

`Promise`\<`boolean`\>

True if spent

##### saveNote()

> **saveNote**(`note`): `Promise`\<`void`\>

Defined in: [core/src/provider.ts:127](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L127)

Save a deposit note

###### Parameters

###### note

[`DepositNote`](#depositnote)

Note to save

###### Returns

`Promise`\<`void`\>

##### verifyPaymentProof()

> **verifyPaymentProof**(`proof`): `Promise`\<`boolean`\>

Defined in: [core/src/provider.ts:98](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L98)

Verify a payment proof

###### Parameters

###### proof

[`PaymentProof`](#paymentproof)

Payment proof to verify

###### Returns

`Promise`\<`boolean`\>

True if proof is valid

##### withdraw()

> **withdraw**(`params`): `Promise`\<[`WithdrawResult`](#withdrawresult)\>

Defined in: [core/src/provider.ts:66](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L66)

Withdraw funds from privacy pool

###### Parameters

###### params

[`WithdrawParams`](#withdrawparams)

Withdrawal parameters (note, recipient, relayer)

###### Returns

`Promise`\<[`WithdrawResult`](#withdrawresult)\>

Withdrawal result

***

### PrivacyProviderConfig

Defined in: [core/src/provider.ts:37](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L37)

Privacy provider configuration

#### Properties

##### rpcUrl

> **rpcUrl**: `string`

Defined in: [core/src/provider.ts:39](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L39)

RPC endpoint URL

##### wallet?

> `optional` **wallet**: `unknown`

Defined in: [core/src/provider.ts:41](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/provider.ts#L41)

Wallet or signer

***

### RelayerConfig

Defined in: [core/src/types.ts:98](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L98)

Relayer configuration for anonymous transactions

#### Properties

##### fee

> **fee**: `bigint`

Defined in: [core/src/types.ts:102](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L102)

Relayer fee in smallest unit

##### url

> **url**: `string`

Defined in: [core/src/types.ts:100](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L100)

Relayer API URL

***

### StealthAddress

Defined in: [core/src/types.ts:146](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L146)

One-time stealth address for receiving payments

#### Properties

##### address

> **address**: `string`

Defined in: [core/src/types.ts:148](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L148)

The stealth address

##### ephemeralPubKey?

> `optional` **ephemeralPubKey**: `string`

Defined in: [core/src/types.ts:150](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L150)

Ephemeral public key (for deriving)

##### viewTag?

> `optional` **viewTag**: `string`

Defined in: [core/src/types.ts:152](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L152)

View tag for efficient scanning

***

### VerificationResult

Defined in: [core/src/scheme.ts:51](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L51)

Payment verification result

#### Properties

##### details?

> `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: [core/src/scheme.ts:57](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L57)

Additional verification details

##### reason?

> `optional` **reason**: `string`

Defined in: [core/src/scheme.ts:55](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L55)

Reason for invalid payment

##### valid

> **valid**: `boolean`

Defined in: [core/src/scheme.ts:53](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L53)

Whether payment is valid

***

### WithdrawParams

Defined in: [core/src/types.ts:72](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L72)

Parameters for withdrawing from privacy pool

#### Properties

##### note

> **note**: [`DepositNote`](#depositnote)

Defined in: [core/src/types.ts:74](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L74)

Deposit note to spend

##### recipient

> **recipient**: `string`

Defined in: [core/src/types.ts:76](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L76)

Recipient address

##### relayer?

> `optional` **relayer**: [`RelayerConfig`](#relayerconfig)

Defined in: [core/src/types.ts:78](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L78)

Optional relayer for fee payment

***

### WithdrawResult

Defined in: [core/src/types.ts:84](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L84)

Result of a successful withdrawal

#### Properties

##### nullifierHash

> **nullifierHash**: `string`

Defined in: [core/src/types.ts:88](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L88)

Nullifier hash (used to mark note as spent)

##### recipient

> **recipient**: `string`

Defined in: [core/src/types.ts:90](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L90)

Recipient address

##### txHash

> **txHash**: `string`

Defined in: [core/src/types.ts:86](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L86)

Transaction hash

***

### X402Scheme

Defined in: [core/src/scheme.ts:66](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L66)

x402 Scheme interface
Defines payment scheme creation and verification logic

#### Properties

##### name

> `readonly` **name**: `string`

Defined in: [core/src/scheme.ts:68](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L68)

Scheme name (e.g., 'exact', 'private-exact')

##### supportedNetworks

> `readonly` **supportedNetworks**: `string`[]

Defined in: [core/src/scheme.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L71)

Supported networks for this scheme

#### Methods

##### createPayment()

> **createPayment**(`requirements`): `Promise`\<[`PaymentPayload`](#paymentpayload)\>

Defined in: [core/src/scheme.ts:78](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L78)

Create a payment for given requirements

###### Parameters

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Payment requirements from server

###### Returns

`Promise`\<[`PaymentPayload`](#paymentpayload)\>

Payment payload to send to server

##### supportsAsset()

> **supportsAsset**(`asset`, `network`): `Promise`\<`boolean`\>

Defined in: [core/src/scheme.ts:104](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L104)

Check if scheme supports an asset

###### Parameters

###### asset

`string`

Asset identifier

###### network

`string`

Network identifier

###### Returns

`Promise`\<`boolean`\>

True if supported

##### supportsNetwork()

> **supportsNetwork**(`network`): `boolean`

Defined in: [core/src/scheme.ts:96](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L96)

Check if scheme supports a network

###### Parameters

###### network

`string`

Network identifier

###### Returns

`boolean`

True if supported

##### verifyPayment()

> **verifyPayment**(`payload`, `requirements`): `Promise`\<[`VerificationResult`](#verificationresult)\>

Defined in: [core/src/scheme.ts:86](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L86)

Verify a payment (server-side)

###### Parameters

###### payload

[`PaymentPayload`](#paymentpayload)

Payment payload from client

###### requirements

[`PaymentRequirements`](#paymentrequirements)

Original payment requirements

###### Returns

`Promise`\<[`VerificationResult`](#verificationresult)\>

Verification result

## Type Aliases

### ChainId

> **ChainId** = `"solana"` \| `"ethereum"` \| `"base"` \| `"arbitrum"` \| `"polygon"`

Defined in: [core/src/types.ts:11](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L11)

Supported chain identifiers

***

### ProofType

> **ProofType** = `"groth16"` \| `"plonk"` \| `"transfer"`

Defined in: [core/src/types.ts:110](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L110)

Proof type enumeration

***

### TokenId

> **TokenId** = `string`

Defined in: [core/src/types.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/types.ts#L16)

Token identifier (mint address or symbol)

## Variables

### SCHEME\_NAMES

> `const` **SCHEME\_NAMES**: `object`

Defined in: [core/src/scheme.ts:248](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L248)

Standard x402 scheme names

#### Type Declaration

##### EXACT

> `readonly` **EXACT**: `"exact"` = `'exact'`

Standard exact payment (Coinbase x402)

##### PRIVATE\_EXACT

> `readonly` **PRIVATE\_EXACT**: `"private-exact"` = `'private-exact'`

Private exact payment (Px402)

***

### X402\_VERSION

> `const` **X402\_VERSION**: `1` = `1`

Defined in: [core/src/scheme.ts:258](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/scheme.ts#L258)

Standard x402 version

## Functions

### deserializeNote()

> **deserializeNote**(`encoded`): [`DepositNote`](#depositnote)

Defined in: [core/src/note.ts:227](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L227)

Deserialize a note string

#### Parameters

##### encoded

`string`

#### Returns

[`DepositNote`](#depositnote)

***

### serializeNote()

> **serializeNote**(`note`): `string`

Defined in: [core/src/note.ts:209](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/core/src/note.ts#L209)

Serialize a deposit note to string
Format: chainId:commitment:nullifier:secret:leafIndex:amount:token:timestamp

#### Parameters

##### note

[`DepositNote`](#depositnote)

#### Returns

`string`
