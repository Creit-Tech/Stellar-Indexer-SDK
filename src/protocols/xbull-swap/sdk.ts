import { array, parseAsync } from "@valibot/valibot";
import {
  type FetchStrictSendRecordsByAddressOpts,
  type xBullSwapIndexerParamsInput,
  type xBullSwapStrictSendRecordOutput,
  xBullSwapStrictSendRecordSchema,
} from "./schemas.ts";
import { StellarIndexerSdk } from "../../sdk.ts";

export class xBullSwapIndexerSdk extends StellarIndexerSdk {
  constructor(params: xBullSwapIndexerParamsInput) {
    super(params);
  }

  async fetchStrictSendRecordsByAddress(
    address: string,
    opts?: FetchStrictSendRecordsByAddressOpts,
  ): Promise<xBullSwapStrictSendRecordOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/xbull-swap/operations-by-address/${address}`)
      .query(opts || {})
      .get()
      .json();
    return parseAsync(array(xBullSwapStrictSendRecordSchema), result);
  }
}
