import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { pino, type Logger as PinoLogger } from 'pino';
import type { HttpLogger } from 'pino-http';
import { AppModule } from './app.module.js';
import { configureApp } from './config/app.config.js';
import type { Env } from './config/env.schema.js';
import {
  createPinoOptions,
  HTTP_LOGGER,
  type LoggerEnv,
} from './config/logger.config.js';

async function bootstrap(): Promise<void> {
  let app: NestExpressApplication;
  try {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
      // Both off so a failure here reaches the catch below as one log line.
      // abortOnError would print Nest's own error and exit before it, and
      // autoFlushLogs would print the buffered lines in Nest's text format.
      abortOnError: false,
      autoFlushLogs: false,
    });
  } catch (error) {
    // Typically invalid env. The app's logger does not exist yet, and its
    // config may be what is invalid, so a standalone one is used.
    exitWithFatal(pino(createPinoOptions(fallbackLoggerEnv())), error);
  }

  app.useLogger(app.get(Logger));
  app.flushLogs();

  try {
    const config = app.get(ConfigService<Env, true>);
    app.enableShutdownHooks();
    await configureApp(app);
    await app.listen(config.get('PORT', { infer: true }));
  } catch (error) {
    // E.g. the database is unreachable when Prisma connects during init.
    exitWithFatal(app.get<HttpLogger>(HTTP_LOGGER).logger, error);
  }
}

function fallbackLoggerEnv(): LoggerEnv {
  return {
    NODE_ENV:
      process.env.NODE_ENV === 'development' ? 'development' : 'production',
    LOG_LEVEL: 'info',
  };
}

function exitWithFatal(logger: PinoLogger, error: unknown): never {
  logger.fatal({ err: error }, 'Application failed to start');
  process.exit(1);
}

await bootstrap();
