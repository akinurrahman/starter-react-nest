import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './config/app.config.js';
import type { Env } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService<Env, true>);
  app.enableShutdownHooks();
  await configureApp(app);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
