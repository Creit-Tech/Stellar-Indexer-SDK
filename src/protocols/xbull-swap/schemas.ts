import { bigint, type InferInput, type InferOutput, object, optional, pipe, string, toBigint } from "@valibot/valibot";
import { IsStellarAddress, IsStellarContract, StellarIndexerSdkParamsSchema } from "../../schemas.ts";

export type xBullSwapIndexerParamsInput = InferInput<typeof xBullSwapIndexerParamsSchema>;
export const xBullSwapIndexerParamsSchema = object({
  ...StellarIndexerSdkParamsSchema.entries,
  router: optional(IsStellarContract(), "CCKXBE5GKJOCE7IKL64HLYKW3IJSUPVOLC4CS77GQT5QQHDZLDYV3DFT"),
});
export type xBullSwapIndexerParamsOutput = InferOutput<typeof xBullSwapIndexerParamsSchema>;

export type xBullSwapStrictSendRecordInput = InferInput<typeof xBullSwapStrictSendRecordSchema>;
export const xBullSwapStrictSendRecordSchema = object({
  from: IsStellarAddress(),
  to: IsStellarAddress(),
  from_asset: IsStellarContract(),
  to_asset: IsStellarContract(),
  from_amount: pipe(string(), toBigint(), bigint()),
  to_amount: pipe(string(), toBigint(), bigint()),
  platform_fee: pipe(string(), toBigint(), bigint()),
  external_fees: pipe(string(), toBigint(), bigint()),
  tx_hash: string(),
  timestamp: pipe(string(), toBigint(), bigint()),
});
export type xBullSwapStrictSendRecordOutput = InferOutput<typeof xBullSwapStrictSendRecordSchema>;

/**
 * Optional parameters you can provide to the query
 */
export interface FetchStrictSendRecordsByAddressOpts {
  /**
   * The amount of record to return per call, a limit of 200 records is defined by the API
   * If not provided then the API will use 30
   */
  limit?: number;

  /**
   * The current page of the result
   * If not provided then the API will use 0
   */
  page?: number;
}
