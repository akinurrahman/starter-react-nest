import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';
import { configureHttp } from './config/http.config.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService<Env, true>);
  app.enableShutdownHooks();
  configureHttp(app);
  setupSwagger(app);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
