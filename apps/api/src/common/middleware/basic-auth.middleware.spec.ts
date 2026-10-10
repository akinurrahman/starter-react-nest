import { parseBasicAuth } from './basic-auth.middleware.js';

function encode(value: string): string {
  return Buffer.from(value).toString('base64');
}

describe('parseBasicAuth', () => {
  it('splits user and password on the first colon', () => {
    expect(parseBasicAuth(`Basic ${encode('docs:pa:ss')}`)).toEqual({
      user: 'docs',
      password: 'pa:ss',
    });
  });

  it('accepts the scheme in any case', () => {
    expect(parseBasicAuth(`basic ${encode('docs:secret')}`)).toEqual({
      user: 'docs',
      password: 'secret',
    });
  });

  it('decodes UTF-8 credentials', () => {
    expect(parseBasicAuth(`Basic ${encode('dócs:pässwörd')}`)).toEqual({
      user: 'dócs',
      password: 'pässwörd',
    });
  });

  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['another scheme', `Bearer ${encode('docs:secret')}`],
    ['no credentials', 'Basic '],
    ['invalid base64', 'Basic !!!'],
    ['no colon', `Basic ${encode('docs')}`],
  ])('returns undefined for %s', (_, header) => {
    expect(parseBasicAuth(header)).toBeUndefined();
  });
});
