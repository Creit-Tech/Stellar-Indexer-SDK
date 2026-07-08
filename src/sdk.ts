import { parse, parseAsync } from "@valibot/valibot";
import {
  type ContractData,
  ContractDataSchema,
  type FetchContractDataBodyInput,
  type FetchContractDataBodyOutput,
  FetchContractDataBodySchema,
  type StellarIndexerSdkParamsInput,
  type StellarIndexerSdkParamsOutput,
  StellarIndexerSdkParamsSchema,
} from "./schemas.ts";
import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import initWASM from "@stellar/stellar-xdr-json";

/**
 * Base class for the Stellar Indexer SDK.
 * This class will be the simplest part of the library and from this base the "extensions" can be created.
 * The base class is the one who takes care of sending the requests to the API and to handle the authentication side.
 */
export class StellarIndexerSdk {
  #apiUrl: string;
  #consumerToken: string;
  #skipWASM: boolean;
  #wasmStarted: boolean = false;

  get api() {
    return wretch(this.#apiUrl).addon(QueryStringAddon).headers({ "authorization": `Bearer ${this.#consumerToken}` });
  }

  constructor(params?: StellarIndexerSdkParamsInput) {
    const parsed: StellarIndexerSdkParamsOutput = parse(StellarIndexerSdkParamsSchema, params);
    this.#apiUrl = parsed.apiUrl;
    this.#consumerToken = parsed.consumerToken;
    this.#skipWASM = parsed.skipWASM;
  }

  async startWasm(): Promise<void> {
    if (this.#skipWASM || this.#wasmStarted) return;
    await initWASM();
    this.#wasmStarted = true;
  }

  /**
   * This method calls the `contract-data` endpoint and parses the response
   *
   * @param params {FetchContractDataBodyInput}
   * @param params.contract_id - The contract id to search
   * @param params.key - an array of key objects
   * @param params.val - an array of val objects (This one is only taken in consideration when there is a provided "key")
   * @param params.limit - The amount of records to get (default 25)
   * @param params.page - The current page of the records, it starts at 0
   * @param params.sort - Either desc or asc (default "desc")
   * @param params.orderBy - Either `timestamp` or `none` (default timestamp)
   */
  async fetchContractData(params: FetchContractDataBodyInput): Promise<ContractData[]> {
    await this.startWasm();
    const payload: FetchContractDataBodyOutput = parse(FetchContractDataBodySchema, params);
    const result: unknown[] = await this.api.url("/v1/contract-data/").post(payload).json();
    return await Promise.all(result.map((r) => parseAsync(ContractDataSchema, r)));
  }
}
