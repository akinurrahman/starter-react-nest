import { Test, TestingModule } from '@nestjs/testing';
import { Body, Controller, Get, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { ConflictError, NotFoundError } from './../src/common/errors/index.js';
import { configureApp } from './../src/config/app.config.js';

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

const NOT_FOUND = {
  statusCode: 404,
  code: 'NOT_FOUND',
  message: 'Resource not found',
};

describe('Global exception filter (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ErrorsTestController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    await configureApp(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('maps NotFoundError with a custom code', () => {
    return request(app.getHttpServer())
      .get('/api/errors-test/not-found')
      .expect(404)
      .expect({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
  });

  it('maps ConflictError with defaults', () => {
    return request(app.getHttpServer())
      .get('/api/errors-test/conflict')
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'CONFLICT',
        message: 'Resource already exists',
      });
  });

  it('hides unknown errors behind INTERNAL_ERROR', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/errors-test/crash')
      .expect(500)
      .expect({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });

    expect(res.text).not.toContain('secret database password');
  });

  describe('unknown routes', () => {
    it.each([
      ['GET', '/api/does-not-exist'],
      ['GET', '/does-not-exist'],
      ['GET', '/%E0%A4%A'],
      ['POST', '/health'],
      ['DELETE', '/api/errors-test/conflict'],
    ])('answers %s %s with a JSON 404', async (method, path) => {
      await request(app.getHttpServer())
        [method.toLowerCase() as 'get' | 'post' | 'delete'](path)
        .expect(404)
        .expect('Content-Type', /application\/json/)
        .expect(NOT_FOUND);
    });
  });

  describe('body parsing', () => {
    function post(body: string, contentType = 'application/json') {
      return request(app.getHttpServer())
        .post('/api/errors-test/echo')
        .set('Content-Type', contentType)
        .send(body);
    }

    it('maps a malformed JSON body to BAD_REQUEST', async () => {
      await post('{"name": ').expect(400).expect({
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Bad request',
      });
    });

    it('maps a body over the limit to PAYLOAD_TOO_LARGE', async () => {
      await post(JSON.stringify({ blob: 'x'.repeat(200 * 1024) }))
        .expect(413)
        .expect({
          statusCode: 413,
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Payload too large',
        });
    });

    it('maps an unsupported charset to UNSUPPORTED_MEDIA_TYPE', async () => {
      await post('{}', 'application/json; charset=bogus').expect(415).expect({
        statusCode: 415,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Unsupported media type',
      });
    });

    it('also handles parser errors outside the prefix', () => {
      return request(app.getHttpServer())
        .post('/does-not-exist')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ blob: 'x'.repeat(200 * 1024) }))
        .expect(413);
    });
  });
});
