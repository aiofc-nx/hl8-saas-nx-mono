/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import { AppConfig } from './app/config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // 获取应用配置
  const appConfig = app.get(AppConfig);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // 从配置文件获取端口和主机
  const port = appConfig.server.port;
  const host = appConfig.server.host || '0.0.0.0';

  await app.listen(port, host);
  Logger.log(
    `🚀 Application is running on: http://${host}:${port}/${globalPrefix}`
  );
}

bootstrap();
