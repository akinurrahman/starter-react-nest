import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
