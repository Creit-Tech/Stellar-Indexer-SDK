# Axis Markets Extension for the Stellar Indexer SDK

This extension uses the custom endpoints from the Stellar Indexer service designed for Axis Markets. This extension
requires a token that has access to the contracts' data package and to the events archive package.

## Features

- 🔒 **Runtime validation** — Inputs and API responses are validated with [Valibot](https://valibot.dev/) schemas.
- 🌐 **Network switching** — Change the target Stellar network at runtime via `setNetwork`.
- 🔢 **BigInt‑safe** — Numeric fields (amounts, prices, IDs) are coerced from strings into `bigint` to avoid precision
  loss.
- ⚡ **Automatic WASM init** — Each request ensures the `@stellar/stellar-xdr-json` WASM runtime is initialized (can be
  skipped via config).
- 🔑 **Authenticated requests** — Requests are sent with a Bearer token through [
  `wretch`](https://github.com/elbywan/wretch).
- 📦 **Fully typed** — Complete TypeScript types for every parameter and result.

## Installation

```bash
# npm
npm install @creit-tech/stellar-indexer-sdk

# deno
deno add @creit-tech/stellar-indexer-sdk
```

> Peer dependencies: `@valibot/valibot`, `@stellar/stellar-sdk`, `@stellar/stellar-xdr-json`, and `wretch`.

## Supported Networks

Axis Markets is currently only deployed on **Testnet**. The contract ID is:

```ts
export const AXIS_MARKETS_TESTNET =
  "CCJQB4EEQLBL7RHIPYMYG26ZT2QRKEYNGVWWL2EPZCECFI6GZGNXMIEX";
```

A helper is exported to resolve the contract ID for a given network:

```ts
import { getAxisMarketsContractId } from "./schemas.ts";
import { Networks } from "@stellar/stellar-sdk";

getAxisMarketsContractId(Networks.TESTNET); // ✅ returns the contract ID
getAxisMarketsContractId(Networks.PUBLIC);  // ❌ throws — not deployed
```

> ⚠️ Calling `getAxisMarketsContractId` with `PUBLIC`, `FUTURENET`, `SANDBOX`, or `STANDALONE` throws, since the
> contract is not available there.

## Configuration

The constructor accepts the base `StellarIndexerSdk` parameters plus an optional `network` field.

| Field           | Type       | Required | Default              | Description                                                 |
|-----------------|------------|----------|----------------------|-------------------------------------------------------------|
| `consumerToken` | `string`   | ✅ Yes    | —                    | API bearer token used to authenticate requests.             |
| `apiUrl`        | `string`   | No       | *(base SDK default)* | Base URL of the indexer API.                                |
| `skipWASM`      | `boolean`  | No       | `false`              | If `true`, skips initializing the Stellar XDR WASM runtime. |
| `network`       | `Networks` | No       | `Networks.PUBLIC`    | Stellar network used by the Axis Markets extension.         |

Config is validated against `AxisMarketsIndexerParamsSchema` at construction time — invalid input throws immediately.

## Usage

### Initialization

```ts
import { AxisMarketsIndexerSdk } from "@creit-tech/stellar-indexer-sdk/axis-markets";
import { Networks } from "@stellar/stellar-sdk";

const sdk = new AxisMarketsIndexerSdk({
  consumerToken: "YOUR_API_TOKEN",
  network: Networks.TESTNET,
});
```

### Switching networks

```ts
sdk.setNetwork(Networks.TESTNET);
```

## API Reference

### `queryOrders(params)`

Fetch orders. **At least one of `owner`, `buying`, or `selling` must be provided.** Results are returned from most
recently updated to oldest.

```ts
const orders = await sdk.queryOrders({
  owner: "GABC...XYZ",
  buying: "CBUY...",
  selling: "CSELL...",
  includeClosedOrders: false,
  limit: 100,
  page: 0,
});
```

**Params — `AxisMarketsFetchUserOrdersParams`**

| Field                 | Type       | Description                                       |
|-----------------------|------------|---------------------------------------------------|
| `owner`               | `string?`  | The owner of the order.                           |
| `buying`              | `string?`  | The buying asset (contract).                      |
| `selling`             | `string?`  | The selling asset (contract).                     |
| `includeClosedOrders` | `boolean?` | Include orders already removed from the contract. |
| `limit`               | `number?`  | Records per call (max **200**, default **100**).  |
| `page`                | `number?`  | Result page (default **0**).                      |

- **HTTP:** `GET /v1/protocols/axis-markets/orders`
- **Returns:** `Promise<AxisMarketsOrderOutput[]>`

---

### `fetchOrder(id)`

Fetch a single order by its ID. Accepts a `bigint`, `string`, or `number` (internally stringified for the request path).

```ts
const order = await sdk.fetchOrder(42n);
```

- **HTTP:** `GET /v1/protocols/axis-markets/orders/:id`
- **Returns:** `Promise<AxisMarketsOrderOutput>`

---

### `queryLastTrades(params)`

Query the most recent trade events.

```ts
const trades = await sdk.queryLastTrades({
  buying: "CBUY...",
  selling: "CSELL...",
  maker: "GMAKER...",
  taker: "GTAKER...",
  limit: 100,
  page: 0,
});
```

**Params — `AxisMarketsQueryTradesParams`**

| Field     | Type      | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `buying`  | `string?` | The buying asset.                                |
| `selling` | `string?` | The selling asset.                               |
| `maker`   | `string?` | The creator of the order.                        |
| `taker`   | `string?` | The trader.                                      |
| `limit`   | `number?` | Records per call (max **200**, default **100**). |
| `page`    | `number?` | Result page (default **0**).                     |

- **HTTP:** `GET /v1/protocols/axis-markets/last-trades`
- **Returns:** `Promise<AxisMarketsTradeEventOutput[]>`

---

### `queryLastSwaps(params)`

Query the most recent swap events.

```ts
const swaps = await sdk.queryLastSwaps({
  buying: "CBUY...",
  selling: "CSELL...",
  trader: "GTRADER...",
  limit: 100,
  page: 0,
});
```

**Params — `AxisMarketsQuerySwapsParams`**

| Field     | Type      | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `buying`  | `string?` | The buying asset.                                |
| `selling` | `string?` | The selling asset.                               |
| `trader`  | `string?` | The trader executing the swap.                   |
| `limit`   | `number?` | Records per call (max **200**, default **100**). |
| `page`    | `number?` | Result page (default **0**).                     |

- **HTTP:** `GET /v1/protocols/axis-markets/last-swaps`
- **Returns:** `Promise<AxisMarketsSwapEventOutput[]>`

---

### `fetchMarketDepth(params)`

Fetch the current market depth (order book) for a market.

```ts
const depth = await sdk.fetchMarketDepth({
  buying: "CBUY...",
  selling: "CSELL...",
});

console.log(depth.asks); // sell side
console.log(depth.bids); // buy side
```

**Params — `AxisMarketsMarketDepthParams`**

| Field     | Type      | Description        |
|-----------|-----------|--------------------|
| `buying`  | `string?` | The buying asset.  |
| `selling` | `string?` | The selling asset. |

- **HTTP:** `GET /v1/protocols/axis-markets/market-depth`
- **Returns:** `Promise<AxisMarketsMarketDepthResultOutput>`

## Data Types

### Order Kinds

```ts
enum AxisMarketsOrderKind {
  Limit = 1,      // Execute trade, create a limit order if not fully executed
  Fill = 2,       // Execute trade without creating a limit order
  FillOrKill = 3, // Execute trade, cancel if not fully executed
}
```

### `AxisMarketsOrderOutput`

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

### `AxisMarketsTradeEventOutput`

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

### `AxisMarketsSwapEventOutput`

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

### `AxisMarketsMarketDepthResultOutput`

```ts
type AxisMarketsMarketDepthResultOutput = {
  asks: AxisMarketsMarketDepthRecordOutput[];
  bids: AxisMarketsMarketDepthRecordOutput[];
}
```

Each **`AxisMarketsMarketDepthRecordOutput`**:

| Field               | Type     | Description                               |
|---------------------|----------|-------------------------------------------|
| `price`             | `bigint` | Price level.                              |
| `amount`            | `bigint` | Amount available at this price level.     |
| `cumulative_amount` | `bigint` | Cumulative amount up to this price level. |

## How it works

Every method follows the same flow:

1. **`startWasm()`** is awaited to ensure the `@stellar/stellar-xdr-json` WASM runtime is initialized (unless
   `skipWASM: true`). It only initializes once.
2. The request is built via the base class's authenticated `api` getter (`wretch` + query string addon +
   `Authorization: Bearer <consumerToken>`).
3. The JSON response is validated asynchronously with `parseAsync` against the corresponding Valibot schema. Numeric
   string fields are coerced to `bigint`.

## Error Handling

Responses are parsed with Valibot's `parseAsync`; schema mismatches throw a `ValiError`. Network failures propagate as
`wretch` errors.

```ts
try {
  const order = await sdk.fetchOrder("123");
} catch (err) {
  console.error("Failed to fetch order:", err);
}
```
