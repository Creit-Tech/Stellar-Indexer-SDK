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
  partial,
  record,
  string,
} from "@valibot/valibot";
import { IsStellarAddress, IsStellarContract, StellarIndexerSdkParamsSchema } from "../../schemas.ts";

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
  supply_cap: bigint(),
  util: number(),
});
export type BlendPoolConfigOutput = InferOutput<typeof BlendPoolAssetConfigSchema>;

export const BlendPoolAssetRecordSchema = object({
  id: IsStellarContract(),
  index: number(),
  data: object({
    b_rate: bigint(),
    b_supply: bigint(),
    backstop_credit: bigint(),
    d_rate: bigint(),
    d_supply: bigint(),
    ir_mod: bigint(),
    last_time: bigint(),
  }),
  emission: object({
    supply: partial(object({
      percentage: optional(bigint(), 0n),
      eps: bigint(),
      expiration: bigint(),
      index: bigint(),
      last_time: bigint(),
    })),
    borrow: partial(object({
      percentage: optional(bigint(), 0n),
      eps: bigint(),
      expiration: bigint(),
      index: bigint(),
      last_time: bigint(),
    })),
  }),
  config: BlendPoolAssetConfigSchema,
  init: partial(object({
    new_config: BlendPoolAssetConfigSchema,
    unlock_time: bigint(),
  })),
});
export type BlendPoolAssetRecord = InferOutput<typeof BlendPoolAssetRecordSchema>;

export const BlendPoolDataSchema = object({
  id: IsStellarContract(),
  Admin: IsStellarAddress(),
  BLNDTkn: IsStellarContract(),
  Backstop: IsStellarContract(),
  Config: object({
    bstop_rate: number(),
    max_positions: number(),
    min_collateral: bigint(),
    oracle: IsStellarContract(),
    status: number(),
  }),
  Name: string(),
  executable: string(),
  assets: record(IsStellarContract(), BlendPoolAssetRecordSchema),
});
export type BlendPoolData = InferOutput<typeof BlendPoolDataSchema>;

export const BlendUserPositionAssetSchema = object({
  underlying: bigint(),
  tokens: bigint(),
});
export type BlendUserPositionAsset = InferOutput<typeof BlendUserPositionAssetSchema>;

export const BlendUserPositionSchema = object({
  pool: IsStellarContract(),
  // We could add more stuff here in the case we want to fully recreate all data the Blend SDK already calculates IE health factor, total USD values, etc
  assets: record(
    IsStellarContract(),
    object({
      collateral: BlendUserPositionAssetSchema,
      liabilities: BlendUserPositionAssetSchema,
      supply: BlendUserPositionAssetSchema,
    }),
  ),
});
export type BlendUserPosition = InferOutput<typeof BlendUserPositionSchema>;

export enum BlendAuctionType {
  UserLiquidation,
  BadDebtAuction,
  InterestAuction,
}

export const BlendAuctionSchema = object({
  user: IsStellarAddress(),
  auct_type: enum_(BlendAuctionType),
  data: object({
    bid: record(IsStellarContract(), bigint()),
    lot: record(IsStellarContract(), bigint()),
    block: number(),
  }),
});
export type BlendAuction = InferOutput<typeof BlendAuctionSchema>;
