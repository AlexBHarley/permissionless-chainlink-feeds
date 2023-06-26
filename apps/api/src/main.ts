import "cross-fetch/polyfill";

import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as morgan from "morgan";

import { AppModule } from "./app.module";

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp();
    const response = res.getResponse();
    response.status(500).json(exception.response);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan("tiny"));
  app.useGlobalFilters(new ExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle("Chainlink Proxy")
    .setDescription("Chainlink API proxy for Hyperlane")
    .setVersion("1.0")
    .addTag("chainlink")
    .addTag("hyperlane")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(3000);
}
bootstrap();
