import 'cross-fetch/polyfill';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Chainlink Proxy')
    .setDescription('Chainlink API proxy for Hyperlane')
    .setVersion('1.0')
    .addTag('chainlink')
    .addTag('hyperlane')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
