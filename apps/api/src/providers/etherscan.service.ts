import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EtherscanError,
  EtherscanSuccess,
  isEtherscanError,
} from "src/types/etherscan";
import {
  Address,
  createPublicClient,
  decodeEventLog,
  encodeAbiParameters,
  http,
  keccak256,
  zeroAddress,
} from "viem";
import { mainnet } from "viem/chains";
import { chainIdToMetadata } from "@hyperlane-xyz/sdk";

import * as OffchainAggregatorAbi from "../abis/OffchainAggregator.json";
import * as PriceFeedAbi from "../abis/PriceFeed.json";
import { TRANSMIT_SIGNATURE } from "../constants";
import { etherscan } from "../types";
import { etherscanKey, rpcUri } from "src/utils/env-keys";

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  private async etherscanRequest<T>(
    chainId: number,
    params: URLSearchParams
  ): Promise<T> {
    const etherscanConfig = chainIdToMetadata[chainId].blockExplorers?.find(
      (x) => x.family === "etherscan"
    );
    if (!etherscanConfig) {
      throw new ServiceUnavailableException("no etherscan config found");
    }

    const apiKey = this.configService.get<string>(etherscanKey(chainId)) ?? "";
    params.append("apikey", apiKey);

    const response = await this.httpService.axiosRef.get<
      EtherscanSuccess<T> | EtherscanError
    >(`${etherscanConfig.apiUrl}?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = response.data;
    if (response.status !== 200 || isEtherscanError(result)) {
      this.logger.error("Invalid Etherscan response code", response.status);
      console.log(response.data);

      throw new ServiceUnavailableException("etherscan");
    }

    return result.result;
  }

  private async getAggregator(chainId: number, feed: string): Promise<string> {
    const client = this.getEthClient(chainId);

    return (await client.readContract({
      address: feed as Address,
      abi: PriceFeedAbi,
      functionName: "aggregator",
    })) as string;
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
      throw new NotFoundException("");
    }

    return tx;
  }

  private getEthClient(chainId: number) {
    const rpc = this.configService.get<string>(rpcUri(chainId)) ?? "";
    return createPublicClient({ chain: mainnet, transport: http(rpc) });
  }

  async getLatestRoundId(chainId: number, feed: string) {
    const aggregator = await this.getAggregator(chainId, feed);
    const tx = await this.getLatestTransmit(chainId, aggregator);

    const receipt = await this.getEthClient(chainId).getTransactionReceipt({
      hash: tx.hash,
    });

    const { args } = decodeEventLog({
      abi: OffchainAggregatorAbi,
      topics: receipt.logs[0].topics,
      data: receipt.logs[0].data,
    });

    return (args as any).aggregatorRoundId as number;
  }

  async getSetConfigData(chainId: number, feed: string) {
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
      throw new NotFoundException("");
    }

    // take latest setConfig call
    return setConfigTxs[setConfigTxs.length - 1].input;
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
      throw new NotFoundException("");
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

    /**
     * having some problems with Viem, revisit after
     * https://github.com/wagmi-dev/viem/pull/777
     */
    // const aggregator = await this.getAggregator(chainId, feed);

    //   const rpc = this.configService.get<string>('ETHEREUM_RPC_URI') ?? '';
    //   const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

    //   const [response, bytecode] = await Promise.all([
    //     this.etherscanRequest(
    //       new URLSearchParams({
    //         module: 'account',
    //         action: 'txlist',
    //         address,
    //         startblock: '0',
    //         endblock: '99999999',
    //         page: '1',
    //         offset: '1',
    //         sort: 'asc',
    //       }),
    //     ),
    //     client.getBytecode({ address: address as Address }),
    //   ]);

    //   if (!response.data || !bytecode) {
    //     throw new NotFoundException('');
    //   }

    //   console.log(response.data.result[0].input);

    //   const { args } = decodeDeployData({
    //     abi: OffchainAggregatorAbi,
    //     // viem adds 0x to the data property
    //     // @ts-expect-error
    //     data: response.data.result[0].input.slice(2),
    //     bytecode,
    //   });

    //   console.log(args);
  }
}
