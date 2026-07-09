## xBull Swap Extension for the Stellar Indexer SDK

This extension uses the custom endpoints from the Stellar Indexer service designed for xBull Swap. This extension
requires a token that has access to the Events archive package.

### `fetchStrictSendRecordsByAddress`

This method will get operations made or received by an address, they will be sorted from the most recent to the oldest
record. Here is how the records will look like

```typescript
type record = {
  from: string;
  to: string;
  from_asset: string;
  to_asset: string;
  from_amount: bigint;
  to_amount: bigint;
  platform_fee: bigint;
  external_fees: bigint;
  tx_hash: string;
  timestamp: bigint;
}
```
