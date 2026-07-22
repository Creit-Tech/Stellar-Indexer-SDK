import {
  array,
  bigint,
  boolean,
  enum_,
  type InferInput,
  type InferOutput,
  literal,
  number,
  object,
  optional,
  partial,
  pipe,
  record,
  string,
  toBigint,
  union,
} from "@valibot/valibot";
import { IsStellarAddress, IsStellarContract, StellarIndexerSdkParamsSchema } from "../../schemas.ts";
import { Networks } from "@stellar/stellar-sdk";

export enum BlendFactoryContract {
  PUBLIC = "CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU",
  TESTNET = "CDV6RX4CGPCOKGTBFS52V3LMWQGZN3LCQTXF5RVPOOCG4XVMHXQ4NTF6",
}

export function getBlendPoolFactoryContractId(network: Networks): string {
  switch (network) {
    case Networks.PUBLIC:
      return BlendFactoryContract.PUBLIC;
    case Networks.TESTNET:
      return BlendFactoryContract.TESTNET;
    case Networks.FUTURENET:
    case Networks.SANDBOX:
    case Networks.STANDALONE:
      throw new Error(`Blend's factory in network ${network} is not available.`);
  }
}

export type BlendIndexerParamsInput = InferInput<typeof BlendIndexerParamsSchema>;
export const BlendIndexerParamsSchema = object({
  ...StellarIndexerSdkParamsSchema.entries,
  emitter: optional(IsStellarContract(), "CCOQM6S7ICIUWA225O5PSJWUBEMXGFSSW2PQFO6FP4DQEKMS5DASRGRR"),
  backstop: optional(IsStellarContract(), "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7"),
  factory: optional(IsStellarContract(), "CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU"),
  cometPool: optional(IsStellarContract(), "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM"),
  trackedPools: optional(array(IsStellarContract()), []),
});
export type BlendIndexerParamsOutput = InferOutput<typeof BlendIndexerParamsSchema>;

export const BlendPoolAssetConfigSchema = object({
  c_factor: number(),
  decimals: number(),
  enabled: boolean(),
  index: number(),
  l_factor: number(),
  max_util: number(),
  r_base: number(),
  r_one: number(),
  r_three: number(),
  r_two: number(),
  reactivity: number(),
  supply_cap: union([pipe(string(), toBigint(), bigint()), bigint()]),
  util: number(),
});
export type BlendPoolConfigOutput = InferOutput<typeof BlendPoolAssetConfigSchema>;

export type BlendPoolAssetRecordDataInput = InferInput<typeof BlendPoolAssetRecordDataSchema>;
export const BlendPoolAssetRecordDataSchema = object({
  b_rate: union([pipe(string(), toBigint(), bigint()), bigint()]),
  b_supply: union([pipe(string(), toBigint(), bigint()), bigint()]),
  backstop_credit: union([pipe(string(), toBigint(), bigint()), bigint()]),
  d_rate: union([pipe(string(), toBigint(), bigint()), bigint()]),
  d_supply: union([pipe(string(), toBigint(), bigint()), bigint()]),
  ir_mod: union([pipe(string(), toBigint(), bigint()), bigint()]),
  last_time: union([pipe(string(), toBigint(), bigint()), bigint()]),
});
export type BlendPoolAssetRecordDataOutput = InferOutput<typeof BlendPoolAssetRecordDataSchema>;

export type BlendPoolAssetRecordEmissionInput = InferInput<typeof BlendPoolAssetRecordEmissionSchema>;
export const BlendPoolAssetRecordEmissionSchema = partial(object({
  percentage: optional(union([pipe(string(), toBigint(), bigint()), bigint()]), 0n),
  eps: union([pipe(string(), toBigint(), bigint()), bigint()]),
  expiration: union([pipe(string(), toBigint(), bigint()), bigint()]),
  index: union([pipe(string(), toBigint(), bigint()), bigint()]),
  last_time: union([pipe(string(), toBigint(), bigint()), bigint()]),
}));
export type BlendPoolAssetRecordEmissionOutput = InferOutput<typeof BlendPoolAssetRecordEmissionSchema>;

export const BlendPoolAssetRecordSchema = object({
  id: IsStellarContract(),
  index: number(),
  data: BlendPoolAssetRecordDataSchema,
  emission: object({
    supply: BlendPoolAssetRecordEmissionSchema,
    borrow: BlendPoolAssetRecordEmissionSchema,
  }),
  config: BlendPoolAssetConfigSchema,
  init: partial(object({
    new_config: BlendPoolAssetConfigSchema,
    unlock_time: union([pipe(string(), toBigint(), bigint()), bigint()]),
  })),
});
export type BlendPoolAssetRecord = InferOutput<typeof BlendPoolAssetRecordSchema>;

export type BlendPoolDataInput = InferInput<typeof BlendPoolDataSchema>;
export const BlendPoolDataSchema = object({
  id: IsStellarContract(),
  Admin: IsStellarAddress(),
  BLNDTkn: IsStellarContract(),
  Backstop: IsStellarContract(),
  Config: object({
    bstop_rate: number(),
    max_positions: number(),
    min_collateral: union([pipe(string(), toBigint(), bigint()), bigint()]),
    oracle: IsStellarContract(),
    status: number(),
  }),
  Name: string(),
  executable: string(),
  assets: record(IsStellarContract(), BlendPoolAssetRecordSchema),
});
export type BlendPoolDataOutput = InferOutput<typeof BlendPoolDataSchema>;

export const BlendUserPositionAssetSchema = object({
  underlying: union([pipe(string(), toBigint(), bigint()), bigint()]),
  tokens: union([pipe(string(), toBigint(), bigint()), bigint()]),
});
export type BlendUserPositionAsset = InferOutput<typeof BlendUserPositionAssetSchema>;

export type BlendUserPositionInput = InferInput<typeof BlendUserPositionSchema>;
export const BlendUserPositionSchema = object({
  collateral: optional(BlendUserPositionAssetSchema),
  liabilities: optional(BlendUserPositionAssetSchema),
  supply: optional(BlendUserPositionAssetSchema),
});
export type BlendUserPositionOutput = InferOutput<typeof BlendUserPositionSchema>;

export const BlendUserPositionsSchema = object({
  pool: IsStellarContract(),
  // We could add more stuff here in the case we want to fully recreate all data the Blend SDK already calculates IE health factor, total USD values, etc
  assets: record(IsStellarContract(), BlendUserPositionSchema),
});
export type BlendUserPositionsOutput = InferOutput<typeof BlendUserPositionsSchema>;

export enum BlendAuctionType {
  UserLiquidation,
  BadDebtAuction,
  InterestAuction,
}

export type BlendAuctionInput = InferInput<typeof BlendAuctionSchema>;
export const BlendAuctionSchema = object({
  user: IsStellarAddress(),
  auct_type: enum_(BlendAuctionType),
  data: object({
    bid: record(IsStellarContract(), union([pipe(string(), toBigint(), bigint()), bigint()])),
    lot: record(IsStellarContract(), union([pipe(string(), toBigint(), bigint()), bigint()])),
    block: number(),
  }),
  removed: boolean(),
});
export type BlendAuctionOutput = InferOutput<typeof BlendAuctionSchema>;

export interface BlendFetchPoolAuctionsParams {
  /**
   * If set to true, the API will also include those auctions that were already removed
   * By default the API will ignore already removed auctions
   */
  includeDeleted?: boolean;

  /**
   * If provided, the API will filter auctions based on the user from whom the assets are being auctioned from
   */
  address?: string;

  /**
   * This allows filtering the type of auction to query
   */
  type?: BlendAuctionType;

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

export enum BlendEventType {
  set_admin = "set_admin",
  update_pool = "update_pool",
  queue_set_reserve = "queue_set_reserve",
  cancel_set_reserve = "cancel_set_reserve",
  set_reserve = "set_reserve",
  set_status = "set_status",
  reserve_emission_update = "reserve_emission_update",
  gulp_emissions = "gulp_emissions",
  claim = "claim",
  bad_debt = "bad_debt",
  defaulted_debt = "defaulted_debt",
  supply = "supply",
  withdraw = "withdraw",
  supply_collateral = "supply_collateral",
  withdraw_collateral = "withdraw_collateral",
  borrow = "borrow",
  repay = "repay",
  flash_loan = "flash_loan",
  gulp = "gulp",
  new_auction = "new_auction",
  fill_auction = "fill_auction",
  delete_auction = "delete_auction",
}

export interface BlendFetchPoolEventsParams {
  /**
   * If provided, the API will filter all events where this address is present in its topics (either asset or account)
   */
  address?: string;

  /**
   * This allows filtering by the type of event
   */
  type?: BlendEventType;

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

export interface BlendFetchPoolAssetHistoricalDataParams {
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

export type BlendPoolAssetHistoricalDataInput = InferInput<typeof BlendPoolAssetHistoricalDataSchema>;
export const BlendPoolAssetHistoricalDataSchema = object({
  ...BlendPoolAssetRecordDataSchema.entries,
  ledger: number(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
});
export type BlendPoolAssetHistoricalDataOutput = InferOutput<typeof BlendPoolAssetHistoricalDataSchema>;

export interface BlendFetchPoolAssetHistoricalEmissionsParams {
  /**
   * Set this in case you only want to get the updates for an specific kind of emission details, if nor provided then both
   * types of records will be returned
   */
  type?: "supply" | "borrow";

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

export type BlendPoolAssetHistoricalEmissionInput = InferInput<typeof BlendPoolAssetHistoricalEmissionSchema>;
export const BlendPoolAssetHistoricalEmissionSchema = object({
  ...BlendPoolAssetRecordEmissionSchema.entries,
  ledger: number(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  type: union([literal("supply"), literal("borrow")]),
});
export type BlendPoolAssetHistoricalEmissionOutput = InferOutput<typeof BlendPoolAssetHistoricalEmissionSchema>;

export type BlendPoolUserPositionHistoryRecordInput = InferInput<typeof BlendPoolUserPositionHistoryRecordSchema>;
export const BlendPoolUserPositionHistoryRecordSchema = object({
  collateral: BlendUserPositionAssetSchema,
  liabilities: BlendUserPositionAssetSchema,
  supply: BlendUserPositionAssetSchema,
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
});
export type BlendPoolUserPositionHistoryRecordOutput = InferOutput<typeof BlendPoolUserPositionHistoryRecordSchema>;
