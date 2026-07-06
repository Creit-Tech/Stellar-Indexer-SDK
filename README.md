# Stellar Indexer SDK

## Installation

This library works with any server-side JavaScript environment: Deno, Bun and Node.js. To install the library, you can
do:

```shell
npx jsr add @stellar-indexer/stellar-indexer-sdk
```

> You can check more download options here: https://jsr.io/@stellar-indexer/stellar-indexer-sdk

## Start the SDK

To start the SDK, you need to provide a `consumer token`. During the BETA phase, this token is provided to you
privately. After the BETA, this token will be generated automatically from your authentication credentials.

```typescript
import { StellarIndexerSdk } from "@stellar-indexer/stellar-indexer-sdk";

const sdk: StellarIndexerSdk = new StellarIndexerSdk({consumerToken: "CONSUMER_TOKEN"});
```

> Note: the kit uses the `@stellar/stellar-xdr-json` library, which needs to use WASM, so the kit will automatically
> start it, but if you prefer to do it yourself, you can pass `skipWASM: true` when starting the kit
>
> Note 2: If you're using Deno, you need to provide the path to the `.wasm` module in the `--allow-read=PATH_HERE`
> option (or just `--allow-read` to allow all reads)

## Contracts' Data Package

The Contracts' Data package from the Stellar Indexer gives you access to all the live data on the Stellar Smart
Contracts platform with a single endpoint. You can interact with it using the following method:

```typescript
const [ data ]: ContractData[] = await sdk.fetchContractData({
  contracts: [ "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD" ],
  key: [ {_: "ledger_key_contract_instance"} ],
  limit: 1,
  page: 0,
});
```

In the example above, we get the instance storage record from a Blend pool, but we can do more complex stuff like this:

```typescript
const data: ContractData[] = await sdk.fetchContractData({
  contracts: POOLS_IDS,
  key: [
    {_: "ledger_key_contract_instance"},
    {symbol: "PoolEmis"},
    {symbol: "ResList"},
    {vec: [ {symbol: "EmisData"} ]},
    {vec: [ {symbol: "ResConfig"} ]},
    {vec: [ {symbol: "ResData"} ]},
    {vec: [ {symbol: "ResInit"} ]},
  ],
  limit: 200,
  page,
  orderBy: "none",
  sort: "asc",
});
```

This query will get you all the information that isn't related to a user in a list of Blend pools. In fact, this same
query is made by one of the "extensions" of the SDK (more on that in the next section). The same information that the
`mainnet.blend.capital` site gets using RPCs and lots of requests (not counting oracle data) can be obtained with the
Stellar Indexer service in just one request.

## Protocol Extensions

Extensions are simple classes that extend the base class and abstract the work a developer would do to get information
from a protocol. This library ships with two examples in the `./protocols` folder, one for Blend and another for
StellarDomains.

Extension classes should take care of validations and parsing the information, as well as exposing schemas developers
can use to know the structure of the data they will receive.

### How to import the extensions

To use the extensions from the kit you need to import them directly from the `./protocols` path like this:

```typescript
import { BlendIndexerSdk } from '@stellar-indexer/stellar-indexer-sdk/protocols/blend'

const sdk = new BlendIndexerSdk(params);
```

Extensions already extend the base class so you can call directly the base class methods if you need to do something the
extension doesn't do. 
