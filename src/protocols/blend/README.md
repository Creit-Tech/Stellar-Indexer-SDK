# Blend Indexer SDK

> A TypeScript SDK extension for querying Blend Protocol data from the Stellar Indexer API.

The `BlendIndexerSdk` extends the base `StellarIndexerSdk` to provide typed access to Blend V2 protocol data — pools,
assets, auctions, events, emissions, and user positions — with runtime validation powered
by [Valibot](https://valibot.dev/).

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
    - [Pool Methods](#pool-methods)
    - [Asset Methods](#asset-methods)
    - [Auction Methods](#auction-methods)
    - [Event Methods](#event-methods)
    - [User Position Methods](#user-position-methods)
- [Types & Schemas](#types--schemas)
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
- **WASM-powered XDR parsing** — Automatically initializes `@stellar/stellar-xdr-json` for decoding Stellar contract
  event topics/data.
- **Sensible defaults** — Blend V2 factory, emitter, backstop, and Comet pool contract IDs are pre-configured per
  network.
- **Pagination & filtering** — Built-in support for `limit`, `page`, event/auction type filters, and address-based
  filtering.
- **Historical data** — Fetch time-series records for asset data, emissions, and user position updates.
- **Network-aware** — Public and Testnet endpoints and contract addresses are selected automatically.
- **Base SDK methods included** — Since `BlendIndexerSdk` extends `StellarIndexerSdk`, you can also call base class
  methods like `fetchContractData` directly on the same instance.

---

## Quick Start

To start the SDK, you need to provide a `consumer token`. During the BETA phase, this token is provided to you
privately. After the BETA, this token will be generated automatically from your authentication credentials.

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { BlendIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend";

const blend = new BlendIndexerSdk({
  network: Networks.PUBLIC,
  consumerToken: "CONSUMER_TOKEN",
});

// Fetch all Blend V2 pools
const pools = await blend.fetchPoolsInfo();
console.log(Object.keys(pools));

// Fetch info for a specific pool
const poolId = "CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU";
const pool = await blend.fetchPoolInfo(poolId);
console.log(pool.Name, pool.Admin);
```

> **Note:** The kit uses the `@stellar/stellar-xdr-json` library, which needs to use WASM, so the kit will automatically
> start it, but if you prefer to do it yourself, you can pass `skipWASM: true` when starting the kit.
>
> **Note for Deno users:** You need to provide the path to the `.wasm` module in the `--allow-read=PATH_HERE` option (or
> just `--allow-read` to allow all reads).

---

## Configuration

The `BlendIndexerSdk` constructor accepts a `BlendIndexerParamsInput` object that extends the base SDK params with
Blend-specific defaults.

### Required

| Parameter       | Type     | Description                                                        |
|-----------------|----------|--------------------------------------------------------------------|
| `consumerToken` | `string` | Bearer token used to authenticate against the Stellar Indexer API. |

### Network Selection

| Parameter | Type                  | Description                                                                    |
|-----------|-----------------------|--------------------------------------------------------------------------------|
| `network` | `Networks`            | Selects the API endpoint and default contract addresses. Defaults to `PUBLIC`. |
| `apiUrl`  | `string` *(optional)* | Override the API base URL. If omitted, it's derived from `network`.            |

Default API URLs:

- `Networks.PUBLIC` → `https://api.stellarindexer.com`
- `Networks.TESTNET` → `https://api-testnet.stellarindexer.com`

### Blend-Specific *(all optional, with defaults)*

| Parameter      | Type                      | Default (Public)                                           | Description                                     |
|----------------|---------------------------|------------------------------------------------------------|-------------------------------------------------|
| `emitter`      | `string` (contract ID)    | `CCOQM6S7ICIUWA225O5PSJWUBEMXGFSSW2PQFO6FP4DQEKMS5DASRGRR` | Default Blend emitter contract.                 |
| `backstop`     | `string` (contract ID)    | `CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7` | Default Blend backstop contract.                |
| `factory`      | `string` (contract ID)    | `CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU` | Blend V2 factory contract.                      |
| `cometPool`    | `string` (contract ID)    | `CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM` | Default Comet pool contract.                    |
| `trackedPools` | `string[]` (contract IDs) | `[]`                                                       | List of pool contract IDs to track.             |
| `skipWASM`     | `boolean`                 | `false`                                                    | Skip WASM initialization (disable XDR parsing). |

> 💡 Use the `getBlendPoolFactoryContractId(network)` helper to resolve the factory contract for a given network
> programmatically.

### Example: Custom Configuration

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { BlendIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend";

const blend = new BlendIndexerSdk({
  network: Networks.TESTNET,
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
  trackedPools: [
    "CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU",
  ],
});
```

---

## API Reference

All methods are `async` and return validated, typed data. WASM is initialized lazily on first call (unless `skipWASM` is
set).

### Pool Methods

#### `fetchPoolsInfo(): Promise<Record<string, BlendPoolDataOutput>>`

Fetches base information for **all pools** deployed via the Blend V2 Factory Contract.

Returns a record keyed by pool contract ID.

```typescript
const pools = await blend.fetchPoolsInfo();
```

#### `fetchPoolInfo(id: string): Promise<BlendPoolDataOutput>`

Fetches base information for a **single pool**.

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `id`      | `string` | Pool contract ID. |

```typescript
const pool = await blend.fetchPoolInfo("CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU");
```

### Asset Methods

#### `fetchPoolAssetInfo(id: string, asset: string): Promise<BlendPoolAssetRecord>`

Fetches data, emission, and configuration for a **specific asset** within a pool.

| Parameter | Type     | Description        |
|-----------|----------|--------------------|
| `id`      | `string` | Pool contract ID.  |
| `asset`   | `string` | Asset contract ID. |

```typescript
const asset = await blend.fetchPoolAssetInfo(poolId, assetId);
console.log(asset.config.decimals, asset.data.b_supply);
```

#### `fetchPoolAssetHistoricalData(id, asset, opts?): Promise<BlendPoolAssetHistoricalDataOutput[]>`

Fetches **historical data records** for a pool asset. Each record represents a new update in the asset's details.

| Parameter | Type                                      | Description                    |
|-----------|-------------------------------------------|--------------------------------|
| `id`      | `string`                                  | Pool contract ID.              |
| `asset`   | `string`                                  | Asset contract ID.             |
| `opts`    | `BlendFetchPoolAssetHistoricalDataParams` | Pagination options (optional). |

`BlendFetchPoolAssetHistoricalDataParams`:

| Field   | Type     | Default | Notes                  |
|---------|----------|---------|------------------------|
| `limit` | `number` | `30`    | Max `200` per call.    |
| `page`  | `number` | `0`     | Zero-based page index. |

#### `fetchPoolAssetHistoricalEmissions(id, asset, opts?): Promise<BlendPoolAssetHistoricalEmissionOutput[]>`

Fetches **historical emission updates** for a pool asset.

| Parameter | Type                                           | Description                             |
|-----------|------------------------------------------------|-----------------------------------------|
| `id`      | `string`                                       | Pool contract ID.                       |
| `asset`   | `string`                                       | Asset contract ID.                      |
| `opts`    | `BlendFetchPoolAssetHistoricalEmissionsParams` | Filter & pagination options (optional). |

`BlendFetchPoolAssetHistoricalEmissionsParams`:

| Field   | Type                   | Default | Notes                                                |
|---------|------------------------|---------|------------------------------------------------------|
| `type`  | `"supply" \| "borrow"` | —       | Filter emission type. If omitted, both are returned. |
| `limit` | `number`               | `30`    | Max `200` per call.                                  |
| `page`  | `number`               | `0`     | Zero-based page index.                               |

### Auction Methods

#### `fetchPoolAuctions(id, opts?): Promise<BlendAuctionOutput[]>`

Fetches **auctions** for a pool — active-only by default, or all recorded auctions.

| Parameter | Type                           | Description                     |
|-----------|--------------------------------|---------------------------------|
| `id`      | `string`                       | Pool contract ID.               |
| `opts`    | `BlendFetchPoolAuctionsParams` | Filter & pagination (optional). |

`BlendFetchPoolAuctionsParams`:

| Field            | Type               | Default | Description                                          |
|------------------|--------------------|---------|------------------------------------------------------|
| `includeDeleted` | `boolean`          | `false` | Include already-removed auctions.                    |
| `address`        | `string`           | —       | Filter by the user whose assets are being auctioned. |
| `type`           | `BlendAuctionType` | —       | Filter by auction type.                              |
| `limit`          | `number`           | `30`    | Max `200` per call.                                  |
| `page`           | `number`           | `0`     | Zero-based page index.                               |

`BlendAuctionType` enum:

| Value             | Description                              |
|-------------------|------------------------------------------|
| `UserLiquidation` | Liquidation auction for a user position. |
| `BadDebtAuction`  | Auction to cover bad debt.               |
| `InterestAuction` | Auction to settle accrued interest.      |

```typescript
import { BlendAuctionType } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend/schemas";

const auctions = await blend.fetchPoolAuctions(poolId, {
  type: BlendAuctionType.UserLiquidation,
  limit: 50,
});
```

### Event Methods

#### `fetchPoolEvents(id, opts?): Promise<ContractEvent[]>`

Fetches and filters **events emitted by a pool**.

| Parameter | Type                         | Description                     |
|-----------|------------------------------|---------------------------------|
| `id`      | `string`                     | Pool contract ID.               |
| `opts`    | `BlendFetchPoolEventsParams` | Filter & pagination (optional). |

`BlendFetchPoolEventsParams`:

| Field     | Type             | Default | Description                                                         |
|-----------|------------------|---------|---------------------------------------------------------------------|
| `address` | `string`         | —       | Filter events where this address appears in topics (asset/account). |
| `type`    | `BlendEventType` | —       | Filter by event type.                                               |
| `limit`   | `number`         | `30`    | Max `200` per call.                                                 |
| `page`    | `number`         | `0`     | Zero-based page index.                                              |

`BlendEventType` enum values:

`set_admin`, `update_pool`, `queue_set_reserve`, `cancel_set_reserve`, `set_reserve`, `set_status`,
`reserve_emission_update`, `gulp_emissions`, `claim`, `bad_debt`, `defaulted_debt`, `supply`, `withdraw`,
`supply_collateral`, `withdraw_collateral`, `borrow`, `repay`, `flash_loan`, `gulp`, `new_auction`, `fill_auction`,
`delete_auction`.

```typescript
import { BlendEventType } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend/schemas";

const supplyEvents = await blend.fetchPoolEvents(poolId, {
  type: BlendEventType.supply,
  limit: 100,
});
```

### User Position Methods

#### `fetchPoolUserPositions(id, user): Promise<BlendUserPositionsOutput>`

Fetches a user's **positions in a single pool** (only assets with a balance greater than zero).

| Parameter | Type     | Description           |
|-----------|----------|-----------------------|
| `id`      | `string` | Pool contract ID.     |
| `user`    | `string` | User Stellar address. |

#### `fetchPoolUserPosition(id, user, asset): Promise<BlendUserPositionOutput>`

Fetches a **single asset position** for a user in a pool.

| Parameter | Type     | Description           |
|-----------|----------|-----------------------|
| `id`      | `string` | Pool contract ID.     |
| `user`    | `string` | User Stellar address. |
| `asset`   | `string` | Asset contract ID.    |

#### `fetchPoolUserPositionHistorical(id, user, asset, limit?): Promise<BlendPoolUserPositionHistoryRecordOutput[]>`

Fetches the **history of updates** for a user's asset position in a pool.

| Parameter | Type     | Default | Description                                         |
|-----------|----------|---------|-----------------------------------------------------|
| `id`      | `string` | —       | Pool contract ID.                                   |
| `user`    | `string` | —       | User Stellar address.                               |
| `asset`   | `string` | —       | Asset contract ID.                                  |
| `limit`   | `number` | `30`    | Up to `1000` records per call. API default is `30`. |

#### `fetchUserPositions(user): Promise<BlendUserPositionsOutput[]>`

Fetches **all positions** a user has open across **every pool** deployed by the Blend V2 Factory Contract.

| Parameter | Type     | Description           |
|-----------|----------|-----------------------|
| `user`    | `string` | User Stellar address. |

```typescript
const allPositions = await blend.fetchUserPositions("GDRXFQO6RIVMI4...");
allPositions.forEach((pos) => {
  console.log(pos.pool, Object.keys(pos.assets));
});
```

---

## Types & Schemas

All types are exported from the extension's `schemas` module and are inferred from their corresponding Valibot schemas.

### Core Types

| Type                                        | Description                                          |
|---------------------------------------------|------------------------------------------------------|
| `BlendIndexerParamsInput` / `Output`        | SDK constructor parameters.                          |
| `BlendPoolDataOutput`                       | Full pool data (admin, config, assets record, etc.). |
| `BlendPoolAssetRecord`                      | Single asset record (data, emission, config, init).  |
| `BlendPoolAssetConfigSchema` output         | Asset configuration (rates, factors, caps).          |
| `BlendPoolAssetRecordDataSchema` output     | Asset live data (rates, supplies, timestamps).       |
| `BlendPoolAssetRecordEmissionSchema` output | Emission details (eps, percentage, expiration).      |

### User Position Types

| Type                                       | Description                                           |
|--------------------------------------------|-------------------------------------------------------|
| `BlendUserPositionAsset`                   | Underlying & token balances for a single asset.       |
| `BlendUserPositionOutput`                  | A user's collateral/liabilities/supply for one asset. |
| `BlendUserPositionsOutput`                 | A user's positions across all assets in one pool.     |
| `BlendPoolUserPositionHistoryRecordOutput` | A historical snapshot of a user's position.           |

### Auction & Event Types

| Type                 | Description                              |
|----------------------|------------------------------------------|
| `BlendAuctionOutput` | A single auction record.                 |
| `BlendAuctionType`   | Enum of auction types.                   |
| `BlendEventType`     | Enum of Blend event types.               |
| `ContractEvent`      | Base contract event (from the base SDK). |

### Historical Types

| Type                                     | Description                                           |
|------------------------------------------|-------------------------------------------------------|
| `BlendPoolAssetHistoricalDataOutput`     | Historical asset data record with ledger & timestamp. |
| `BlendPoolAssetHistoricalEmissionOutput` | Historical emission record with ledger & timestamp.   |

### Query Parameter Interfaces

| Interface                                      | Used by                             |
|------------------------------------------------|-------------------------------------|
| `BlendFetchPoolAuctionsParams`                 | `fetchPoolAuctions`                 |
| `BlendFetchPoolEventsParams`                   | `fetchPoolEvents`                   |
| `BlendFetchPoolAssetHistoricalDataParams`      | `fetchPoolAssetHistoricalData`      |
| `BlendFetchPoolAssetHistoricalEmissionsParams` | `fetchPoolAssetHistoricalEmissions` |

### Helper Functions

| Function                                 | Description                                                   |
|------------------------------------------|---------------------------------------------------------------|
| `getBlendPoolFactoryContractId(network)` | Returns the Blend V2 factory contract ID for a given network. |

### Enums

#### `BlendFactoryContract`

| Key       | Value                                                      |
|-----------|------------------------------------------------------------|
| `PUBLIC`  | `CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU` |
| `TESTNET` | `CDV6RX4CGPCOKGTBFS52V3LMWQGZN3LCQTXF5RVPOOCG4XVMHXQ4NTF6` |

> ⚠️ `FUTURENET`, `SANDBOX`, and `STANDALONE` networks are **not supported** and will throw an error.

---

## Examples

### Monitoring a User's Positions Across All Pools

```typescript
import { Networks } from "@stellar/stellar-sdk";
import { BlendIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend";

const blend = new BlendIndexerSdk({
  network: Networks.PUBLIC,
  consumerToken: process.env.STELLAR_INDEXER_TOKEN!,
});

const user = "GDRXFQO6RIVMI4TQCFCQGZWPW...";
const positions = await blend.fetchUserPositions(user);

for (const poolPos of positions) {
  console.log(`Pool: ${ poolPos.pool }`);
  for (const [ assetId, pos ] of Object.entries(poolPos.assets)) {
    if (pos.collateral) {
      console.log(`  Collateral: ${ pos.collateral.underlying }`);
    }
    if (pos.liabilities) {
      console.log(`  Debt: ${ pos.liabilities.underlying }`);
    }
  }
}
```

### Tracking Active Liquidation Auctions

```typescript
import { BlendAuctionType } from "@stellar-indexer/stellar-indexer-sdk/protocols/blend/schemas";

const auctions = await blend.fetchPoolAuctions(poolId, {
  type: BlendAuctionType.UserLiquidation,
  includeDeleted: false,
  limit: 200,
});

for (const a of auctions) {
  console.log(`Auction for ${ a.user }:`, a.data.lot);
}
```

### Building an Asset Historical Chart

```typescript
const history = await blend.fetchPoolAssetHistoricalData(poolId, assetId, {
  limit: 200,
  page: 0,
});

const chartData = history.map((r) => ({
  time: Number(r.timestamp),
  supply: r.b_supply,
  borrow: r.d_supply,
}));
```

### Combining with Base SDK Methods

Since `BlendIndexerSdk` extends `StellarIndexerSdk`, you have access to base class methods like `fetchContractData` on
the same instance:

```typescript
const [ instanceData ] = await blend.fetchContractData({
  contracts: [ poolId ],
  key: [ {_: "ledger_key_contract_instance"} ],
  limit: 1,
  page: 0,
});
```

