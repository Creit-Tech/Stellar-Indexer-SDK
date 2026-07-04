import { parse, parseAsync } from "@valibot/valibot";
import { StellarIndexerSdk } from "../../sdk.ts";
import {
  type BlendAuction,
  BlendAuctionSchema,
  type BlendIndexerParamsInput,
  type BlendIndexerParamsOutput,
  BlendIndexerParamsSchema,
  type BlendPoolAssetRecord,
  type BlendPoolData,
  BlendPoolDataSchema,
  type BlendUserPosition,
  BlendUserPositionSchema,
} from "./schemas.ts";
import type { ContractData, RecursivePartial } from "../../schemas.ts";

export class BlendIndexerSdk extends StellarIndexerSdk {
  #config: BlendIndexerParamsOutput;
  #poolsData: Record<BlendPoolData["id"], BlendPoolData> | undefined = undefined;

  constructor(props: BlendIndexerParamsInput) {
    super(props);
    this.#config = parse(BlendIndexerParamsSchema, props);
  }

  get getPoolsData(): Record<BlendPoolData["id"], BlendPoolData> | undefined {
    return this.#poolsData ? { ...this.#poolsData } : undefined;
  }

  /**
   * This method will fetch the pools deployed using the factory, and it will update the `trackedPools` list in the `#config` object
   * This will also filter those pools that appear as "false" in their records.
   * If the tracked pools already exist, then this method will only save those already in the `trackedPools` list
   */
  async refreshPools(): Promise<void> {
    let data: ContractData[] = await this.fetchContractData({
      contracts: [this.#config.factory],
      key: [{ vec: [{ symbol: "Contracts" }] }],
    });

    if (this.#config.trackedPools.length > 0) {
      const poolsSet: Set<string> = new Set(this.#config.trackedPools);
      data = data.filter((item: ContractData): boolean => poolsSet.has(item.contract_id));
    }

    this.#config.trackedPools = data
      .filter((item: ContractData): boolean => item.val)
      .map((item: ContractData): string => item.key[1]);
  }

  /**
   * This method will fetch all data that isn't related to a user or a position for all tracked pools.
   * Data included:
   * - Instance storage
   * - Emission configuration
   * - Emission data (per asset)
   * - Reserve data and configuration (per asset)
   */
  async fetchPools(): Promise<Record<string, BlendPoolData>> {
    if (this.#config.trackedPools.length === 0) {
      await this.refreshPools();
    }

    let finished: boolean = false;
    let page: number = 0;
    const dataByPool: Record<ContractData["contract_id"], ContractData[]> = {};
    while (!finished) {
      const data: ContractData[] = await this.fetchContractData({
        contracts: this.#config.trackedPools,
        key: [
          { _: "ledger_key_contract_instance" },
          { symbol: "PoolEmis" },
          { symbol: "ResList" },
          { vec: [{ symbol: "EmisData" }] },
          { vec: [{ symbol: "ResConfig" }] },
          { vec: [{ symbol: "ResData" }] },
          { vec: [{ symbol: "ResInit" }] },
        ],
        limit: 200,
        page,
        orderBy: "none",
        sort: "asc",
      });

      for (const item of data) {
        if (dataByPool[item.contract_id]) {
          dataByPool[item.contract_id] = [...dataByPool[item.contract_id], item];
        } else {
          dataByPool[item.contract_id] = [item];
        }
      }

      if (data.length < 200) {
        finished = true;
      } else {
        page++;
      }
    }

    this.#poolsData = Object.entries(dataByPool)
      .reduce((all, [contract_id, data]) => {
        const poolData: RecursivePartial<BlendPoolData> = { id: contract_id, assets: {} };

        const reserves_list_record = data.find((item): boolean => item.key === "ResList");
        const reserves_list: string[] = reserves_list_record!.val;
        reserves_list.forEach((addr: string, i: number): void => {
          poolData.assets![addr] = {
            id: addr,
            index: i,
            data: {},
            emission: {
              supply: {},
              borrow: {},
            },
            config: {},
            init: {},
          };
        });

        for (const item of data) {
          if (typeof item.key === "string") {
            switch (item.key) {
              case "ledger_key_contract_instance":
                poolData.Admin = item.val.storage.Admin;
                poolData.BLNDTkn = item.val.storage.BLNDTkn;
                poolData.Backstop = item.val.storage.Backstop;
                poolData.Config = item.val.storage.Config;
                poolData.Name = item.val.storage.Name;
                poolData.executable = item.val.executable;
                break;

              case "PoolEmis": {
                for (const [id, value] of Object.entries(item.val)) {
                  const isSupply: boolean = Number(id) % 2 > 0;
                  const asset: string = reserves_list[Math.floor(Number(id) / 2)]!;
                  if (isSupply) {
                    poolData.assets![asset]!.emission!.supply = {
                      ...poolData.assets![asset]!.emission!.supply,
                      percentage: value as bigint,
                    };
                  } else {
                    poolData.assets![asset]!.emission!.borrow = {
                      ...poolData.assets![asset]!.emission!.borrow,
                      percentage: value as bigint,
                    };
                  }
                }
                break;
              }

              case "ResList":
                // We already handled this so we just ignore it
                break;

              default:
                throw new Error(`Key "${item.key}" is not supported`);
            }
          } else {
            switch (item.key[0]) {
              case "EmisData": {
                const isSupply: boolean = item.key[1] % 2 > 0;
                const asset: string = reserves_list[Math.floor(item.key[1] / 2)]!;
                if (isSupply) {
                  poolData.assets![asset]!.emission!.supply = {
                    ...poolData.assets![asset]!.emission!.supply,
                    ...item.val,
                  };
                } else {
                  poolData.assets![asset]!.emission!.borrow = {
                    ...poolData.assets![asset]!.emission!.borrow,
                    ...item.val,
                  };
                }
                break;
              }

              case "ResConfig":
                poolData.assets![item.key[1]]!.config = item.val;
                break;

              case "ResData":
                poolData.assets![item.key[1]]!.data = item.val;
                break;

              case "ResInit":
                poolData.assets![item.key[1]]!.init = item.val;
                break;

              default:
                throw new Error(`Key "${item.key[0]}" is not supported`);
            }
          }
        }

        all[poolData.id!] = parse(BlendPoolDataSchema, poolData);

        return all;
      }, {} as Record<string, BlendPoolData>);

    return this.getPoolsData!;
  }

  /**
   * This method will get all positions recorded across all tracked pools for the address provided.
   */
  async fetchUserPositions(address: string): Promise<Record<BlendUserPosition["pool"], BlendUserPosition>> {
    let poolsData: Record<BlendPoolData["id"], BlendPoolData> | undefined = this.getPoolsData;
    if (!poolsData) {
      poolsData = await this.fetchPools();
    }

    const data: ContractData[] = await this.fetchContractData({
      contracts: Object.keys(poolsData),
      key: [{ vec: [{ symbol: "Positions" }, { address }] }],
      limit: 50, // There should be one position record per pool so 50 is a safe limit
    });

    return data.reduce((all, currentValue) => {
      const result: RecursivePartial<BlendUserPosition> = {
        pool: currentValue.contract_id,
        assets: {},
      };
      const pool: BlendPoolData = poolsData[currentValue.contract_id]!;
      const assetsOrder: string[] = Object.values(pool.assets)
        .sort((a, b) => a.index - b.index)
        .map(({ id }): string => {
          result.assets![id] = {
            collateral: { underlying: 0n, tokens: 0n },
            liabilities: { underlying: 0n, tokens: 0n },
            supply: { underlying: 0n, tokens: 0n },
          };
          return id;
        });

      for (const [index, tokens] of Object.entries(currentValue.val.collateral)) {
        const asset: BlendPoolAssetRecord = pool.assets[assetsOrder[Number(index)]];
        result.assets![assetsOrder[Number(index)]]!.collateral = {
          underlying: asset.data.b_rate * (tokens as bigint) / (10n ** 12n),
          tokens: tokens as bigint,
        };
      }

      for (const [index, tokens] of Object.entries(currentValue.val.liabilities)) {
        const asset: BlendPoolAssetRecord = pool.assets[assetsOrder[Number(index)]];
        result.assets![assetsOrder[Number(index)]]!.liabilities = {
          underlying: asset.data.d_rate * (tokens as bigint) / (10n ** 12n),
          tokens: tokens as bigint,
        };
      }

      for (const [index, tokens] of Object.entries(currentValue.val.supply)) {
        const asset: BlendPoolAssetRecord = pool.assets[assetsOrder[Number(index)]];
        result.assets![assetsOrder[Number(index)]]!.supply = {
          underlying: asset.data.b_rate * (tokens as bigint) / (10n ** 12n),
          tokens: tokens as bigint,
        };
      }

      all[pool.id] = parse(BlendUserPositionSchema, result);
      return all;
    }, {} as Record<BlendUserPosition["pool"], BlendUserPosition>);
  }

  /**
   * This method will get all the auctions for a pool without matter if they were already deleted.
   * Sorting will be from the newest to the oldest
   */
  async fetchPoolAuctions(address: string): Promise<BlendAuction[]> {
    if (!this.getPoolsData) {
      await this.fetchPools();
    }

    let finished: boolean = false;
    let page: number = 0;
    let data: ContractData[] = [];
    while (!finished) {
      const items: ContractData[] = await this.fetchContractData({
        contracts: [address],
        key: [{ vec: [{ symbol: "Auction" }] }],
        limit: 200,
      });

      data = [...data, ...items];

      if (data.length < 200) {
        finished = true;
      } else {
        page++;
      }
    }

    return await Promise.all(data.map(async (item: ContractData): Promise<BlendAuction> => {
      return parseAsync(BlendAuctionSchema, {
        user: item.key[1].user,
        auct_type: item.key[1].auct_type,
        data: {
          bid: item.val.bid,
          lot: item.val.lot,
          block: item.val.block,
        },
      });
    }));
  }
}
