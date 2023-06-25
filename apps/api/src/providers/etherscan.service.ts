import { utils } from '@hyperlane-xyz/utils';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Address,
  concat,
  createPublicClient,
  decodeEventLog,
  decodeFunctionData,
  encodeAbiParameters,
  encodePacked,
  http,
  keccak256,
  recoverAddress,
  toBytes,
  zeroAddress,
} from 'viem';

import {
  EtherscanError,
  EtherscanSuccess,
  isEtherscanError,
} from 'src/types/etherscan';
import { mainnet } from 'viem/chains';
import * as OffchainAggregatorAbi from '../abis/OffchainAggregator.json';
import { TRANSMIT_SIGNATURE } from '../constants';
import { etherscan } from '../types';

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private async etherscanRequest<T>(params: URLSearchParams): Promise<T> {
    const apiKey = this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    params.append('apikey', apiKey);

    const response = await this.httpService.axiosRef.get<
      EtherscanSuccess<T> | EtherscanError
    >(`https://api.etherscan.io/api?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;
    if (response.status !== 200 || isEtherscanError(result)) {
      this.logger.error('Invalid Etherscan response code', response.status);
      console.log(response);

      throw new ServiceUnavailableException('etherscan');
    }

    return result.result;
  }

  private async getLatestTransmit(feed: string) {
    const result = await this.etherscanRequest<etherscan.Account[]>(
      new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address: feed,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10',
        sort: 'desc',
      }),
    );

    const tx = result.find(
      (x) => x.functionName === TRANSMIT_SIGNATURE && x.isError === '0',
    );
    if (!tx) {
      throw new NotFoundException('');
    }

    return tx;
  }

  async getLatestRoundId(feed: string) {
    const tx = await this.getLatestTransmit(feed);

    const rpc = this.configService.get<string>('ETHEREUM_RPC_URI') ?? '';
    const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

    const receipt = await client.getTransactionReceipt({
      hash: tx.hash,
    });

    const { args } = decodeEventLog({
      abi: OffchainAggregatorAbi,
      topics: receipt.logs[0].topics,
      data: receipt.logs[0].data,
    });

    return (args as any).aggregatorRoundId as number;
  }

  async getSetConfigData(address: string) {
    const result = await this.etherscanRequest<etherscan.Account[]>(
      new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10',
        sort: 'asc',
      }),
    );

    const tx = result.find(
      (x) =>
        x.functionName ===
          'setConfig(address[] _signers, address[] _transmitters, uint8 _threshold, uint64 _encodedConfigVersion, bytes _encoded)' &&
        x.isError === '0',
    );
    if (!tx) {
      throw new NotFoundException('');
    }

    return tx.input;
  }

  async getRoundData(feed: string, roundId: number) {
    const topic1 = encodeAbiParameters(
      [{ name: 'x', type: 'uint32' }],
      [roundId],
    );

    // TODO: page this
    const result = await this.etherscanRequest<etherscan.Log[]>(
      new URLSearchParams({
        module: 'logs',
        action: 'getLogs',
        address: feed,
        startblock: '0',
        endblock: '99999999',
        page: '0',
        offset: '100',
        topic0: keccak256(
          // @ts-expect-error no idea why Viem typed it this way
          'NewTransmission(uint32,int192,address,int192[],bytes,bytes32)',
        ),
        topic0_1_opr: 'and',
        topic1,
      }),
    );

    if (!result.length) {
      throw new NotFoundException('');
    }

    const rpc = this.configService.get<string>('ETHEREUM_RPC_URI') ?? '';
    const client = createPublicClient({
      chain: mainnet,
      transport: http(rpc),
    });

    const tx = await client.getTransaction({
      hash: result[0].transactionHash,
    });

    return { data: tx.input };
  }

  async getConstructorArguments(_address: string) {
    return [
      '0',
      '0',
      '0',
      '0',
      '0',
      zeroAddress,
      '0',
      '95780971304118053647396689196894323976171195136475135',
      zeroAddress,
      zeroAddress,
      '8',
      '',
    ];

    /**
     * having some problems with Viem, revisit after
     * https://github.com/wagmi-dev/viem/pull/777
     */

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
