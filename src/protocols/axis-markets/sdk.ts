import { parse, parseAsync } from "@valibot/valibot";
import { StellarIndexerSdk } from "../../sdk.ts";
import {
  type AxisMarketsFetchUserOrdersParams,
  AxisMarketsFetchUserOrdersResultSchema,
  type AxisMarketsIndexerParamsInput,
  type AxisMarketsIndexerParamsOutput,
  AxisMarketsIndexerParamsSchema,
  type AxisMarketsMarketDepthParams,
  type AxisMarketsMarketDepthResultOutput,
  AxisMarketsMarketDepthResultSchema,
  type AxisMarketsOrderOutput,
  AxisMarketsOrderSchema,
  AxisMarketsQuerySwapEventsResultSchema,
  type AxisMarketsQuerySwapsParams,
  AxisMarketsQueryTradeEventsResultSchema,
  type AxisMarketsQueryTradesParams,
  type AxisMarketsSwapEventOutput,
  type AxisMarketsTradeEventOutput,
} from "./schemas.ts";
import type { Networks } from "@stellar/stellar-sdk";

export class AxisMarketsIndexerSdk extends StellarIndexerSdk {
  #config: AxisMarketsIndexerParamsOutput;

  constructor(props: AxisMarketsIndexerParamsInput) {
    super(props);
    this.#config = parse(AxisMarketsIndexerParamsSchema, props);
  }

  setNetwork(network: Networks): void {
    this.#config.network = network;
  }

  async queryOrders(params: AxisMarketsFetchUserOrdersParams): Promise<AxisMarketsOrderOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/axis-markets/orders`).query(params || {}).get().json();
    return parseAsync(AxisMarketsFetchUserOrdersResultSchema, result);
  }

  async fetchOrder(id: bigint | string | number): Promise<AxisMarketsOrderOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/axis-markets/orders/${id.toString()}`).get().json();
    return parseAsync(AxisMarketsOrderSchema, result);
  }

  async queryLastTrades(params: AxisMarketsQueryTradesParams): Promise<AxisMarketsTradeEventOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/axis-markets/last-trades`).query(params || {}).get().json();
    return parseAsync(AxisMarketsQueryTradeEventsResultSchema, result);
  }

  async queryLastSwaps(params: AxisMarketsQuerySwapsParams): Promise<AxisMarketsSwapEventOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/axis-markets/last-swaps`).query(params || {}).get().json();
    return parseAsync(AxisMarketsQuerySwapEventsResultSchema, result);
  }

  async fetchMarketDepth(params: AxisMarketsMarketDepthParams): Promise<AxisMarketsMarketDepthResultOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/axis-markets/market-depth`).query(params || {}).get().json();
    return parseAsync(AxisMarketsMarketDepthResultSchema, result);
  }
}
