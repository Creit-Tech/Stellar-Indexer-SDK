import {
  array,
  bigint,
  date,
  type InferInput,
  type InferOutput,
  minLength,
  number,
  object,
  optional,
  pipe,
  record,
  string,
  toBigint,
  toDate,
  union,
} from "@valibot/valibot";
import { IsStellarContract, StellarIndexerSdkParamsSchema } from "../../schemas.ts";

const DEFAULT_ORACLES: string[] = [
  "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN",
  "CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M",
  "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
];

export type ReflectorIndexerParamsInput = InferInput<typeof ReflectorIndexerParamsSchema>;
export const ReflectorIndexerParamsSchema = object({
  ...StellarIndexerSdkParamsSchema.entries,
  oracles: optional(pipe(array(IsStellarContract()), minLength(1)), DEFAULT_ORACLES),
});
export type ReflectorIndexerParamsOutput = InferOutput<typeof ReflectorIndexerParamsSchema>;

export const ReflectorOracleDataSchema = object({
  id: IsStellarContract(),
  assets: array(string()),
  base_asset: string(),
  decimals: number(),
  last_timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  period: union([pipe(string(), toBigint(), bigint()), bigint()]),
  protocol: number(),
  protocol_update: union([pipe(string(), toBigint(), bigint()), bigint()]),
  resolution: number(),
});
export type ReflectorOracleDataOutput = InferOutput<typeof ReflectorOracleDataSchema>;

export const ReflectorOraclesResultSchema = record(IsStellarContract(), ReflectorOracleDataSchema);
export type ReflectorOraclesResultOutput = InferOutput<typeof ReflectorOraclesResultSchema>;

export const ReflectorOraclePriceBatchSchema = object({
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  assets: record(string(), union([pipe(string(), toBigint(), bigint()), bigint()])),
  date: union([pipe(string(), toDate(), date()), date()]),
});
export type ReflectorOraclePriceBatchOutput = InferOutput<typeof ReflectorOraclePriceBatchSchema>;

export const ReflectorOraclePricesResultSchema = object({
  oracle: IsStellarContract(),
  decimals: number(),
  base_asset: string(),
  prices: array(ReflectorOraclePriceBatchSchema),
});
export type ReflectorOraclePricesResultOutput = InferOutput<typeof ReflectorOraclePricesResultSchema>;

/**
 * Optional parameters you can provide to the query
 */
export interface ReflectorOraclePricesOpts {
  /**
   * This is the period between each result in the query, so for example if "hour" us used then you will get a record per hour inside the date range
   * If not provided then the API will use "day"
   */
  period?: "minute" | "hour" | "day" | "7day" | "14day" | "30day";

  /**
   * The start of the period from where the query will be done filtered
   * If not provided then the API will use 7 days before now
   */
  fromDate?: Date;

  /**
   * The end of the period from where the query will be done filtered
   * If not provided then the API will use now
   */
  toDate?: Date;

  /**
   * The amount of record to return per call, a limit of 200 records is defined by the API
   * If not provided then the API will use 8
   */
  limit?: number;

  /**
   * The current page of the result
   * If not provided then the API will use 0
   */
  page?: number;
}
