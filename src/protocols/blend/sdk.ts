import { array, parse, parseAsync, record } from "@valibot/valibot";
import { StellarIndexerSdk } from "../../sdk.ts";
import {
  type BlendAuctionOutput,
  BlendAuctionSchema,
  BlendCometPoolHistoricalEntrySchema,
  type BlendCometPoolHistoryParams,
  type BlendFetchPoolAssetHistoricalDataParams,
  type BlendFetchPoolAssetHistoricalEmissionsParams,
  type BlendFetchPoolAuctionsParams,
  type BlendFetchPoolEventsParams,
  type BlendIndexerParamsInput,
  type BlendIndexerParamsOutput,
  BlendIndexerParamsSchema,
  type BlendPoolAssetHistoricalDataOutput,
  BlendPoolAssetHistoricalDataSchema,
  type BlendPoolAssetHistoricalEmissionOutput,
  BlendPoolAssetHistoricalEmissionSchema,
  type BlendPoolAssetRecord,
  BlendPoolAssetRecordSchema,
  type BlendPoolDataOutput,
  BlendPoolDataSchema,
  type BlendPoolUserPositionHistoryRecordOutput,
  BlendPoolUserPositionHistoryRecordSchema,
  type BlendUserPositionOutput,
  BlendUserPositionSchema,
  type BlendUserPositionsOutput,
  BlendUserPositionsSchema,
} from "./schemas.ts";
import { type ContractEvent, ContractEventSchema, IsStellarContract } from "../../schemas.ts";

export class BlendIndexerSdk extends StellarIndexerSdk {
  #config: BlendIndexerParamsOutput;

  constructor(props: BlendIndexerParamsInput) {
    super(props);
    this.#config = parse(BlendIndexerParamsSchema, props);
  }

  /**
   * This method will get all pools base information for all pools deployed using the Blend V2 Factory Contract
   */
  async fetchPoolsInfo(): Promise<Record<string, BlendPoolDataOutput>> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/`).get().json();
    return parseAsync(record(IsStellarContract(), BlendPoolDataSchema), result);
  }

  /**
   * Fetch all base information for an specific pool
   */
  async fetchPoolInfo(id: string): Promise<BlendPoolDataOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/`).get().json();
    return parseAsync(BlendPoolDataSchema, result);
  }

  /**
   * Fetch either active-only auctions or all auctions recorded for a pool
   */
  async fetchPoolAuctions(id: string, opts?: BlendFetchPoolAuctionsParams): Promise<BlendAuctionOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/auctions`).query(opts || {}).get().json();
    return parseAsync(array(BlendAuctionSchema), result);
  }

  /**
   * Fetch and filter all events emitted by a pool
   */
  async fetchPoolEvents(id: string, opts?: BlendFetchPoolEventsParams): Promise<ContractEvent[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/events`).query(opts || {}).get().json();
    return parseAsync(array(ContractEventSchema), result);
  }

  /**
   * Fetch data, emission and configuration for an specific asset
   */
  async fetchPoolAssetInfo(id: string, asset: string): Promise<BlendPoolAssetRecord> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/assets/${asset}/`).get().json();
    return parseAsync(BlendPoolAssetRecordSchema, result);
  }

  /**
   * Fetch the historical data for a pool asset, each record means a new update in the pool asset details
   */
  async fetchPoolAssetHistoricalData(
    id: string,
    asset: string,
    opts?: BlendFetchPoolAssetHistoricalDataParams,
  ): Promise<BlendPoolAssetHistoricalDataOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/assets/${asset}/history/data`)
      .query(opts || {})
      .get()
      .json();
    return parseAsync(array(BlendPoolAssetHistoricalDataSchema), result);
  }

  /**
   * Fetch the historical details of emissions for a pool asset
   */
  async fetchPoolAssetHistoricalEmissions(
    id: string,
    asset: string,
    opts?: BlendFetchPoolAssetHistoricalEmissionsParams,
  ): Promise<BlendPoolAssetHistoricalEmissionOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/assets/${asset}/history/emissions`)
      .query(opts || {})
      .get()
      .json();
    return parseAsync(array(BlendPoolAssetHistoricalEmissionSchema), result);
  }

  /**
   * Fetch user positions in a pool (only for assets that have a balance higher to zero)
   */
  async fetchPoolUserPositions(id: string, user: string): Promise<BlendUserPositionsOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/users/${user}/positions`).get().json();
    return parseAsync(BlendUserPositionsSchema, result);
  }

  /**
   * Fetch a single (asset) user position from a pool
   */
  async fetchPoolUserPosition(id: string, user: string, asset: string): Promise<BlendUserPositionOutput> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/users/${user}/positions/${asset}/`).get().json();
    return parseAsync(BlendUserPositionSchema, result);
  }

  /**
   * Fetch the last up to 1000 updates in the asset position, if no limit is provided the API will return up to 30 updates
   */
  async fetchPoolUserPositionHistorical(
    id: string,
    user: string,
    asset: string,
    limit?: number,
  ): Promise<BlendPoolUserPositionHistoryRecordOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/pools/${id}/users/${user}/positions/${asset}/history`)
      .query({ limit })
      .get()
      .json();
    return parseAsync(array(BlendPoolUserPositionHistoryRecordSchema), result);
  }

  /**
   * Fetch ALL positions a user has open in any of the pools deployed by the Blend V2 factory contract
   */
  async fetchUserPositions(user: string): Promise<BlendUserPositionsOutput[]> {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/users/${user}/positions`)
      .get()
      .json();
    return parseAsync(array(BlendUserPositionsSchema), result);
  }

  /**
   * Fetch the historical rates (and reserves) for the original comet pool (BLND 80%/USDC 20%)
   */
  async fetchCometPoolHistory(params?: BlendCometPoolHistoryParams) {
    await this.startWasm();
    const result = await this.api.url(`/v1/protocols/blend/commet-pool/history`)
      .query(params || {})
      .get()
      .json();
    return parseAsync(array(BlendCometPoolHistoricalEntrySchema), result);
  }
}
