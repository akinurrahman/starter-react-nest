import type { z } from 'zod';

type ZodDef = {
  type?: string;
  shape?: Record<string, unknown>;
  innerType?: unknown;
  defaultValue?: unknown;
};

const warned = new WeakSet<object>();

/**
 * Derives react-hook-form defaults from a Zod object schema.
 *
 * A field registered without a default starts as undefined, so on submit
 * `z.string().min(2, 'msg')` fails Zod's type check first and the custom
 * message never shows, and React warns about a control switching from
 * uncontrolled to controlled. Seeding strings, enums and arrays with their
 * natural empty fixes both. Numbers and booleans stay undefined so required
 * still fires and coercion stays correct. Nested objects recurse.
 */
export function getDefaults<S extends z.ZodType>(
  schema: S,
): Partial<z.input<S>> {
  const shape = defOf(schema)?.shape;
  if (!shape) {
    if (import.meta.env.DEV && !warned.has(schema)) {
      warned.add(schema);
      console.warn(
        `[form] getDefaults found no object shape on a "${defOf(schema)?.type}" schema, so no defaults were derived. Pass defaultValues, or keep the transform off the root object.`,
      );
    }
    return {};
  }
  return fromShape(shape) as Partial<z.input<S>>;
}

function fromShape(shape: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in shape) {
    const value = emptyFor(shape[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function emptyFor(field: unknown): unknown {
  const def = defOf(field);
  switch (def?.type) {
    case 'string':
    case 'enum':
      return '';
    case 'array':
      return [];
    case 'object':
      return fromShape(def.shape ?? {});
    case 'default':
      return def.defaultValue;
    // An optional group stays undefined: seeding {} would make Zod validate
    // fields the person never chose to fill in.
    case 'optional':
    case 'nullable':
      return defOf(def.innerType)?.type === 'object'
        ? undefined
        : emptyFor(def.innerType);
    default:
      return undefined;
  }
}

function defOf(schema: unknown): ZodDef | undefined {
  return (schema as { def?: ZodDef } | undefined)?.def;
}
