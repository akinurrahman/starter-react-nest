import { Test, TestingModule } from '@nestjs/testing';
import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { z } from 'zod';
import { AppModule } from './../src/app.module.js';

class CreateThingDto extends createZodDto(
  z.object({
    name: z.string().min(2),
    email: z.email(),
  }),
) {}

@Controller('validation-test')
class ValidationTestController {
  @Post()
  create(@Body() body: CreateThingDto) {
    return body;
  }
}

describe('Global validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('accepts valid input', () => {
    return request(app.getHttpServer())
      .post('/validation-test')
      .send({ name: 'Ada', email: 'ada@example.com' })
      .expect(201)
      .expect({ name: 'Ada', email: 'ada@example.com' });
  });

  it('rejects invalid input with the failing fields', () => {
    return request(app.getHttpServer())
      .post('/validation-test')
      .send({ name: 'A', email: 'not-an-email' })
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        errors: [
          {
            path: 'name',
            message: 'Too small: expected string to have >=2 characters',
            code: 'too_small',
          },
          {
            path: 'email',
            message: 'Invalid email address',
            code: 'invalid_format',
          },
        ],
      });
  });

  it('strips unknown fields from the body', () => {
    return request(app.getHttpServer())
      .post('/validation-test')
      .send({ name: 'Ada', email: 'ada@example.com', isAdmin: true })
      .expect(201)
      .expect({ name: 'Ada', email: 'ada@example.com' });
  });

  afterEach(async () => {
    await app.close();
  });
});
