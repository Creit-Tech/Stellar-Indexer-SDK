import { array, bigint, type InferInput, type InferOutput, number, object, optional, string } from "@valibot/valibot";
import {
  type FetchContractDataBodyInput,
  FetchContractDataBodySchema,
  IsStellarAddress,
  IsStellarContract,
  StellarIndexerSdkParamsSchema,
} from "../../schemas.ts";

export type StellarDomainsIndexerParamsInput = InferInput<typeof StellarDomainsIndexerParamsSchema>;
export const StellarDomainsIndexerParamsSchema = object({
  ...StellarIndexerSdkParamsSchema.entries,
  registry: optional(string(), "CC75Z72OCE667WVPQOROIWDAGBOXFNJ4VQONQEURL74EYIDLWA4F7FEN"),
  nfd: optional(string(), "CADCRH6BW3MIZBBE7JOVKROR2GBEG64TJDT5Y3EX3OOIWRDZOOT5XUHD"),
});
export type StellarDomainsIndexerParamsOutput = InferOutput<typeof StellarDomainsIndexerParamsSchema>;

export const StellarDomainsInstanceDataSchema = object({
  Admin: IsStellarAddress(),
  Index: number(),
  NFD: IsStellarContract(),
  Oracle: IsStellarContract(),
  PayingAsset: IsStellarContract(),
  TLDs: array(string()),
  executable: string(),
});
export type StellarDomainsInstanceData = InferOutput<typeof StellarDomainsInstanceDataSchema>;

export const StellarDomainSchema = object({
  address: IsStellarAddress(),
  domain: string(),
  exp_date: bigint(),
  node: string(),
  snapshot: bigint(),
  tld: string(),
  token_id: number(),
});
export type StellarDomain = InferOutput<typeof StellarDomainSchema>;

export const GetAllDomainsParamsSchema = object({
  page: FetchContractDataBodySchema.entries.page,
  limit: FetchContractDataBodySchema.entries.limit,
});
export type GetAllDomainsParams = Pick<FetchContractDataBodyInput, "page" | "limit">;
