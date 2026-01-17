[**Px402 API Documentation v0.1.0**](../index.md)

***

[Px402 API Documentation](../index.md) / server/src

# server/src

## Classes

### MemoryNullifierRegistry

Defined in: [server/src/nullifier.ts:87](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L87)

In-memory nullifier registry implementation

#### Implements

- [`NullifierRegistry`](#nullifierregistry)

#### Constructors

##### Constructor

> **new MemoryNullifierRegistry**(`config`): [`MemoryNullifierRegistry`](#memorynullifierregistry)

Defined in: [server/src/nullifier.ts:92](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L92)

###### Parameters

###### config

[`NullifierRegistryConfig`](#nullifierregistryconfig) = `{}`

###### Returns

[`MemoryNullifierRegistry`](#memorynullifierregistry)

#### Methods

##### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [server/src/nullifier.ts:177](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L177)

Clear all entries (for testing)

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`NullifierRegistry`](#nullifierregistry).[`clear`](#clear-2)

##### getCount()

> **getCount**(): `Promise`\<`number`\>

Defined in: [server/src/nullifier.ts:173](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L173)

Get count of registered nullifiers

###### Returns

`Promise`\<`number`\>

###### Implementation of

[`NullifierRegistry`](#nullifierregistry).[`getCount`](#getcount-2)

##### getUsageInfo()

> **getUsageInfo**(`nullifier`): `Promise`\<[`NullifierInfo`](#nullifierinfo) \| `null`\>

Defined in: [server/src/nullifier.ts:158](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L158)

Get usage information for a nullifier

###### Parameters

###### nullifier

`string`

###### Returns

`Promise`\<[`NullifierInfo`](#nullifierinfo) \| `null`\>

###### Implementation of

[`NullifierRegistry`](#nullifierregistry).[`getUsageInfo`](#getusageinfo-2)

##### isUsed()

> **isUsed**(`nullifier`): `Promise`\<`boolean`\>

Defined in: [server/src/nullifier.ts:143](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L143)

Check if a nullifier has been used

###### Parameters

###### nullifier

`string`

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

[`NullifierRegistry`](#nullifierregistry).[`isUsed`](#isused-2)

##### register()

> **register**(`info`): `Promise`\<`boolean`\>

Defined in: [server/src/nullifier.ts:116](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L116)

Register a nullifier as used

###### Parameters

###### info

[`NullifierInfo`](#nullifierinfo)

###### Returns

`Promise`\<`boolean`\>

false if nullifier already exists (double-spend attempt)

###### Implementation of

[`NullifierRegistry`](#nullifierregistry).[`register`](#register-2)

##### stop()

> **stop**(): `void`

Defined in: [server/src/nullifier.ts:109](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L109)

Stop cleanup timer

###### Returns

`void`

***

### PaymentVerifier

Defined in: [server/src/verifier.ts:17](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L17)

Payment Verifier
Verifies payment proofs against requirements

#### Constructors

##### Constructor

> **new PaymentVerifier**(`config`): [`PaymentVerifier`](#paymentverifier)

Defined in: [server/src/verifier.ts:20](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L20)

###### Parameters

###### config

[`VerifierConfig`](#verifierconfig)

###### Returns

[`PaymentVerifier`](#paymentverifier)

#### Methods

##### getScheme()

> **getScheme**(`name`): `X402Scheme` \| `undefined`

Defined in: [server/src/verifier.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L36)

Get a registered scheme

###### Parameters

###### name

`string`

###### Returns

`X402Scheme` \| `undefined`

##### getSchemeNames()

> **getSchemeNames**(): `string`[]

Defined in: [server/src/verifier.ts:43](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L43)

Get all registered scheme names

###### Returns

`string`[]

##### registerScheme()

> **registerScheme**(`scheme`): `void`

Defined in: [server/src/verifier.ts:29](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L29)

Register a payment scheme

###### Parameters

###### scheme

`X402Scheme`

###### Returns

`void`

##### verify()

> **verify**(`paymentHeader`, `requirements`): `Promise`\<`VerificationResult`\>

Defined in: [server/src/verifier.ts:50](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L50)

Verify payment from header string

###### Parameters

###### paymentHeader

`string`

###### requirements

`PaymentRequirements`

###### Returns

`Promise`\<`VerificationResult`\>

##### verifyPayload()

> **verifyPayload**(`payload`, `requirements`): `Promise`\<`VerificationResult`\>

Defined in: [server/src/verifier.ts:108](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L108)

Verify payment payload directly

###### Parameters

###### payload

`PaymentPayload`

###### requirements

`PaymentRequirements`

###### Returns

`Promise`\<`VerificationResult`\>

## Interfaces

### ExpressRequest

Defined in: [server/src/types.ts:61](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L61)

Express-like request interface

#### Properties

##### headers

> **headers**: `Record`\<`string`, `string` \| `string`[] \| `undefined`\>

Defined in: [server/src/types.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L62)

##### method?

> `optional` **method**: `string`

Defined in: [server/src/types.ts:65](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L65)

##### path?

> `optional` **path**: `string`

Defined in: [server/src/types.ts:63](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L63)

##### paymentRequirements?

> `optional` **paymentRequirements**: `PaymentRequirements`

Defined in: [server/src/types.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L69)

Payment requirements for the route

##### paymentResult?

> `optional` **paymentResult**: `VerificationResult`

Defined in: [server/src/types.ts:67](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L67)

Payment result attached by middleware

##### url?

> `optional` **url**: `string`

Defined in: [server/src/types.ts:64](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L64)

***

### ExpressResponse

Defined in: [server/src/types.ts:75](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L75)

Express-like response interface

#### Methods

##### json()

> **json**(`body`): [`ExpressResponse`](#expressresponse)

Defined in: [server/src/types.ts:77](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L77)

###### Parameters

###### body

`unknown`

###### Returns

[`ExpressResponse`](#expressresponse)

##### send()

> **send**(`body?`): [`ExpressResponse`](#expressresponse)

Defined in: [server/src/types.ts:80](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L80)

###### Parameters

###### body?

`unknown`

###### Returns

[`ExpressResponse`](#expressresponse)

##### set()

> **set**(`name`, `value`): [`ExpressResponse`](#expressresponse)

Defined in: [server/src/types.ts:79](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L79)

###### Parameters

###### name

`string`

###### value

`string`

###### Returns

[`ExpressResponse`](#expressresponse)

##### setHeader()

> **setHeader**(`name`, `value`): [`ExpressResponse`](#expressresponse)

Defined in: [server/src/types.ts:78](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L78)

###### Parameters

###### name

`string`

###### value

`string`

###### Returns

[`ExpressResponse`](#expressresponse)

##### status()

> **status**(`code`): [`ExpressResponse`](#expressresponse)

Defined in: [server/src/types.ts:76](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L76)

###### Parameters

###### code

`number`

###### Returns

[`ExpressResponse`](#expressresponse)

***

### NullifierInfo

Defined in: [server/src/nullifier.ts:10](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L10)

Nullifier usage information

#### Properties

##### amount

> **amount**: `string`

Defined in: [server/src/nullifier.ts:21](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L21)

Payment amount

##### nullifier

> **nullifier**: `string`

Defined in: [server/src/nullifier.ts:12](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L12)

The nullifier hash

##### recipient

> **recipient**: `string`

Defined in: [server/src/nullifier.ts:27](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L27)

Recipient address

##### registeredAt

> **registeredAt**: `number`

Defined in: [server/src/nullifier.ts:18](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L18)

Timestamp when registered

##### token

> **token**: `string`

Defined in: [server/src/nullifier.ts:24](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L24)

Token

##### txSignature

> **txSignature**: `string`

Defined in: [server/src/nullifier.ts:15](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L15)

Transaction signature that used this nullifier

***

### NullifierRegistry

Defined in: [server/src/nullifier.ts:47](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L47)

Nullifier registry interface

#### Methods

##### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [server/src/nullifier.ts:72](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L72)

Clear all entries (for testing)

###### Returns

`Promise`\<`void`\>

##### getCount()

> **getCount**(): `Promise`\<`number`\>

Defined in: [server/src/nullifier.ts:67](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L67)

Get count of registered nullifiers

###### Returns

`Promise`\<`number`\>

##### getUsageInfo()

> **getUsageInfo**(`nullifier`): `Promise`\<[`NullifierInfo`](#nullifierinfo) \| `null`\>

Defined in: [server/src/nullifier.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L62)

Get usage information for a nullifier

###### Parameters

###### nullifier

`string`

###### Returns

`Promise`\<[`NullifierInfo`](#nullifierinfo) \| `null`\>

##### isUsed()

> **isUsed**(`nullifier`): `Promise`\<`boolean`\>

Defined in: [server/src/nullifier.ts:57](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L57)

Check if a nullifier has been used

###### Parameters

###### nullifier

`string`

###### Returns

`Promise`\<`boolean`\>

##### register()

> **register**(`info`): `Promise`\<`boolean`\>

Defined in: [server/src/nullifier.ts:52](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L52)

Register a nullifier as used

###### Parameters

###### info

[`NullifierInfo`](#nullifierinfo)

###### Returns

`Promise`\<`boolean`\>

false if nullifier already exists (double-spend attempt)

***

### NullifierRegistryConfig

Defined in: [server/src/nullifier.ts:33](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L33)

Nullifier registry configuration

#### Properties

##### cleanupInterval?

> `optional` **cleanupInterval**: `number`

Defined in: [server/src/nullifier.ts:41](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L41)

Cleanup interval (ms)

##### maxEntries?

> `optional` **maxEntries**: `number`

Defined in: [server/src/nullifier.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L38)

Maximum entries before cleanup

##### ttl?

> `optional` **ttl**: `number`

Defined in: [server/src/nullifier.ts:35](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L35)

TTL for nullifier entries (ms), 0 = never expire

***

### Px402MiddlewareConfig

Defined in: [server/src/types.ts:23](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L23)

Middleware configuration

#### Properties

##### onPaymentFailed()?

> `optional` **onPaymentFailed**: (`req`, `error`) => `void`

Defined in: [server/src/types.ts:32](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L32)

Callback when payment fails

###### Parameters

###### req

[`ExpressRequest`](#expressrequest)

###### error

`Error`

###### Returns

`void`

##### onPaymentVerified()?

> `optional` **onPaymentVerified**: (`req`, `result`) => `void`

Defined in: [server/src/types.ts:27](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L27)

Callback when payment is verified

###### Parameters

###### req

[`ExpressRequest`](#expressrequest)

###### result

`VerificationResult`

###### Returns

`void`

##### schemes

> **schemes**: `X402Scheme`[]

Defined in: [server/src/types.ts:25](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L25)

Payment schemes to use

***

### RequirePaymentOptions

Defined in: [server/src/types.ts:41](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L41)

Options for requiring payment on a route

#### Properties

##### amount

> **amount**: `string`

Defined in: [server/src/types.ts:43](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L43)

Amount required (in smallest unit)

##### description?

> `optional` **description**: `string`

Defined in: [server/src/types.ts:53](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L53)

Description of the payment

##### network?

> `optional` **network**: `string`

Defined in: [server/src/types.ts:51](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L51)

Network name (default: 'solana')

##### recipient

> **recipient**: `string`

Defined in: [server/src/types.ts:47](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L47)

Recipient address

##### resource?

> `optional` **resource**: `string`

Defined in: [server/src/types.ts:55](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L55)

Resource identifier

##### scheme?

> `optional` **scheme**: `string`

Defined in: [server/src/types.ts:49](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L49)

Scheme name (default: 'private-exact')

##### token

> **token**: `string`

Defined in: [server/src/types.ts:45](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L45)

Token to accept

***

### VerifierConfig

Defined in: [server/src/types.ts:15](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L15)

Payment verifier configuration

#### Properties

##### schemes

> **schemes**: `X402Scheme`[]

Defined in: [server/src/types.ts:17](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L17)

Payment schemes to use for verification

## Type Aliases

### ExpressHandler()

> **ExpressHandler** = (`req`, `res`, `next`) => `void` \| `Promise`\<`void`\>

Defined in: [server/src/types.ts:91](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L91)

Express-like request handler

#### Parameters

##### req

[`ExpressRequest`](#expressrequest)

##### res

[`ExpressResponse`](#expressresponse)

##### next

[`ExpressNextFunction`](#expressnextfunction)

#### Returns

`void` \| `Promise`\<`void`\>

***

### ExpressNextFunction()

> **ExpressNextFunction** = (`error?`) => `void`

Defined in: [server/src/types.ts:86](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L86)

Express-like next function

#### Parameters

##### error?

`unknown`

#### Returns

`void`

## Variables

### X402\_HEADERS

> `const` **X402\_HEADERS**: `object`

Defined in: [server/src/types.ts:100](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L100)

x402 header names

#### Type Declaration

##### PAYMENT

> `readonly` **PAYMENT**: `"x-payment"` = `'x-payment'`

##### PAYMENT\_REQUIREMENTS

> `readonly` **PAYMENT\_REQUIREMENTS**: `"x-payment-requirements"` = `'x-payment-requirements'`

##### VERSION

> `readonly` **VERSION**: `"x-402-version"` = `'x-402-version'`

***

### X402\_VERSION

> `const` **X402\_VERSION**: `1` = `1`

Defined in: [server/src/types.ts:109](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/types.ts#L109)

x402 protocol version

## Functions

### createNullifierRegistry()

> **createNullifierRegistry**(`config?`): [`NullifierRegistry`](#nullifierregistry)

Defined in: [server/src/nullifier.ts:233](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L233)

Create nullifier registry

#### Parameters

##### config?

[`NullifierRegistryConfig`](#nullifierregistryconfig)

#### Returns

[`NullifierRegistry`](#nullifierregistry)

***

### createPaymentRequirements()

> **createPaymentRequirements**(`options`): `PaymentRequirements`

Defined in: [server/src/middleware.ts:20](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/middleware.ts#L20)

Create payment requirements from options

#### Parameters

##### options

[`RequirePaymentOptions`](#requirepaymentoptions)

#### Returns

`PaymentRequirements`

***

### createRequirePayment()

> **createRequirePayment**(`config`): (`options`) => [`ExpressHandler`](#expresshandler)

Defined in: [server/src/middleware.ts:154](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/middleware.ts#L154)

Create a standalone requirePayment middleware with verifier

#### Parameters

##### config

[`Px402MiddlewareConfig`](#px402middlewareconfig)

#### Returns

> (`options`): [`ExpressHandler`](#expresshandler)

##### Parameters

###### options

[`RequirePaymentOptions`](#requirepaymentoptions)

##### Returns

[`ExpressHandler`](#expresshandler)

***

### createVerifier()

> **createVerifier**(`config`): [`PaymentVerifier`](#paymentverifier)

Defined in: [server/src/verifier.ts:170](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/verifier.ts#L170)

Create a payment verifier instance

#### Parameters

##### config

[`VerifierConfig`](#verifierconfig)

#### Returns

[`PaymentVerifier`](#paymentverifier)

***

### getGlobalNullifierRegistry()

> **getGlobalNullifierRegistry**(): [`NullifierRegistry`](#nullifierregistry)

Defined in: [server/src/nullifier.ts:247](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L247)

Get or create global nullifier registry

#### Returns

[`NullifierRegistry`](#nullifierregistry)

***

### px402Middleware()

> **px402Middleware**(`config`): [`ExpressHandler`](#expresshandler)

Defined in: [server/src/middleware.ts:59](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/middleware.ts#L59)

Global middleware to handle X-Payment header verification
Attaches payment result to request if payment header is present

#### Parameters

##### config

[`Px402MiddlewareConfig`](#px402middlewareconfig)

#### Returns

[`ExpressHandler`](#expresshandler)

***

### requirePayment()

> **requirePayment**(`options`): [`ExpressHandler`](#expresshandler)

Defined in: [server/src/middleware.ts:106](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/middleware.ts#L106)

Route-level middleware to require payment

#### Parameters

##### options

[`RequirePaymentOptions`](#requirepaymentoptions)

#### Returns

[`ExpressHandler`](#expresshandler)

***

### send402Response()

> **send402Response**(`res`, `requirements`): `void`

Defined in: [server/src/middleware.ts:38](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/middleware.ts#L38)

Send 402 Payment Required response

#### Parameters

##### res

[`ExpressResponse`](#expressresponse)

##### requirements

`PaymentRequirements`

#### Returns

`void`

***

### setGlobalNullifierRegistry()

> **setGlobalNullifierRegistry**(`registry`): `void`

Defined in: [server/src/nullifier.ts:257](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/server/src/nullifier.ts#L257)

Set global nullifier registry (for testing or custom implementations)

#### Parameters

##### registry

[`NullifierRegistry`](#nullifierregistry)

#### Returns

`void`
