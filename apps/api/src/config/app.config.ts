import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureHttp } from './http.config.js';
import { setupSwagger } from './swagger.config.js';

// Everything main.ts does to the app before listening. The e2e tests call it
// too, so they exercise the same middleware order as production.
export async function configureApp(app: NestExpressApplication): Promise<void> {
  configureHttp(app);
  setupSwagger(app);
  await app.init();
}
