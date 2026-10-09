import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import type { Env } from './env.schema.js';

export const SWAGGER_PATH = 'docs';
export const SWAGGER_JSON_PATH = 'docs-json';

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Starter API')
    .setVersion('0.1.0')
    .build();

  // Required by nestjs-zod: strips its x-nestjs_zod-* markers, applies
  // `.meta({ id })` renames and hoists nested zod schemas into components.
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}

// Returns whether the docs were mounted.
export function setupSwagger(app: INestApplication): boolean {
  const config = app.get(ConfigService<Env, true>);
  if (!config.get('SWAGGER_ENABLED', { infer: true })) return false;

  SwaggerModule.setup(SWAGGER_PATH, app, createSwaggerDocument(app), {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });
  return true;
}
