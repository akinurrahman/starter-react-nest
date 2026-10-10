import type { NestExpressApplication } from '@nestjs/platform-express';
import type { RequestHandler } from 'express';
import { NotFoundError } from '../common/errors/index.js';
import { toErrorResponse } from '../common/filters/all-exceptions.filter.js';
import { configureHttp } from './http.config.js';
import { setupSwagger } from './swagger.config.js';

// Everything main.ts does to the app before listening. The e2e tests call it
// too, so they exercise the same middleware order as production.
export async function configureApp(app: NestExpressApplication): Promise<void> {
  configureHttp(app);
  setupSwagger(app);
  await app.init();
  // After init, so it comes after every route. Nest's own not-found handler
  // is mounted under the global prefix only; without this, any other path
  // would get Express's HTML 404.
  app.use(notFound);
}

const notFound: RequestHandler = (_req, res) => {
  const body = toErrorResponse(new NotFoundError());
  res.status(body.statusCode).json(body);
};
