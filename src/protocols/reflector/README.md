# Reflector Indexer SDK

> A TypeScript SDK extension for querying Reflector Protocol data from the Stellar Indexer API.

The `ReflectorIndexerSdk` extends the base `StellarIndexerSdk` to provide typed access to Reflector protocol data —
oracle metadata and historical price series — with runtime validation powered by [Valibot](https://valibot.dev/).

This extension requires a token that has access to the contracts' data package.

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Supported Networks](#supported-networks)
- [API Reference](#api-reference)
    - [Oracle Methods](#oracle-methods)
    - [Price Methods](#price-methods)
- [Types & Schemas](#types--schemas)
- [How It Works](#how-it-works)
- [Examples](#examples)

---

## Installation

This library works with any server-side JavaScript environment: Deno, Bun and Node.js. To install the base library
(which includes the protocol extensions), you can do:

```textmate
npx jsr add @stellar-indexer/stellar-indexer-sdk
```

> You can check more download options here: https://jsr.io/@stellar-indexer/stellar-indexer-sdk

---

## Features

- **Runtime validation** — Inputs and API responses are validated with [Valibot](https://valibot.dev/) schemas.
- **BigInt-safe** — Numeric fields (timestamps, prices, periods) are coerced from strings into `bigint` to avoid
  precision loss.
- **WASM-powered XDR parsing** — Automatically initializes `@stellar/stellar-xdr-json` for decoding Stellar contract
  data.
- **Sensible defaults** — Three default Reflector pulse oracles are pre-configured, so you can start querying out of the
  box.
- **Historical price series** — Fetch time-series price records per period with built-in date-range filtering and
  pagination.
- **Authenticated requests** — Requests are sent with a Bearer token through
  [`wretch`](https://github.com/elbywan/wretch).
- **Fully typed** — Complete TypeScript types for every parameter and result.
- **Base SDK methods included** — Since `ReflectorIndexerSdk` extends `StellarIndexerSdk`, you can also call base class
  methods like `fetchContractData` directly on the same instance.

---

## Quick Start

To start the SDK, you need to provide a `consumer token` with access to the contracts' data package.

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { ReflectorIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/reflector";

const reflector = new ReflectorIndexerSdk({
  consumerToken: "CONSUMER_TOKEN",
  network: Networks.PUBLIC,
});

// Fetch metadata for all configured oracles
const oracles = await reflector.fetchOraclesData();
console.log(Object.keys(oracles));

// Fetch historical prices for a specific oracle
const prices = await reflector.fetchHistoricalPrices(
  "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
);
console.log(prices.base_asset, prices.prices.length);
```

> **Note:** The kit uses the `@stellar/stellar-xdr-json` library, which needs to use WASM, so the kit will automatically
> start it, but if you prefer to do it yourself, you can pass `skipWASM: true` when starting the kit.
>
> **Note for Deno users:** You need to provide the path to the `.wasm` module in the `--allow-read=PATH_HERE` option (or
> just `--allow-read` to allow all reads).

---

## Configuration

The `ReflectorIndexerSdk` constructor accepts a `ReflectorIndexerParamsInput` object that extends the base SDK params
with Reflector-specific defaults.

### Required

| Parameter       | Type     | Description                                                        |
|-----------------|----------|--------------------------------------------------------------------|
| `consumerToken` | `string` | Bearer token used to authenticate against the Stellar Indexer API. |

### Network Selection

| Parameter | Type                  | Description                                                         |
|-----------|-----------------------|---------------------------------------------------------------------|
| `network` | `Networks`            | Selects the API endpoint. Defaults to `PUBLIC`.                     |
| `apiUrl`  | `string` *(optional)* | Override the API base URL. If omitted, it's derived from `network`. |

Default API URLs:

- `Networks.PUBLIC` → `https://api.stellarindexer.com`
- `Networks.TESTNET` → `https://api-testnet.stellarindexer.com`

### Reflector-Specific *(all optional, with defaults)*

| Parameter  | Type       | Default (3 pulse oracles)                                                                                                                                                              | Description                                     |
|------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| `oracles`  | `string[]` | `["CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN", "CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M", "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC"]` | List of oracle contract IDs to track.           |
| `skipWASM` | `boolean`  | `false`                                                                                                                                                                                | Skip WASM initialization (disable XDR parsing). |

> 💡 The `oracles` getter returns a copy of the configured oracle contract IDs, so you can inspect them at runtime
> without mutating the internal state.

### Example: Custom Configuration

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { ReflectorIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/reflector";

const reflector = new ReflectorIndexerSdk({
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
  network: Networks.TESTNET,
  oracles: [
    "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
  ],
});
```

---

## Supported Networks

Reflector oracles are deployed across both **Public** and **Testnet** Stellar networks. The default oracle contract IDs
cover the three Reflector pulse oracles and work on both networks.

---

## API Reference

All methods are `async` and return validated, typed data. WASM is initialized lazily on first call (unless `skipWASM` is
set).

### Oracle Methods

#### `fetchOraclesData(): Promise<ReflectorOraclesResultOutput>`

Fetches metadata for **all configured oracles**, returning a record keyed by oracle contract ID. Each entry contains the
oracle's assets, base asset, decimals, timing parameters, and protocol version.

```typescript
const oracles = await reflector.fetchOraclesData();

for (const [ id, data ] of Object.entries(oracles)) {
  console.log(`Oracle ${ id }: ${ data.assets.length } assets, base ${ data.base_asset }`);
}
```

Example of a single record inside the result:

```json
{
  "id": "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN",
  "assets": [
    "BTC",
    "ETH",
    "USDT",
    "XRP",
    "SOL",
    "USDC",
    "ADA",
    "AVAX",
    "DOT",
    "MATIC",
    "LINK",
    "DAI",
    "ATOM",
    "XLM",
    "UNI",
    "EURC"
  ],
  "base_asset": "USD",
  "decimals": 14,
  "last_timestamp": "1783475100000",
  "period": "86400000",
  "protocol": 2,
  "protocol_update": "0",
  "resolution": 300000
}
```

#### `oracles` *(getter)*

Returns a copy of the currently configured oracle contract IDs.

| Returns   | Type       | Description                             |
|-----------|------------|-----------------------------------------|
| `oracles` | `string[]` | Array of oracle contract IDs in config. |

```typescript
console.log(reflector.oracles);
```

### Price Methods

#### `fetchHistoricalPrices(oracleId, opts?): Promise<ReflectorOraclePricesResultOutput>`

Fetches **historical prices** published by an oracle within the provided (or default) date range. A record is returned
per period specified. By default, the period is `"day"`, which means the latest record per day is returned.

| Parameter  | Type                        | Description                             |
|------------|-----------------------------|-----------------------------------------|
| `oracleId` | `string`                    | The oracle contract ID to query.        |
| `opts`     | `ReflectorOraclePricesOpts` | Filter & pagination options (optional). |

`ReflectorOraclePricesOpts`:

| Field      | Type                                                          | Default           | Notes                                |
|------------|---------------------------------------------------------------|-------------------|--------------------------------------|
| `period`   | `"minute" \| "hour" \| "day" \| "7day" \| "14day" \| "30day"` | `"day"`           | Interval between each result record. |
| `fromDate` | `Date`                                                        | 7 days before now | Start of the date range to filter.   |
| `toDate`   | `Date`                                                        | now               | End of the date range to filter.     |
| `limit`    | `number`                                                      | `8`               | Max `200` records per call.          |
| `page`     | `number`                                                      | `0`               | Zero-based page index.               |

Example of the response:

```json
{
  "oracle": "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
  "decimals": 14,
  "base_asset": "USD",
  "prices": [
    {
      "timestamp": "1783479900000",
      "assets": {
        "EUR": "114226762398596",
        "GBP": "133728251843033",
        "CAD": "70393634416534",
        "BRL": "19450162900104",
        "JPY": "617152219801",
        "CNY": "14718279896670",
        "MXN": "5727693942340",
        "KRW": "66062859434",
        "TRY": "2134329889650",
        "ARS": "67034212170",
        "PEN": "29357972773848",
        "VES": "148348825648",
        "CLP": "107800007903",
        "CRC": "219603771024",
        "CDF": "43650035710",
        "COP": "29919571462",
        "HKD": "12751502797899",
        "INR": "1051518625094",
        "NGN": "72842411579",
        "PHP": "1626581388251",
        "RUB": "1307535026460",
        "ZAR": "6150712844596",
        "XAU": "413734565789211487",
        "KES": "773870497101"
      },
      "date": "2026-07-08T03:05:00.000Z"
    }
  ]
}
```

```typescript
import { ReflectorIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/reflector";

const prices = await reflector.fetchHistoricalPrices(
  "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
  {
    period: "hour",
    limit: 100,
  },
);

for (const batch of prices.prices) {
  console.log(batch.date, batch.assets["EUR"]);
}
```

---

## Types & Schemas

All types are exported from the extension's `schemas` module and are inferred from their corresponding Valibot schemas.

### Core Types

| Type                                     | Description                                       |
|------------------------------------------|---------------------------------------------------|
| `ReflectorIndexerParamsInput` / `Output` | SDK constructor parameters.                       |
| `ReflectorOracleDataOutput`              | Metadata for a single oracle.                     |
| `ReflectorOraclesResultOutput`           | Record of oracle contract IDs to oracle metadata. |

### Price Types

| Type                                | Description                                     |
|-------------------------------------|-------------------------------------------------|
| `ReflectorOraclePriceBatchOutput`   | A single price batch (timestamp, assets, date). |
| `ReflectorOraclePricesResultOutput` | Result of a historical prices query.            |

#### `ReflectorOracleDataOutput`

| Field             | Type       | Description                                    |
|-------------------|------------|------------------------------------------------|
| `id`              | `string`   | Oracle contract ID.                            |
| `assets`          | `string[]` | List of asset symbols published by the oracle. |
| `base_asset`      | `string`   | Base asset used for pricing (e.g. `"USD"`).    |
| `decimals`        | `number`   | Price decimals.                                |
| `last_timestamp`  | `bigint`   | Timestamp of the last published price (ms).    |
| `period`          | `bigint`   | Publication period in milliseconds.            |
| `protocol`        | `number`   | Oracle protocol version.                       |
| `protocol_update` | `bigint`   | Protocol update value.                         |
| `resolution`      | `number`   | Resolution in milliseconds.                    |

#### `ReflectorOraclePriceBatchOutput`

| Field       | Type                     | Description                                         |
|-------------|--------------------------|-----------------------------------------------------|
| `timestamp` | `bigint`                 | Publication timestamp (ms).                         |
| `assets`    | `Record<string, bigint>` | Map of asset symbol to price (in base asset units). |
| `date`      | `Date`                   | Parsed date of the batch.                           |

#### `ReflectorOraclePricesResultOutput`

| Field        | Type                                | Description                  |
|--------------|-------------------------------------|------------------------------|
| `oracle`     | `string`                            | Oracle contract ID.          |
| `decimals`   | `number`                            | Price decimals.              |
| `base_asset` | `string`                            | Base asset used for pricing. |
| `prices`     | `ReflectorOraclePriceBatchOutput[]` | List of price batches.       |

### Query Parameter Interfaces

| Interface                   | Used by                 |
|-----------------------------|-------------------------|
| `ReflectorOraclePricesOpts` | `fetchHistoricalPrices` |

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

### Inspecting All Oracle Metadata

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { ReflectorIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/reflector";

const reflector = new ReflectorIndexerSdk({
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
  network: Networks.PUBLIC,
});

const oracles = await reflector.fetchOraclesData();

for (const [ id, data ] of Object.entries(oracles)) {
  console.log(`Oracle ${ id }`);
  console.log(`  base_asset: ${ data.base_asset }`);
  console.log(`  decimals:   ${ data.decimals }`);
  console.log(`  assets:     ${ data.assets.join(", ") }`);
}
```

### Building a Historical Price Chart

```typescript
import { ReflectorIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/reflector";

const reflector = new ReflectorIndexerSdk({
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
});

const result = await reflector.fetchHistoricalPrices(
  "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
  {
    period: "day",
    limit: 200,
  },
);

const chartData = result.prices.map((batch) => ({
  date: batch.date,
  eur: batch.assets["EUR"],
  gbp: batch.assets["GBP"],
}));
```

### Error Handling

```typescript
try {
  const oracles = await reflector.fetchOraclesData();
} catch (err) {
  console.error("Failed to fetch oracle data:", err);
}
```

### Combining with Base SDK Methods

Since `ReflectorIndexerSdk` extends `StellarIndexerSdk`, you have access to base class methods like `fetchContractData`
on the same instance:

```typescript
const [ instanceData ] = await reflector.fetchContractData({
  contracts: [ "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC" ],
  key: [ {_: "ledger_key_contract_instance"} ],
  limit: 1,
  page: 0,
});
```
