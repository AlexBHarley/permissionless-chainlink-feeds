import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MetadataResponseDto, RoundDataRequestDto } from './dtos/metadata.dto';
import { EtherscanService } from './providers/etherscan.service';

@Controller()
export class AppController {
  constructor(
    private readonly etherscanService: EtherscanService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/latest_round_id/:feed')
  async getLatestRoundId(@Param('feed') feed: string): Promise<number> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getLatestRoundId(feed);
    }

    throw new Error('No provider configured');
  }

  @Get('/constructor_arguments/:feed')
  async getConstructorArguments(
    @Param('feed') feed: string,
  ): Promise<string[]> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getConstructorArguments(feed);
    }

    throw new Error('No provider configured');
  }

  @Get('/set_config_data/:feed')
  async getSetConfigData(@Param('feed') feed: string): Promise<string> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getSetConfigData(feed);
    }

    throw new Error('No provider configured');
  }

  @Get('/round_data/:feed/:roundId')
  async getMetadataForReport(
    @Param('feed') feed: string,
    @Param('roundId') roundId: string,
  ): Promise<MetadataResponseDto> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getRoundData(feed, parseInt(roundId));
    }

    throw new Error('No provider configured');
  }
}
