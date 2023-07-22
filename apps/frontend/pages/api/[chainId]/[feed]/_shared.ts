import { chainIdToMetadata } from "@hyperlane-xyz/sdk";
import Axios from "axios";
import {
  Address,
  createPublicClient,
  decodeDeployData,
  decodeEventLog,
  decodeFunctionData,
  encodeAbiParameters,
  http,
  keccak256,
  zeroAddress,
} from "viem";
import * as chains from "viem/chains";
import { EtherscanError, EtherscanSuccess, isEtherscanError } from "./_types";

import EACAggregatorProxyAbi from "../../../../abis/EACAggregatorProxy.json";
import AccessControlledOffchainAggregatorAbi from "../../../../abis/AccessControlledOffchainAggregator.json";
import { etherscanKey, rpcUri } from "./_env";
import * as etherscan from "./_types";

export const TRANSMIT_SIGNATURE =
  "transmit(bytes _report, bytes32[] _rs, bytes32[] _ss, bytes32 _rawVs)";

const axios = Axios.create();

export class EtherscanService {
  constructor() {}

  private async etherscanRequest<T>(
    chainId: number,
    params: URLSearchParams
  ): Promise<T> {
    const etherscanConfig = chainIdToMetadata[chainId].blockExplorers?.find(
      (x) => x.family === "etherscan"
    );
    if (!etherscanConfig) {
      throw new Error("no etherscan config found");
    }

    const apiKey = process.env[etherscanKey(chainId)];
    params.append("apikey", apiKey!);

    const response = await axios.get<EtherscanSuccess<T> | EtherscanError>(
      `${etherscanConfig.apiUrl}?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;
    if (response.status !== 200 || isEtherscanError(result)) {
      console.log(response.data);
      throw new Error("etherscan");
    }

    return result.result;
  }

  private async getAggregator(chainId: number, feed: string): Promise<Address> {
    const client = this.getEthClient(chainId);

    return (await client.readContract({
      address: feed as Address,
      abi: EACAggregatorProxyAbi,
      functionName: "aggregator",
    })) as Address;
  }

  private async getLatestTransmit(chainId: number, aggregator: string) {
    const result = await this.etherscanRequest<etherscan.Account[]>(
      chainId,
      new URLSearchParams({
        module: "account",
        action: "txlist",
        address: aggregator,
        startblock: "0",
        endblock: "99999999",
        page: "1",
        offset: "10",
        sort: "desc",
      })
    );

    const tx = result.find(
      (x) => x.functionName === TRANSMIT_SIGNATURE && x.isError === "0"
    );
    if (!tx) {
      throw new Error("");
    }

    return tx;
  }

  private getEthClient(chainId: number) {
    const chain = Object.values(chains).find((x) => x.id === chainId);
    if (!chain) {
      throw new Error("Unknown chain ID");
    }

    const rpc = process.env[rpcUri(chainId)];
    const transport = rpc ? http(rpc) : http(chain.rpcUrls.default.http[0]);
    return createPublicClient({ chain, transport });
  }

  async getLatestRoundId(chainId: number, feed: string) {
    const aggregator = await this.getAggregator(chainId, feed);
    const tx = await this.getLatestTransmit(chainId, aggregator);

    const receipt = await this.getEthClient(chainId).getTransactionReceipt({
      hash: tx.hash,
    });

    const { args } = decodeEventLog({
      abi: AccessControlledOffchainAggregatorAbi,
      topics: receipt.logs[0].topics,
      data: receipt.logs[0].data,
    });

    return (args as any).aggregatorRoundId as number;
  }

  async getSetConfigArguments(chainId: number, feed: string) {
    const aggregator = await this.getAggregator(chainId, feed);

    const result = await this.etherscanRequest<etherscan.Account[]>(
      chainId,
      new URLSearchParams({
        module: "account",
        action: "txlist",
        address: aggregator,
        startblock: "0",
        endblock: "99999999",
        page: "0",
        offset: "100",
        sort: "asc",
      })
    );

    const setConfigTxs = result.filter(
      (x) =>
        x.functionName ===
          "setConfig(address[] _signers, address[] _transmitters, uint8 _threshold, uint64 _encodedConfigVersion, bytes _encoded)" &&
        x.isError === "0"
    );
    if (!setConfigTxs.length) {
      throw new Error("");
    }

    // take latest setConfig call
    const data = setConfigTxs[setConfigTxs.length - 1].input;

    // @ts-expect-error
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    const { args } = decodeFunctionData({
      abi: AccessControlledOffchainAggregatorAbi,
      data,
    });

    return args;
  }

  async getRoundData(chainId: number, feed: string, roundId: number) {
    const aggregator = await this.getAggregator(chainId, feed);

    const topic1 = encodeAbiParameters(
      [{ name: "x", type: "uint32" }],
      [roundId]
    );

    const result = await this.etherscanRequest<etherscan.Log[]>(
      chainId,
      new URLSearchParams({
        module: "logs",
        action: "getLogs",
        address: aggregator,
        startblock: "0",
        endblock: "99999999",
        page: "0",
        offset: "1000",
        topic0: keccak256(
          // @ts-expect-error no idea why Viem enforces 0x here
          "NewTransmission(uint32,int192,address,int192[],bytes,bytes32)"
        ),
        topic0_1_opr: "and",
        topic1,
      })
    );

    if (!result.length) {
      throw new Error("");
    }

    const tx = await this.getEthClient(chainId).getTransaction({
      hash: result[0].transactionHash,
    });

    return { data: tx.input };
  }

  async getConstructorArguments(chainId: number, feed: string) {
    return [
      "0",
      "0",
      "0",
      "0",
      "0",
      zeroAddress,
      "0",
      "95780971304118053647396689196894323976171195136475135",
      zeroAddress,
      zeroAddress,
      "8",
      "",
    ];

    // Unable to parse this data with Viem https://github.com/wagmi-dev/viem/issues/855

    // const aggregator = await this.getAggregator(chainId, feed);

    // const [response, bytecode] = await Promise.all([
    //   this.etherscanRequest(
    //     chainId,
    //     new URLSearchParams({
    //       module: "account",
    //       action: "txlist",
    //       address: aggregator,
    //       startblock: "0",
    //       endblock: "99999999",
    //       page: "1",
    //       offset: "1",
    //       sort: "asc",
    //     })
    //   ),
    //   this.getEthClient(chainId).getBytecode({
    //     address: aggregator as Address,
    //   }),
    // ]);

    // const { args } = decodeDeployData({
    //   abi: AccessControlledOffchainAggregatorAbi,
    //   // viem adds 0x to the data property
    //   // @ts-expect-error
    //   data: response[0].input.slice(2),
    //   // viem adds 0x to bytecode data property
    //   bytecode: bytecode!.slice(2) as Address,
    // });
    // console.log(args);

    // // console.log(args);

    // return [];
  }
}
