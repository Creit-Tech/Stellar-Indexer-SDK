import {
  any,
  array,
  bigint,
  boolean,
  custom,
  type CustomIssue,
  type CustomSchema,
  date,
  enum_,
  type InferInput,
  type InferOutput,
  integer,
  literal,
  maxLength,
  maxValue,
  minLength,
  minValue,
  null_,
  number,
  object,
  optional,
  pipe,
  record,
  string,
  toBigint,
  toDate,
  transform,
  union,
} from "@valibot/valibot";
import { Networks, scValToNative, StrKey, xdr } from "@stellar/stellar-sdk";
import { encode } from "@stellar/stellar-xdr-json";

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[]
    : T[P] extends object | undefined ? RecursivePartial<T[P]>
    : T[P];
};

export const IsStellarAccount = (): CustomSchema<string, (issue: CustomIssue) => string> =>
  custom((input: unknown): boolean => {
    if (typeof input !== "string") return false;
    return StrKey.isValidEd25519PublicKey(input);
  }, (issue: CustomIssue): string => `${issue.received} is not a valid 'G' Stellar Address`);

export const IsStellarContract = (): CustomSchema<string, (issue: CustomIssue) => string> =>
  custom((input: unknown): boolean => {
    if (typeof input !== "string") return false;
    return StrKey.isValidContract(input);
  }, (issue: CustomIssue): string => `${issue.received} is not a valid 'C' Stellar Address`);

export const IsStellarAddress = (): CustomSchema<string, string> =>
  custom((input: unknown): boolean => {
    if (typeof input !== "string") return false;
    return StrKey.isValidContract(input) || StrKey.isValidEd25519PublicKey(input);
  }, "Value is not a valid 'C' Stellar Address");

// ----- ----- Schemas ----- -----
export type StellarIndexerSdkParamsInput = InferInput<typeof StellarIndexerSdkParamsSchema>;
export const StellarIndexerSdkParamsSchema = object({
  consumerToken: string(),
  apiUrl: optional(string()),
  network: optional(enum_(Networks), Networks.PUBLIC),
  skipWASM: optional(boolean(), false),
});
export type StellarIndexerSdkParamsOutput = InferOutput<typeof StellarIndexerSdkParamsSchema>;

export type FetchContractDataBodyInput = InferInput<typeof FetchContractDataBodySchema>;
export const FetchContractDataBodySchema = object({
  contracts: pipe(array(IsStellarContract()), minLength(1), maxLength(25)),
  key: optional(pipe(array(record(string(), any())), maxLength(100)), []),
  val: optional(pipe(array(record(string(), any())), maxLength(100)), []),
  limit: optional(pipe(number(), integer(), minValue(1), maxValue(200)), 25),
  page: optional(pipe(number(), integer(), minValue(0)), 0),
  sort: optional(union([literal("desc"), literal("asc")]), "desc"),
  orderBy: optional(union([literal("timestamp"), literal("none")]), "timestamp"),
});
export type FetchContractDataBodyOutput = InferOutput<
  typeof FetchContractDataBodySchema
>;

export type ContractDataInput = InferInput<typeof ContractDataSchema>;
export const ContractDataSchema = object({
  id: string(),
  contract_id: IsStellarContract(),
  durability: string(),
  key: pipe(
    record(string(), any()),
    transform((data) => {
      if ("_" in data) {
        return data._;
      } else {
        return scValToNative(xdr.ScVal.fromXDR(encode("ScVal", JSON.stringify(data)), "base64"));
      }
    }),
  ),
  val: pipe(
    record(string(), any()),
    transform((data) => {
      if ("contract_instance" in data) {
        return {
          storage: scValToNative(xdr.ScVal.fromXDR(encode("ScVal", JSON.stringify({ map: data.contract_instance.storage })), "base64")),
          executable: data.contract_instance.executable.wasm,
        };
      } else {
        return scValToNative(xdr.ScVal.fromXDR(encode("ScVal", JSON.stringify(data)), "base64"));
      }
    }),
  ),
  last_modified_ledger_seq: number(),
  tx_meta_version: number(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  deleted_at: union([pipe(string(), toDate(), date()), date(), null_()]),
});
export type ContractData = InferOutput<typeof ContractDataSchema>;

export type ContractDataSnapShotInput = InferInput<typeof ContractDataSnapShotSchema>;
export const ContractDataSnapShotSchema = object({
  id: string(),
  contract_data_id: ContractDataSchema.entries.id,
  val: ContractDataSchema.entries.val,
  ledger: number(),
  tx_meta_version: ContractDataSchema.entries.tx_meta_version,
  timestamp: ContractDataSchema.entries.timestamp,
});
export type ContractDataSnapShotOutput = InferOutput<typeof ContractDataSnapShotSchema>;

export const ContractEventSchema = object({
  id: string(),
  contract_id: IsStellarContract(),
  topics: union([
    array(any()),
    pipe(
      record(string(), any()),
      transform((data) => {
        return scValToNative(xdr.ScVal.fromXDR(encode("ScVal", JSON.stringify({ vec: Object.values(data) })), "base64"));
      }),
    ),
  ]),
  data: pipe(
    record(string(), any()),
    transform((data) => {
      try {
        return scValToNative(xdr.ScVal.fromXDR(encode("ScVal", JSON.stringify(data)), "base64"));
      } catch {
        // If the parsing doesn't work, we return the regular data because we assume this record was already parsed
        // And the `topics` validation already passed
        return data;
      }
    }),
  ),
  index: number(),
  tx_meta_version: number(),
  sequence: number(),
  timestamp: union([pipe(string(), toBigint(), bigint()), bigint()]),
  tx_hash: string(),
});
export type ContractEvent = InferOutput<typeof ContractEventSchema>;
