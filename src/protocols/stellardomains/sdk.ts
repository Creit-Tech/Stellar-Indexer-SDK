import { parse, parseAsync } from "@valibot/valibot";
import { StellarIndexerSdk } from "../../sdk.ts";
import {
  type GetAllDomainsParams,
  type StellarDomain,
  StellarDomainSchema,
  type StellarDomainsIndexerParamsInput,
  type StellarDomainsIndexerParamsOutput,
  StellarDomainsIndexerParamsSchema,
  type StellarDomainsInstanceData,
  StellarDomainsInstanceDataSchema,
} from "./schemas.ts";
import { encodeHex } from "@std/encoding/hex";
import type { ContractData } from "../../schemas.ts";

/**
 * A Stellar Indexer extension focused on the StellarDomains protocol
 * This extension only requires the `Contracts' Data` package from the Stellar Indexer service.
 *
 * By default, it uses the Mainnet Registry contract and the NFD contract.
 */
export class StellarDomainsIndexerSdk extends StellarIndexerSdk {
  #registry: string;
  #nfd: string;

  constructor(props: StellarDomainsIndexerParamsInput) {
    super(props);
    const parsed: StellarDomainsIndexerParamsOutput = parse(StellarDomainsIndexerParamsSchema, props);
    this.#registry = parsed.registry;
    this.#nfd = parsed.nfd;
  }

  /**
   * This method gets the current `instance` storage of the contract, and it parses all the currently used data
   */
  async instanceData(): Promise<StellarDomainsInstanceData> {
    const [data]: ContractData[] = await this.fetchContractData({
      contracts: [this.#registry],
      key: [{ _: "ledger_key_contract_instance" }],
      limit: 1,
      page: 0,
    });

    return parse(StellarDomainsInstanceDataSchema, {
      Admin: data.val.storage.Admin,
      Index: data.val.storage.Index,
      NFD: data.val.storage.NFD,
      Oracle: data.val.storage.Oracle,
      PayingAsset: data.val.storage.PayingAsset,
      TLDs: data.val.storage.TLDs.map((item: Uint8Array<ArrayBufferLike>) => new TextDecoder().decode(item)),
      executable: data.val.executable,
    });
  }

  /**
   * This method will get all domains in the contract from the newest updated to the oldest one
   * @param opts.limit - The amount of records to return (default: 25)
   * @param opts.page - The current page of the results
   */
  async getAllDomains(opts?: GetAllDomainsParams): Promise<StellarDomain[]> {
    const data: ContractData[] = await this.fetchContractData({
      contracts: [this.#registry],
      key: [{ "vec": [{ "symbol": "Domain" }] }],
      limit: opts?.limit,
      page: opts?.page,
    });

    return await Promise.all(data.map((obj): Promise<StellarDomain> => this.#parseDomainVal(obj)));
  }

  /**
   * This method will get all domains that point to an address
   *
   * @param address - Either a "G" or "C" address
   * @param opts - optional parameters for the call
   * @param opts.limit - The amount of records to return (default: 25)
   * @param opts.page - The current page of the results
   */
  async getAddressDomains(address: string, opts?: GetAllDomainsParams): Promise<StellarDomain[]> {
    const data: ContractData[] = await this.fetchContractData({
      contracts: [this.#registry],
      key: [{ "vec": [{ "symbol": "Domain" }] }],
      val: [{ "map": [{ val: { address } }] }],
      limit: opts?.limit,
      page: opts?.page,
    });

    return await Promise.all(data.map((obj): Promise<StellarDomain> => this.#parseDomainVal(obj)));
  }

  /**
   * This method will get all domains owned by an address using the current NFD contract
   *
   * @param address - Either a "G" or "C" address
   * @param opts - optional parameters for the call
   * @param opts.limit - The amount of records to return (default: 25)
   * @param opts.page - The current page of the results
   */
  async getDomainsOwnedByAddress(address: string, opts?: GetAllDomainsParams): Promise<StellarDomain[]> {
    const firstResult: ContractData[] = await this.fetchContractData({
      contracts: [this.#nfd],
      key: [{ "vec": [{ "symbol": "Owner" }] }],
      val: [{ address }],
      limit: opts?.limit,
      page: opts?.page,
    });

    const nfdIds: number[] = firstResult.map((item: ContractData) => item.key[1]);

    const data: ContractData[] = await this.fetchContractData({
      contracts: [this.#registry],
      key: [{ "vec": [{ "symbol": "Domain" }] }],
      val: nfdIds.map((id: number) => ({ map: [{ key: { symbol: "token_id" }, val: { u32: id } }] })),
      limit: opts?.limit,
      page: opts?.page,
    });

    return await Promise.all(data.map((obj): Promise<StellarDomain> => this.#parseDomainVal(obj)));
  }

  async #parseDomainVal({ val }: ContractData): Promise<StellarDomain> {
    return await parseAsync(StellarDomainSchema, {
      address: val.address,
      domain: new TextDecoder().decode(val.domain),
      exp_date: val.exp_date,
      node: encodeHex(new Uint8Array(val.node)),
      snapshot: val.snapshot,
      tld: new TextDecoder().decode(val.tld),
      token_id: val.token_id,
    });
  }
}
