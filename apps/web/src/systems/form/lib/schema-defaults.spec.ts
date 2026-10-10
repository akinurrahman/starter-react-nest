import { z } from 'zod';
import { getDefaults } from './schema-defaults';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDefaults', () => {
  it('seeds strings, enums and arrays with their empty, leaves the rest undefined', () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.email(),
      role: z.enum(['admin', 'member']),
      tags: z.array(z.string()),
      age: z.number(),
      active: z.boolean(),
    });

    expect(getDefaults(schema)).toEqual({
      name: '',
      email: '',
      role: '',
      tags: [],
    });
  });

  it('uses declared defaults, including function defaults', () => {
    const schema = z.object({
      role: z.string().default('member'),
      active: z.boolean().default(false),
      ids: z.array(z.string()).default(() => ['a']),
    });

    expect(getDefaults(schema)).toEqual({
      role: 'member',
      active: false,
      ids: ['a'],
    });
  });

  it('looks through optional and nullable wrappers', () => {
    const schema = z.object({
      nickname: z.string().optional(),
      notes: z.string().nullable(),
    });

    expect(getDefaults(schema)).toEqual({ nickname: '', notes: '' });
  });

  it('recurses into nested objects', () => {
    const schema = z.object({
      address: z.object({
        city: z.string(),
        geo: z.object({ lat: z.number(), label: z.string() }),
      }),
    });

    expect(getDefaults(schema)).toEqual({
      address: { city: '', geo: { label: '' } },
    });
  });

  it('leaves an optional nested object undefined', () => {
    const schema = z.object({
      billing: z.object({ city: z.string() }).optional(),
    });

    expect(getDefaults(schema)).toEqual({});
  });

  it('warns once per schema in dev when there is no object shape', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const schema = z
      .object({ name: z.string() })
      .transform((value) => ({ ...value, slug: value.name }));

    expect(getDefaults(schema)).toEqual({});
    expect(getDefaults(schema)).toEqual({});

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('no object shape');
  });
});
