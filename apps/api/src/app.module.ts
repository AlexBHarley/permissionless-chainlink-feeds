import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

import { AppController } from "./app.controller";

import { EtherscanService } from "./providers/etherscan.service";

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppController],
  providers: [EtherscanService],
})
export class AppModule {}
