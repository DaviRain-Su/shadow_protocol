[**Px402 API Documentation v0.1.0**](../index.md)

***

[Px402 API Documentation](../index.md) / client/src

# client/src

## Classes

### Px402Client

Defined in: [client/src/client.ts:36](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L36)

Px402 Client
Automatically handles HTTP 402 Payment Required responses

#### Constructors

##### Constructor

> **new Px402Client**(`config`): [`Px402Client`](#px402client)

Defined in: [client/src/client.ts:44](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L44)

###### Parameters

###### config

[`Px402ClientConfig`](#px402clientconfig)

###### Returns

[`Px402Client`](#px402client)

#### Methods

##### fetch()

> **fetch**(`url`, `init?`): `Promise`\<[`Px402Response`](#px402response)\>

Defined in: [client/src/client.ts:111](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L111)

Fetch with automatic 402 payment handling

###### Parameters

###### url

`string`

###### init?

[`Px402RequestInit`](#px402requestinit)

###### Returns

`Promise`\<[`Px402Response`](#px402response)\>

##### getBalance()

> **getBalance**(`token`): `Promise`\<`bigint`\>

Defined in: [client/src/client.ts:97](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L97)

Get current private balance for a token

###### Parameters

###### token

`string`

###### Returns

`Promise`\<`bigint`\>

##### getProvider()

> **getProvider**(): `PrivacyProvider`

Defined in: [client/src/client.ts:104](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L104)

Get the underlying privacy provider

###### Returns

`PrivacyProvider`

##### getScheme()

> **getScheme**(`name`): `X402Scheme` \| `undefined`

Defined in: [client/src/client.ts:83](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L83)

Get a registered scheme by name

###### Parameters

###### name

`string`

###### Returns

`X402Scheme` \| `undefined`

##### getSchemeNames()

> **getSchemeNames**(): `string`[]

Defined in: [client/src/client.ts:90](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L90)

Get all registered scheme names

###### Returns

`string`[]

##### getTransport()

> **getTransport**(): [`Transport`](#transport-1) \| `undefined`

Defined in: [client/src/client.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L69)

Get the transport (if available)

###### Returns

[`Transport`](#transport-1) \| `undefined`

##### hasTransport()

> **hasTransport**(): `boolean`

Defined in: [client/src/client.ts:62](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L62)

Check if relay transport is available

###### Returns

`boolean`

##### registerScheme()

> **registerScheme**(`scheme`): `void`

Defined in: [client/src/client.ts:76](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L76)

Register a payment scheme

###### Parameters

###### scheme

`X402Scheme`

###### Returns

`void`

***

### Px402Error

Defined in: [client/src/client.ts:317](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L317)

Px402 Client Error

#### Extends

- `Error`

#### Constructors

##### Constructor

> **new Px402Error**(`code`, `message`, `cause?`): [`Px402Error`](#px402error)

Defined in: [client/src/client.ts:318](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L318)

###### Parameters

###### code

`string`

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

Defined in: [client/src/client.ts:321](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L321)

###### Inherited from

`Error.cause`

##### code

> `readonly` **code**: `string`

Defined in: [client/src/client.ts:319](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L319)

## Interfaces

### PaymentOptions

Defined in: [client/src/types.ts:63](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L63)

Payment options for a request

#### Properties

##### maxAmount

> **maxAmount**: `string`

Defined in: [client/src/types.ts:65](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L65)

Maximum amount willing to pay

##### mode?

> `optional` **mode**: [`PaymentMode`](#paymentmode)

Defined in: [client/src/types.ts:69](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L69)

Override default payment mode

##### scheme?

> `optional` **scheme**: `string`

Defined in: [client/src/types.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L71)

Preferred scheme name

##### token

> **token**: `string`

Defined in: [client/src/types.ts:67](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L67)

Token to pay with

***

### PaymentResult

Defined in: [client/src/types.ts:99](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L99)

Payment result information

#### Properties

##### amount?

> `optional` **amount**: `string`

Defined in: [client/src/types.ts:105](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L105)

Amount paid (if any)

##### mode?

> `optional` **mode**: [`PaymentMode`](#paymentmode)

Defined in: [client/src/types.ts:111](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L111)

Payment mode used

##### proof?

> `optional` **proof**: `string`

Defined in: [client/src/types.ts:109](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L109)

Transaction hash/proof

##### required

> **required**: `boolean`

Defined in: [client/src/types.ts:101](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L101)

Whether payment was required

##### success

> **success**: `boolean`

Defined in: [client/src/types.ts:103](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L103)

Whether payment was successful

##### token?

> `optional` **token**: `string`

Defined in: [client/src/types.ts:107](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L107)

Token used

***

### Px402ClientConfig

Defined in: [client/src/types.ts:45](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L45)

Px402 client configuration

#### Properties

##### defaultMode?

> `optional` **defaultMode**: [`PaymentMode`](#paymentmode)

Defined in: [client/src/types.ts:51](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L51)

Default payment mode

##### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [client/src/types.ts:53](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L53)

Maximum retry attempts for payment

##### paymentTimeout?

> `optional` **paymentTimeout**: `number`

Defined in: [client/src/types.ts:55](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L55)

Timeout for payment verification (ms)

##### provider

> **provider**: `PrivacyProvider`

Defined in: [client/src/types.ts:47](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L47)

Privacy provider instance

##### schemes?

> `optional` **schemes**: `X402Scheme`[]

Defined in: [client/src/types.ts:49](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L49)

Payment schemes to use

##### transport?

> `optional` **transport**: [`Transport`](#transport-1)

Defined in: [client/src/types.ts:57](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L57)

Custom transport (e.g., RelayTransport for anonymity)

***

### Px402RequestInit

Defined in: [client/src/types.ts:89](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L89)

Extended RequestInit with payment options

#### Extends

- `RequestInit`

#### Properties

##### payment?

> `optional` **payment**: [`PaymentOptions`](#paymentoptions)

Defined in: [client/src/types.ts:91](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L91)

Payment configuration

##### relay?

> `optional` **relay**: [`RelayOptions`](#relayoptions)

Defined in: [client/src/types.ts:93](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L93)

Relay configuration (requires transport in client config)

***

### Px402Response

Defined in: [client/src/types.ts:117](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L117)

Response with payment metadata

#### Extends

- `Response`

#### Properties

##### paymentResult?

> `optional` **paymentResult**: [`PaymentResult`](#paymentresult)

Defined in: [client/src/types.ts:119](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L119)

Payment result information

***

### RelayOptions

Defined in: [client/src/types.ts:77](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L77)

Relay configuration for request

#### Properties

##### enabled

> **enabled**: `boolean`

Defined in: [client/src/types.ts:79](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L79)

Use relay network for this request

##### hops?

> `optional` **hops**: `number`

Defined in: [client/src/types.ts:81](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L81)

Number of relay hops (default: 3)

##### maxFee?

> `optional` **maxFee**: `string`

Defined in: [client/src/types.ts:83](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L83)

Maximum relay fee willing to pay

***

### Transport

Defined in: [client/src/types.ts:24](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L24)

Transport interface for custom HTTP routing (e.g., relay network)

#### Methods

##### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [client/src/types.ts:26](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L26)

Connect to transport layer

###### Returns

`Promise`\<`void`\>

##### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [client/src/types.ts:28](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L28)

Disconnect from transport layer

###### Returns

`Promise`\<`void`\>

##### isConnected()

> **isConnected**(): `boolean`

Defined in: [client/src/types.ts:39](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L39)

Check if connected

###### Returns

`boolean`

##### request()

> **request**(`url`, `options?`): `Promise`\<[`TransportResponse`](#transportresponse)\>

Defined in: [client/src/types.ts:30](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L30)

Send request through transport

###### Parameters

###### url

`string`

###### options?

###### body?

`string`

###### headers?

`Record`\<`string`, `string`\>

###### method?

`string`

###### Returns

`Promise`\<[`TransportResponse`](#transportresponse)\>

***

### TransportResponse

Defined in: [client/src/types.ts:15](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L15)

Transport response type

#### Properties

##### body

> **body**: `string`

Defined in: [client/src/types.ts:18](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L18)

##### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [client/src/types.ts:17](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L17)

##### status

> **status**: `number`

Defined in: [client/src/types.ts:16](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L16)

## Type Aliases

### PaymentMode

> **PaymentMode** = `"public"` \| `"private"`

Defined in: [client/src/types.ts:10](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L10)

Payment mode

## Variables

### X402\_HEADERS

> `const` **X402\_HEADERS**: `object`

Defined in: [client/src/types.ts:125](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L125)

x402 header names

#### Type Declaration

##### PAYMENT

> `readonly` **PAYMENT**: `"X-Payment"` = `'X-Payment'`

Payment payload header

##### PAYMENT\_REQUIREMENTS

> `readonly` **PAYMENT\_REQUIREMENTS**: `"X-Payment-Requirements"` = `'X-Payment-Requirements'`

Payment requirements (in 402 response)

##### VERSION

> `readonly` **VERSION**: `"X-402-Version"` = `'X-402-Version'`

Payment version

***

### X402\_VERSION

> `const` **X402\_VERSION**: `1` = `1`

Defined in: [client/src/types.ts:137](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/types.ts#L137)

x402 protocol version

## Functions

### create402Headers()

> **create402Headers**(`requirements`): `Record`\<`string`, `string`\>

Defined in: [client/src/http.ts:120](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L120)

Create 402 response headers

#### Parameters

##### requirements

`PaymentRequirements`

#### Returns

`Record`\<`string`, `string`\>

***

### createPaymentHeader()

> **createPaymentHeader**(`payload`): `string`

Defined in: [client/src/http.ts:71](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L71)

Create payment header value from payload

#### Parameters

##### payload

`PaymentPayload`

#### Returns

`string`

***

### createPaymentHeaderBase64()

> **createPaymentHeaderBase64**(`payload`): `string`

Defined in: [client/src/http.ts:78](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L78)

Create payment header value (Base64 encoded)

#### Parameters

##### payload

`PaymentPayload`

#### Returns

`string`

***

### createPx402Client()

> **createPx402Client**(`config`): [`Px402Client`](#px402client)

Defined in: [client/src/client.ts:331](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/client.ts#L331)

Create a Px402 client instance

#### Parameters

##### config

[`Px402ClientConfig`](#px402clientconfig)

#### Returns

[`Px402Client`](#px402client)

***

### is402Response()

> **is402Response**(`response`): `boolean`

Defined in: [client/src/http.ts:113](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L113)

Check if response is a 402 Payment Required

#### Parameters

##### response

`Response`

#### Returns

`boolean`

***

### parsePaymentHeader()

> **parsePaymentHeader**(`header`): `PaymentPayload` \| `null`

Defined in: [client/src/http.ts:90](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L90)

Parse payment header from request

#### Parameters

##### header

`string`

#### Returns

`PaymentPayload` \| `null`

***

### parsePaymentRequirements()

> **parsePaymentRequirements**(`response`): `PaymentRequirements` \| `null`

Defined in: [client/src/http.ts:11](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L11)

Parse payment requirements from 402 response

#### Parameters

##### response

`Response`

#### Returns

`PaymentRequirements` \| `null`

***

### parsePaymentRequirementsFromBody()

> **parsePaymentRequirementsFromBody**(`response`): `Promise`\<`PaymentRequirements` \| `null`\>

Defined in: [client/src/http.ts:44](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L44)

Parse payment requirements from response body (fallback)

#### Parameters

##### response

`Response`

#### Returns

`Promise`\<`PaymentRequirements` \| `null`\>

***

### validatePaymentRequirements()

> **validatePaymentRequirements**(`requirements`): `object`

Defined in: [client/src/http.ts:133](https://github.com/DaviRain-Su/shadow_protocol/blob/6aaf3f7e7bc1e8c081d9b4fd0956abd27ad1a461/packages/client/src/http.ts#L133)

Validate payment requirements

#### Parameters

##### requirements

`PaymentRequirements`

#### Returns

`object`

##### error?

> `optional` **error**: `string`

##### valid

> **valid**: `boolean`
