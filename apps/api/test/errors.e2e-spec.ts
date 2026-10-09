import { Test, TestingModule } from '@nestjs/testing';
import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { ConflictError, NotFoundError } from './../src/common/errors/index.js';

@Controller('errors-test')
class ErrorsTestController {
  @Get('not-found')
  notFound() {
    throw new NotFoundError('USER_NOT_FOUND', 'User not found');
  }

  @Get('conflict')
  conflict() {
    throw new ConflictError();
  }

  @Get('crash')
  crash() {
    throw new Error('secret database password leaked');
  }

  @Post('echo')
  echo(@Body() body: unknown) {
    return body;
  }
}

describe('Global exception filter (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ErrorsTestController],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    await app.init();
  });

  it('maps NotFoundError with a custom code', () => {
    return request(app.getHttpServer())
      .get('/errors-test/not-found')
      .expect(404)
      .expect({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
  });

  it('maps ConflictError with defaults', () => {
    return request(app.getHttpServer())
      .get('/errors-test/conflict')
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'CONFLICT',
        message: 'Resource already exists',
      });
  });

  it('hides unknown errors behind INTERNAL_ERROR', async () => {
    const res = await request(app.getHttpServer())
      .get('/errors-test/crash')
      .expect(500)
      .expect({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });

    expect(res.text).not.toContain('secret database password');
  });

  it('maps an unknown route to NOT_FOUND', () => {
    return request(app.getHttpServer())
      .get('/does-not-exist')
      .expect(404)
      .expect({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
  });

  it('maps a malformed JSON body to BAD_REQUEST', () => {
    return request(app.getHttpServer())
      .post('/errors-test/echo')
      .set('Content-Type', 'application/json')
      .send('{"name": ')
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Bad request',
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
