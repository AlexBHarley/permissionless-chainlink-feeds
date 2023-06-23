import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LatestRoundResponseDto } from './dtos/latest-round.dto';
import { MetadataRequestDto, MetadataResponseDto } from './dtos/metadata.dto';
import { SignersResponseDto } from './dtos/signers.dto';
import { EtherscanService } from './providers/etherscan.service';

@Controller()
export class AppController {
  constructor(
    private readonly etherscanService: EtherscanService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/signers/:feed')
  async getSigners(@Param('feed') feed: string): Promise<SignersResponseDto> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getSigners(feed);
    }

    throw new Error('No provider configured');
  }

  @Get('/latest_round/:feed')
  async getLatestRound(
    @Param('feed') feed: string,
  ): Promise<LatestRoundResponseDto> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getLatestSignatures(feed);
    }

    throw new Error('No provider configured');
  }

  @Post('/metadata')
  async getMetadataForReport(
    @Body() body: MetadataRequestDto,
  ): Promise<MetadataResponseDto> {
    const etherscanApiKey =
      this.configService.get<string>('ETHERSCAN_API_KEY') ?? '';

    if (etherscanApiKey) {
      return this.etherscanService.getMetadataForReport(
        body.aggregator,
        body.report,
      );
    }

    throw new Error('No provider configured');
  }
}
