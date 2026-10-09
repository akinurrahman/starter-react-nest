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

  it('rejects invalid input with the failing fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/validation-test')
      .send({ name: 'A', email: 'not-an-email' })
      .expect(400);

    const paths = (res.body.errors as { path: string[] }[]).map((e) =>
      e.path.join('.'),
    );
    expect(paths).toEqual(expect.arrayContaining(['name', 'email']));
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
