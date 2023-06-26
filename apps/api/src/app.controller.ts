import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MetadataResponseDto, RoundDataRequestDto } from "./dtos/metadata.dto";
import { EtherscanService } from "./providers/etherscan.service";
import { etherscanKey } from "./utils/env-keys";

@Controller()
export class AppController {
  constructor(
    private readonly etherscanService: EtherscanService,
    private readonly configService: ConfigService
  ) {}

  @Get("/latest_round_id/:chainId/:feed")
  async getLatestRoundId(
    @Param("chainId") chainId: string,
    @Param("feed") feed: string
  ): Promise<number> {
    const etherscanApiKey =
      this.configService.get<string>(etherscanKey(parseInt(chainId))) ?? "";

    if (etherscanApiKey) {
      return this.etherscanService.getLatestRoundId(parseInt(chainId), feed);
    }

    throw new Error("No provider configured");
  }

  @Get("/constructor_arguments/:chainId/:feed")
  async getConstructorArguments(
    @Param("chainId") chainId: string,
    @Param("feed") feed: string
  ): Promise<string[]> {
    const etherscanApiKey =
      this.configService.get<string>(etherscanKey(parseInt(chainId))) ?? "";

    if (etherscanApiKey) {
      return this.etherscanService.getConstructorArguments(
        parseInt(chainId),
        feed
      );
    }

    throw new Error("No provider configured");
  }

  @Get("/set_config_data/:chainId/:feed")
  async getSetConfigData(
    @Param("chainId") chainId: string,
    @Param("feed") feed: string
  ): Promise<string> {
    const etherscanApiKey =
      this.configService.get<string>(etherscanKey(parseInt(chainId))) ?? "";

    if (etherscanApiKey) {
      return this.etherscanService.getSetConfigData(parseInt(chainId), feed);
    }

    throw new Error("No provider configured");
  }

  @Get("/round_data/:chainId/:feed/:roundId")
  async getRoundData(
    @Param("chainId") chainId: string,
    @Param("feed") feed: string,
    @Param("roundId") roundId: string
  ): Promise<MetadataResponseDto> {
    const etherscanApiKey =
      this.configService.get<string>(etherscanKey(parseInt(chainId))) ?? "";

    if (etherscanApiKey) {
      return this.etherscanService.getRoundData(
        parseInt(chainId),
        feed,
        parseInt(roundId)
      );
    }

    throw new Error("No provider configured");
  }
}
