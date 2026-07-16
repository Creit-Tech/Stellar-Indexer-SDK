import { Networks } from "@stellar/stellar-sdk";
import { IsStellarAddress, IsStellarContract, StellarIndexerSdkParamsSchema } from "../../schemas.ts";
import {
  array,
  bigint,
  boolean,
  enum_,
  type InferInput,
  type InferOutput,
  number,
  object,
  optional,
  pipe,
  string,
  toBigint,
  union,
} from "@valibot/valibot";

export const AXIS_MARKETS_TESTNET: string = "CCJQB4EEQLBL7RHIPYMYG26ZT2QRKEYNGVWWL2EPZCECFI6GZGNXMIEX";

export function getAxisMarketsContractId(network: Networks): string {
  switch (network) {
    case Networks.TESTNET:
      return AXIS_MARKETS_TESTNET;

    case Networks.PUBLIC:
    case Networks.FUTURENET:
    case Networks.SANDBOX:
    case Networks.STANDALONE:
      throw new Error(`Axis markets contract is not available for the network: ${network}`);
  }
}

export type AxisMarketsIndexerParamsInput = InferInput<typeof AxisMarketsIndexerParamsSchema>;
export const AxisMarketsIndexerParamsSchema = object({
  ...StellarIndexerSdkParamsSchema.entries,
  network: optional(enum_(Networks), Networks.PUBLIC),
});
export type AxisMarketsIndexerParamsOutput = InferOutput<typeof AxisMarketsIndexerParamsSchema>;

export enum AxisMarketsOrderKind {
  /**
   * Execute trade, create a limit order if not executed in full
   */
  Limit = 1,
  /**
   * Execute trade without creating a limit order
   */
  Fill = 2,
  /**
   * Execute trade, cancel if was not executed in full
   */
  FillOrKill = 3,
}

export type AxisMarketsOrderInput = InferInput<typeof AxisMarketsOrderSchema>;
export const AxisMarketsOrderSchema = object({
  amount: union([pipe(string(), toBigint(), bigint()), bigint()]),
  buying: IsStellarContract(),
  expires: union([pipe(string(), toBigint(), bigint()), bigint()]),
  id: union([pipe(string(), toBigint(), bigint()), bigint()]),
  kind: enum_(AxisMarketsOrderKind),
  owner: IsStellarAddress(),
  price: union([pipe(string(), toBigint(), bigint()), bigint()]),
  quote: union([pipe(string(), toBigint(), bigint()), bigint()]),
  selling: IsStellarContract(),
  deleted: boolean(),
  timestamp: number(),
});
export type AxisMarketsOrderOutput = InferOutput<typeof AxisMarketsOrderSchema>;

/**
 * Parameters when querying the orders, at least one of "owner", "buying" or "selling" must be present.
 * The result will include the values from the most recently updated to the oldest one (based on the update timestamp)
 */
export interface AxisMarketsFetchUserOrdersParams {
  /**
   * The owner of the order
   */
  owner?: string;

  /**
   * The buying asset in the order
   */
  buying?: string;

  /**
   * The selling asset in the order
   */
  selling?: string;

  /**
   * Set this to true if you want to include already removed orders from the contract
   */
  includeClosedOrders?: boolean;

  /**
   * The amount of record to return per call, a limit of 200 records is defined by the API
   * If not provided then the API will use 100
   */
  limit?: number;

  /**
   * The current page of the result
   * If not provided then the API will use 0
   */
  page?: number;
}

export const AxisMarketsFetchUserOrdersResultSchema = array(AxisMarketsOrderSchema);

export type AxisMarketsTradeEventInput = InferInput<typeof AxisMarketsTradeEventSchema>;
export const AxisMarketsTradeEventSchema = object({
  bought: union([pipe(string(), toBigint(), bigint()), bigint()]),
  buying: IsStellarContract(),
  id: union([pipe(string(), toBigint(), bigint()), bigint()]),
  maker: IsStellarAddress(),
  order: union([pipe(string(), toBigint(), bigint()), bigint()]),
  selling: IsStellarContract(),
  sold: union([pipe(string(), toBigint(), bigint()), bigint()]),
  taker: IsStellarAddress(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  tx_hash: string(),
});
export type AxisMarketsTradeEventOutput = InferOutput<typeof AxisMarketsTradeEventSchema>;

export const AxisMarketsQueryTradeEventsResultSchema = array(AxisMarketsTradeEventSchema);

export interface AxisMarketsQueryTradesParams {
  /**
   * The buying asset in the order
   */
  buying?: string;

  /**
   * The selling asset in the order
   */
  selling?: string;

  /**
   * The creator of the order
   */
  maker?: string;

  /**
   * The trader
   */
  taker?: string;

  /**
   * The amount of record to return per call, a limit of 200 records is defined by the API
   * If not provided then the API will use 100
   */
  limit?: number;

  /**
   * The current page of the result
   * If not provided then the API will use 0
   */
  page?: number;
}

export type AxisMarketsSwapEventInput = InferInput<typeof AxisMarketsSwapEventSchema>;
export const AxisMarketsSwapEventSchema = object({
  bought: union([pipe(string(), toBigint(), bigint()), bigint()]),
  buying: IsStellarContract(),
  id: union([pipe(string(), toBigint(), bigint()), bigint()]),
  selling: IsStellarContract(),
  sold: union([pipe(string(), toBigint(), bigint()), bigint()]),
  trader: IsStellarAddress(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  tx_hash: string(),
});
export type AxisMarketsSwapEventOutput = InferOutput<typeof AxisMarketsSwapEventSchema>;

export const AxisMarketsQuerySwapEventsResultSchema = array(AxisMarketsSwapEventSchema);

export interface AxisMarketsQuerySwapsParams {
  /**
   * The buying asset in the order
   */
  buying?: string;

  /**
   * The selling asset in the order
   */
  selling?: string;

  /**
   * The trader executing the swap
   */
  trader?: string;

  /**
   * The amount of record to return per call, a limit of 200 records is defined by the API
   * If not provided then the API will use 100
   */
  limit?: number;

  /**
   * The current page of the result
   * If not provided then the API will use 0
   */
  page?: number;
}

export type AxisMarketsMarketDepthRecordInput = InferInput<typeof AxisMarketsMarketDepthRecordSchema>;
export const AxisMarketsMarketDepthRecordSchema = object({
  price: union([pipe(string(), toBigint(), bigint()), bigint()]),
  amount: union([pipe(string(), toBigint(), bigint()), bigint()]),
  cumulative_amount: union([pipe(string(), toBigint(), bigint()), bigint()]),
});
export type AxisMarketsMarketDepthRecordOutput = InferOutput<typeof AxisMarketsMarketDepthRecordSchema>;

export const AxisMarketsMarketDepthResultSchema = object({
  asks: array(AxisMarketsMarketDepthRecordSchema),
  bids: array(AxisMarketsMarketDepthRecordSchema),
});
export type AxisMarketsMarketDepthResultOutput = InferOutput<typeof AxisMarketsMarketDepthResultSchema>;

export interface AxisMarketsMarketDepthParams {
  /**
   * The buying asset in the order
   */
  buying?: string;

  /**
   * The selling asset in the order
   */
  selling?: string;
}
