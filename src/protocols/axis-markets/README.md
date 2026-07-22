# Axis Markets Indexer SDK

> A TypeScript SDK extension for querying Axis Markets data from the Stellar Indexer API.

The `AxisMarketsIndexerSdk` extends the base `StellarIndexerSdk` to provide typed access to Axis Markets protocol data —
orders, trades, swaps, and market depth — with runtime validation powered by [Valibot](https://valibot.dev/).

This extension requires a token that has access to the contracts' data package and to the events archive package.

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Supported Networks](#supported-networks)
- [API Reference](#api-reference)
    - [Order Methods](#order-methods)
    - [Trade Methods](#trade-methods)
    - [Swap Methods](#swap-methods)
    - [Market Depth Methods](#market-depth-methods)
    - [Network Methods](#network-methods)
- [Types & Schemas](#types--schemas)
- [How It Works](#how-it-works)
- [Examples](#examples)

---

## Installation

This library works with any server-side JavaScript environment: Deno, Bun and Node.js. To install the base library (
which includes the protocol extensions), you can do:

```textmate
npx jsr add @stellar-indexer/stellar-indexer-sdk
```

> You can check more download options here: https://jsr.io/@stellar-indexer/stellar-indexer-sdk

---

## Features

- **Runtime validation** — Inputs and API responses are validated with [Valibot](https://valibot.dev/) schemas.
- **Network switching** — Change the target Stellar network at runtime via `setNetwork`.
- **BigInt-safe** — Numeric fields (amounts, prices, IDs) are coerced from strings into `bigint` to avoid precision
  loss.
- **WASM-powered XDR parsing** — Automatically initializes `@stellar/stellar-xdr-json` for decoding Stellar contract
  event topics/data.
- **Authenticated requests** — Requests are sent with a Bearer token through
  [`wretch`](https://github.com/elbywan/wretch).
- **Fully typed** — Complete TypeScript types for every parameter and result.
- **Base SDK methods included** — Since `AxisMarketsIndexerSdk` extends `StellarIndexerSdk`, you can also call base
  class methods like `fetchContractData` directly on the same instance.

---

## Quick Start

To start the SDK, you need to provide a `consumer token` with access to the contracts' data package and to the events
archive package.

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { AxisMarketsIndexerSdk } from "@creit-tech/stellar-indexer-sdk/axis-markets";

const sdk = new AxisMarketsIndexerSdk({
  consumerToken: "CONSUMER_TOKEN",
  network: Networks.TESTNET,
});

// Query orders for a specific owner
const orders = await sdk.queryOrders({
  owner: "GABC...XYZ",
  limit: 100,
});
console.log(orders.length);

// Fetch a single order by ID
const order = await sdk.fetchOrder(42n);
console.log(order.owner, order.kind);
```

> **Note:** The kit uses the `@stellar/stellar-xdr-json` library, which needs to use WASM, so the kit will automatically
> start it, but if you prefer to do it yourself, you can pass `skipWASM: true` when starting the kit.
>
> **Note for Deno users:** You need to provide the path to the `.wasm` module in the `--allow-read=PATH_HERE` option (or
> just `--allow-read` to allow all reads).

---

## Configuration

The `AxisMarketsIndexerSdk` constructor accepts an `AxisMarketsIndexerParamsInput` object that extends the base SDK
params.

### Required

| Parameter       | Type     | Description                                                                                                                            |
|-----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------|
| `consumerToken` | `string` | Bearer token used to authenticate against the Stellar Indexer API. Requires access to the contracts' data and events archive packages. |

### Network Selection

| Parameter | Type                  | Description                                                                                               |
|-----------|-----------------------|-----------------------------------------------------------------------------------------------------------|
| `network` | `Networks`            | Selects the API endpoint. Defaults to `PUBLIC`. Note: Axis Markets is currently only deployed on Testnet. |
| `apiUrl`  | `string` *(optional)* | Override the API base URL. If omitted, it's derived from `network`.                                       |

### Additional Options *(all optional, with defaults)*

| Parameter  | Type      | Default | Description                                     |
|------------|-----------|---------|-------------------------------------------------|
| `skipWASM` | `boolean` | `false` | Skip WASM initialization (disable XDR parsing). |

> Config is validated against `AxisMarketsIndexerParamsSchema` at construction time — invalid input throws immediately.

### Example: Custom Configuration

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { AxisMarketsIndexerSdk } from "@creit-tech/stellar-indexer-sdk/axis-markets";

const sdk = new AxisMarketsIndexerSdk({
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
  network: Networks.TESTNET,
  skipWASM: false,
});
```

---

## Supported Networks

Axis Markets is currently only deployed on **Testnet**. The contract ID is:

```typescript
export const AXIS_MARKETS_TESTNET =
  "CCJQB4EEQLBL7RHIPYMYG26ZT2QRKEYNGVWWL2EPZCECFI6GZGNXMIEX";
```

A helper is exported to resolve the contract ID for a given network:

```typescript
import { getAxisMarketsContractId } from "@creit-tech/stellar-indexer-sdk/axis-markets/schemas";
import { Networks } from "@stellar/stellar-sdk";

getAxisMarketsContractId(Networks.TESTNET); // ✅ returns the contract ID
getAxisMarketsContractId(Networks.PUBLIC);  // ❌ throws — not deployed
```

> ⚠️ Calling `getAxisMarketsContractId` with `PUBLIC`, `FUTURENET`, `SANDBOX`, or `STANDALONE` throws, since the
> contract is not available there.

---

## API Reference

All methods are `async` and return validated, typed data. WASM is initialized lazily on first call (unless `skipWASM` is
set).

### Order Methods

#### `queryOrders(params): Promise<AxisMarketsOrderOutput[]>`

Fetches **orders**. At least one of `owner`, `buying`, or `selling` must be provided. Results are returned from most
recently updated to oldest.

| Parameter | Type                               | Description                    |
|-----------|------------------------------------|--------------------------------|
| `params`  | `AxisMarketsFetchUserOrdersParams` | Query & pagination (optional). |

`AxisMarketsFetchUserOrdersParams`:

| Field                 | Type      | Default | Notes                                             |
|-----------------------|-----------|---------|---------------------------------------------------|
| `owner`               | `string`  | —       | The owner of the order.                           |
| `buying`              | `string`  | —       | The buying asset (contract).                      |
| `selling`             | `string`  | —       | The selling asset (contract).                     |
| `includeClosedOrders` | `boolean` | `false` | Include orders already removed from the contract. |
| `limit`               | `number`  | `100`   | Max `200` per call.                               |
| `page`                | `number`  | `0`     | Zero-based page index.                            |

```typescript
const orders = await sdk.queryOrders({
  owner: "GABC...XYZ",
  buying: "CBUY...",
  selling: "CSELL...",
  includeClosedOrders: false,
  limit: 100,
  page: 0,
});
```

#### `fetchOrder(id): Promise<AxisMarketsOrderOutput>`

Fetches a **single order** by its ID. Accepts a `bigint`, `string`, or `number` (internally stringified for the request
path).

| Parameter | Type                         | Description                                            |
|-----------|------------------------------|--------------------------------------------------------|
| `id`      | `bigint \| string \| number` | Order ID. Internally stringified for the request path. |

```typescript
const order = await sdk.fetchOrder(42n);
```

### Trade Methods

#### `queryLastTrades(params): Promise<AxisMarketsTradeEventOutput[]>`

Fetches the **most recent trade events**.

| Parameter | Type                           | Description                     |
|-----------|--------------------------------|---------------------------------|
| `params`  | `AxisMarketsQueryTradesParams` | Filter & pagination (optional). |

`AxisMarketsQueryTradesParams`:

| Field     | Type     | Default | Notes                     |
|-----------|----------|---------|---------------------------|
| `buying`  | `string` | —       | The buying asset.         |
| `selling` | `string` | —       | The selling asset.        |
| `maker`   | `string` | —       | The creator of the order. |
| `taker`   | `string` | —       | The trader.               |
| `limit`   | `number` | `100`   | Max `200` per call.       |
| `page`    | `number` | `0`     | Zero-based page index.    |

```typescript
const trades = await sdk.queryLastTrades({
  buying: "CBUY...",
  selling: "CSELL...",
  maker: "GMAKER...",
  taker: "GTAKER...",
  limit: 100,
  page: 0,
});
```

### Swap Methods

#### `queryLastSwaps(params): Promise<AxisMarketsSwapEventOutput[]>`

Fetches the **most recent swap events**.

| Parameter | Type                          | Description                     |
|-----------|-------------------------------|---------------------------------|
| `params`  | `AxisMarketsQuerySwapsParams` | Filter & pagination (optional). |

`AxisMarketsQuerySwapsParams`:

| Field     | Type     | Default | Notes                          |
|-----------|----------|---------|--------------------------------|
| `buying`  | `string` | —       | The buying asset.              |
| `selling` | `string` | —       | The selling asset.             |
| `trader`  | `string` | —       | The trader executing the swap. |
| `limit`   | `number` | `100`   | Max `200` per call.            |
| `page`    | `number` | `0`     | Zero-based page index.         |

```typescript
const swaps = await sdk.queryLastSwaps({
  buying: "CBUY...",
  selling: "CSELL...",
  trader: "GTRADER...",
  limit: 100,
  page: 0,
});
```

### Market Depth Methods

#### `fetchMarketDepth(params): Promise<AxisMarketsMarketDepthResultOutput>`

Fetches the **current market depth** (order book) for a market.

| Parameter | Type                           | Description               |
|-----------|--------------------------------|---------------------------|
| `params`  | `AxisMarketsMarketDepthParams` | Market filter (optional). |

`AxisMarketsMarketDepthParams`:

| Field     | Type     | Default | Notes              |
|-----------|----------|---------|--------------------|
| `buying`  | `string` | —       | The buying asset.  |
| `selling` | `string` | —       | The selling asset. |

```typescript
const depth = await sdk.fetchMarketDepth({
  buying: "CBUY...",
  selling: "CSELL...",
});

console.log(depth.asks); // sell side
console.log(depth.bids); // buy side
```

### Network Methods

#### `setNetwork(network: Networks): void`

Changes the target Stellar network at runtime.

| Parameter | Type       | Description                 |
|-----------|------------|-----------------------------|
| `network` | `Networks` | The Stellar network to use. |

```typescript
sdk.setNetwork(Networks.TESTNET);
```

---

## Types & Schemas

All types are exported from the extension's `schemas` module and are inferred from their corresponding Valibot schemas.

### Order Types

| Type                     | Description            |
|--------------------------|------------------------|
| `AxisMarketsOrderOutput` | A single order record. |
| `AxisMarketsOrderKind`   | Enum of order kinds.   |

#### `AxisMarketsOrderKind` enum

| Value        | Integer | Description                                                |
|--------------|---------|------------------------------------------------------------|
| `Limit`      | `1`     | Execute trade, create a limit order if not fully executed. |
| `Fill`       | `2`     | Execute trade without creating a limit order.              |
| `FillOrKill` | `3`     | Execute trade, cancel if not fully executed.               |

#### `AxisMarketsOrderOutput`

| Field       | Type                   | Description                         |
|-------------|------------------------|-------------------------------------|
| `id`        | `bigint`               | Order ID.                           |
| `owner`     | `string`               | Stellar address of the order owner. |
| `kind`      | `AxisMarketsOrderKind` | Order kind (see above).             |
| `buying`    | `string`               | Buying asset contract.              |
| `selling`   | `string`               | Selling asset contract.             |
| `amount`    | `bigint`               | Order amount.                       |
| `price`     | `bigint`               | Order price.                        |
| `quote`     | `bigint`               | Quote amount.                       |
| `expires`   | `bigint`               | Expiration.                         |
| `deleted`   | `boolean`              | Whether the order has been removed. |
| `timestamp` | `number`               | Last update timestamp.              |

### Trade & Swap Types

| Type                          | Description           |
|-------------------------------|-----------------------|
| `AxisMarketsTradeEventOutput` | A single trade event. |
| `AxisMarketsSwapEventOutput`  | A single swap event.  |

#### `AxisMarketsTradeEventOutput`

| Field       | Type     | Description                      |
|-------------|----------|----------------------------------|
| `id`        | `bigint` | Trade event ID.                  |
| `order`     | `bigint` | Related order ID.                |
| `maker`     | `string` | Order creator's Stellar address. |
| `taker`     | `string` | Trader's Stellar address.        |
| `buying`    | `string` | Buying asset contract.           |
| `selling`   | `string` | Selling asset contract.          |
| `bought`    | `bigint` | Amount bought.                   |
| `sold`      | `bigint` | Amount sold.                     |
| `timestamp` | `bigint` | Event timestamp.                 |
| `tx_hash`   | `string` | Transaction hash.                |

#### `AxisMarketsSwapEventOutput`

| Field       | Type     | Description               |
|-------------|----------|---------------------------|
| `id`        | `bigint` | Swap event ID.            |
| `trader`    | `string` | Trader's Stellar address. |
| `buying`    | `string` | Buying asset contract.    |
| `selling`   | `string` | Selling asset contract.   |
| `bought`    | `bigint` | Amount bought.            |
| `sold`      | `bigint` | Amount sold.              |
| `timestamp` | `bigint` | Event timestamp.          |
| `tx_hash`   | `string` | Transaction hash.         |

### Market Depth Types

| Type                                 | Description                       |
|--------------------------------------|-----------------------------------|
| `AxisMarketsMarketDepthResultOutput` | Market depth (order book) result. |
| `AxisMarketsMarketDepthRecordOutput` | A single price level in the book. |

#### `AxisMarketsMarketDepthResultOutput`

```typescript
type AxisMarketsMarketDepthResultOutput = {
  asks: AxisMarketsMarketDepthRecordOutput[];
  bids: AxisMarketsMarketDepthRecordOutput[];
}
```

#### `AxisMarketsMarketDepthRecordOutput`

| Field               | Type     | Description                               |
|---------------------|----------|-------------------------------------------|
| `price`             | `bigint` | Price level.                              |
| `amount`            | `bigint` | Amount available at this price level.     |
| `cumulative_amount` | `bigint` | Cumulative amount up to this price level. |

### Query Parameter Interfaces

| Interface                          | Used by            |
|------------------------------------|--------------------|
| `AxisMarketsFetchUserOrdersParams` | `queryOrders`      |
| `AxisMarketsQueryTradesParams`     | `queryLastTrades`  |
| `AxisMarketsQuerySwapsParams`      | `queryLastSwaps`   |
| `AxisMarketsMarketDepthParams`     | `fetchMarketDepth` |

### Helper Functions

| Function                            | Description                                               |
|-------------------------------------|-----------------------------------------------------------|
| `getAxisMarketsContractId(network)` | Returns the Axis Markets contract ID for a given network. |

### Enums

#### `AxisMarketsContract`

| Key       | Value                                                      |
|-----------|------------------------------------------------------------|
| `TESTNET` | `CCJQB4EEQLBL7RHIPYMYG26ZT2QRKEYNGVWWL2EPZCECFI6GZGNXMIEX` |

> ⚠️ `PUBLIC`, `FUTURENET`, `SANDBOX`, and `STANDALONE` networks are **not supported** and will throw an error.

---

## How It Works

Every method follows the same flow:

1. **`startWasm()`** is awaited to ensure the `@stellar/stellar-xdr-json` WASM runtime is initialized (unless
   `skipWASM: true`). It only initializes once.
2. The request is built via the base class's authenticated `api` getter (`wretch` + query string addon +
   `Authorization: Bearer <consumerToken>`).
3. The JSON response is validated asynchronously with `parseAsync` against the corresponding Valibot schema. Numeric
   string fields are coerced to `bigint`.

> Responses are parsed with Valibot's `parseAsync`; schema mismatches throw a `ValiError`. Network failures propagate as
> `wretch` errors.

---

## Examples

### Querying and Filtering Orders

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { AxisMarketsIndexerSdk } from "@creit-tech/stellar-indexer-sdk/axis-markets";

const sdk = new AxisMarketsIndexerSdk({
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
  network: Networks.TESTNET,
});

const orders = await sdk.queryOrders({
  selling: "CSELL...",
  includeClosedOrders: false,
  limit: 200,
});

for (const order of orders) {
  console.log(`Order ${ order.id }: ${ order.amount } @ ${ order.price }`);
}
```

### Fetching Recent Trades

```typescript
const trades = await sdk.queryLastTrades({
  buying: "CBUY...",
  selling: "CSELL...",
  limit: 200,
});

for (const trade of trades) {
  console.log(`Trade ${ trade.id }: bought ${ trade.bought }, sold ${ trade.sold }`);
}
```

### Building an Order Book View

```typescript
const depth = await sdk.fetchMarketDepth({
  buying: "CBUY...",
  selling: "CSELL...",
});

console.log("Asks (sell side):");
for (const ask of depth.asks) {
  console.log(`  ${ ask.amount } @ ${ ask.price } (cumulative: ${ ask.cumulative_amount })`);
}

console.log("Bids (buy side):");
for (const bid of depth.bids) {
  console.log(`  ${ bid.amount } @ ${ bid.price } (cumulative: ${ bid.cumulative_amount })`);
}
```

### Error Handling

```typescript
try {
  const order = await sdk.fetchOrder("123");
} catch (err) {
  console.error("Failed to fetch order:", err);
}
```

### Combining with Base SDK Methods

Since `AxisMarketsIndexerSdk` extends `StellarIndexerSdk`, you have access to base class methods on the same instance:

```typescript
const [ instanceData ] = await sdk.fetchContractData({
  contracts: [ "CCJQB4EEQLBL7RHIPYMYG26ZT2QRKEYNGVWWL2EPZCECFI6GZGNXMIEX" ],
  key: [ {_: "ledger_key_contract_instance"} ],
  limit: 1,
  page: 0,
});
```
