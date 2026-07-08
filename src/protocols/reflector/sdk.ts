import { parse, parseAsync } from "@valibot/valibot";
import { StellarIndexerSdk } from "../../sdk.ts";
import {
  type ReflectorIndexerParamsInput,
  type ReflectorIndexerParamsOutput,
  ReflectorIndexerParamsSchema,
  type ReflectorOraclePricesOpts,
  type ReflectorOraclePricesResultOutput,
  ReflectorOraclePricesResultSchema,
  type ReflectorOraclesResultOutput,
  ReflectorOraclesResultSchema,
} from "./schemas.ts";

export class ReflectorIndexerSdk extends StellarIndexerSdk {
  #config: ReflectorIndexerParamsOutput;

  constructor(props: ReflectorIndexerParamsInput) {
    super(props);
    this.#config = parse(ReflectorIndexerParamsSchema, props);
  }

  get oracles(): string[] {
    return [...this.#config.oracles];
  }

  async fetchOraclesData(): Promise<ReflectorOraclesResultOutput> {
    await this.startWasm();
    const result = await this.api.url("/v1/protocols/reflector/").get().json();
    return parseAsync(ReflectorOraclesResultSchema, result);
  }

  async fetchHistoricalPrices(oracleId: string, opts?: ReflectorOraclePricesOpts): Promise<ReflectorOraclePricesResultOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/reflector/${oracleId}/prices`)
      .query(opts || {})
      .get()
      .json();
    return parseAsync(ReflectorOraclePricesResultSchema, result);
  }
}
