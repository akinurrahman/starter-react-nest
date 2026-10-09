import { prettyFactory } from 'pino-pretty';
import { prettyOptions } from './pretty-transport.js';

const prettify = prettyFactory({ ...prettyOptions, colorize: false });

const req = {
  id: '49839e7a-54d4-4bc4-adf8-68db73f5b288',
  method: 'GET',
  url: '/users',
};

describe('pretty transport', () => {
  it('prints a request line as a single line with a short ID', () => {
    const out = prettify({
      level: 40,
      time: 0,
      pid: 1,
      hostname: 'host',
      req,
      res: { statusCode: 404 },
      responseTime: 3,
      msg: 'request completed',
    });

    expect(out.trim().split('\n')).toHaveLength(1);
    expect(out).toContain('WARN: GET /users 404 3ms 49839e7a');
    expect(out).not.toMatch(/pid|host|req:|res:|request completed/);
  });

  it('keeps message, context and stack on other lines', () => {
    const out = prettify({
      level: 50,
      time: 0,
      pid: 1,
      hostname: 'host',
      req,
      context: 'AllExceptionsFilter',
      err: {
        type: 'Error',
        message: 'boom',
        stack: 'Error: boom\n    at crash (app.ts:1:1)',
      },
      msg: 'boom',
    });

    expect(out).toContain('ERROR: boom');
    expect(out).toContain('context: "AllExceptionsFilter"');
    expect(out).toContain('"id": "49839e7a-54d4-4bc4-adf8-68db73f5b288"');
    expect(out).toContain('    at crash (app.ts:1:1)');
    expect(out).not.toMatch(/pid|hostname/);
  });
});
