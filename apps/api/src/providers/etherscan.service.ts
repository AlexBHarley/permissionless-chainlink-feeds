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
  decodeFunctionData,
  encodePacked,
  keccak256,
  recoverAddress,
  toBytes,
  zeroAddress,
} from 'viem';

import { TRANSMIT_SIGNATURE } from '../constants';
import * as OffchainAggregatorAbi from '../abis/OffchainAggregator.json';
import { etherscan } from '../types';

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private async etherscanRequest(params: URLSearchParams) {
    const apiKey = this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    params.append('apikey', apiKey);

    const response =
      await this.httpService.axiosRef.get<etherscan.AccountTransactionsResponse>(
        `https://api.etherscan.io/api?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

    if (response.status !== 200 || response.data.status !== '1') {
      this.logger.error('Invalid Etherscan response code', response.status);
      throw new ServiceUnavailableException('etherscan');
    }

    return response;
  }

  async getSigners(address: string) {
    const response = await this.etherscanRequest(
      new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10000',
        sort: 'desc',
      }),
    );

    const tx = response.data.result.find(
      (x) =>
        x.functionName ===
          'setConfig(address[] _signers, address[] _transmitters, uint8 _threshold, uint64 _encodedConfigVersion, bytes _encoded)' &&
        x.isError === '0',
    );
    if (!tx) {
      throw new NotFoundException('');
    }

    const { args } = decodeFunctionData({
      abi: OffchainAggregatorAbi,
      data: tx.input,
    });

    const [_signers] = args as Address[][];

    return {
      signers: _signers,
    };
  }

  async getMetadataForReport(address: string, report: string) {
    const response = await this.etherscanRequest(
      new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10',
        sort: 'desc',
      }),
    );

    const tx = response.data.result.find(
      (x) => x.functionName === TRANSMIT_SIGNATURE && x.isError === '0',
    );
    if (!tx) {
      throw new NotFoundException('');
    }

    const { args } = decodeFunctionData({
      abi: OffchainAggregatorAbi,
      data: tx.input,
    });

    const [, rs] = args as Address[][];
    const [, , ss] = args as Address[][];
    const [, , , vs] = args as string[];

    const signatures = rs.map((_r, index) =>
      // note: rsv format
      encodePacked(
        ['bytes32', 'bytes32', 'uint8'],
        [rs[index], ss[index], toBytes(vs)[index] + 27],
      ),
    );

    const addresses = await Promise.all(
      signatures.map(
        async (signature) =>
          utils.addressToBytes32(
            await recoverAddress({
              hash: keccak256(report as Address),
              signature,
            }),
          ) as Address,
      ),
    );

    return {
      metadata: encodePacked(
        ['bytes32', 'uint8', 'bytes', 'bytes'],
        [
          utils.addressToBytes32(zeroAddress) as Address,
          1,
          concat(signatures),
          encodePacked(['bytes32[]'], [addresses]),
        ],
      ),
    };
  }

  async getLatestSignatures(address: string) {
    const response = await this.etherscanRequest(
      new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10',
        sort: 'desc',
      }),
    );

    const tx = response.data.result.find(
      (x) => x.functionName === TRANSMIT_SIGNATURE && x.isError === '0',
    );
    if (!tx) {
      throw new NotFoundException('');
    }

    const { args } = decodeFunctionData({
      abi: OffchainAggregatorAbi,
      data: tx.input,
    });

    const [report] = args as Address[];
    const [, rs] = args as Address[][];
    const [, , ss] = args as Address[][];
    const [, , , vs] = args as string[];

    const signatures = rs.map((_r, index) =>
      // note: rsv format
      encodePacked(
        ['bytes32', 'bytes32', 'uint8'],
        [rs[index], ss[index], toBytes(vs)[index] + 27],
      ),
    );

    const addresses = await Promise.all(
      signatures.map(
        async (signature) =>
          utils.addressToBytes32(
            await recoverAddress({ hash: keccak256(report), signature }),
          ) as Address,
      ),
    );

    return {
      message: report,
      metadata: encodePacked(
        ['bytes32', 'uint8', 'bytes', 'bytes'],
        [
          utils.addressToBytes32(zeroAddress) as Address,
          1,
          concat(signatures),
          encodePacked(['bytes32[]'], [addresses]),
        ],
      ),
    };
  }

  async getConstructorData(_address: string) {
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
