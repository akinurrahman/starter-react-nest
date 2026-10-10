import type { AsyncOptionsSource, Option } from '@/systems/form';

type FieldCommon<K extends string, P extends string> = {
  key: K;
  label: string;
  // Cleared in the draft whenever this parent changes, and hidden until it
  // has a value.
  dependsOn?: Exclude<P, K>;
  // Keeps a dependent on screen, disabled, while its parent is empty.
  alwaysVisible?: boolean;
  placeholder?: string;
  // Both columns from sm up. Phones always get one.
  span?: 'half' | 'full';
  disabled?: boolean;
};

type StringControl =
  | { type: 'select'; options: readonly Option[] }
  | {
      type: 'asyncSelect';
      source: AsyncOptionsSource;
      initialOptions?: readonly Option[];
    }
  // yyyy-MM-dd bounds.
  | { type: 'date'; min?: string; max?: string }
  // Writes 'true' when on and drops the param when off.
  | { type: 'switch' }
  | { type: 'radio'; options: readonly Option[] };

type ListControl = { type: 'multiSelect'; options: readonly Option[] };

type FieldFor<T, K extends keyof T & string> = [NonNullable<T[K]>] extends [
  readonly unknown[],
]
  ? FieldCommon<K, keyof T & string> & ListControl
  : [NonNullable<T[K]>] extends [string]
    ? FieldCommon<K, keyof T & string> & StringControl
    : never;

// Keyed by the spec's filter type, so a list filter only takes multiSelect,
// a string filter takes the rest, and a number like the page takes nothing.
export type FilterPopoverField<T> = {
  [K in keyof T & string]-?: FieldFor<T, K>;
}[keyof T & string];

// The shape the popover reads at runtime, once the key typing has done its job.
export type PopoverFieldShape = FieldCommon<string, string> &
  (StringControl | ListControl);

type Dependent = { key: string; dependsOn?: string };

// Every field that hangs off this one, however many levels down.
export function dependentsOf(
  fields: readonly Dependent[],
  key: string,
): string[] {
  const cleared = new Set([key]);
  let grew = true;

  while (grew) {
    grew = false;
    fields.forEach((field) => {
      if (
        field.dependsOn &&
        cleared.has(field.dependsOn) &&
        !cleared.has(field.key)
      ) {
        cleared.add(field.key);
        grew = true;
      }
    });
  }

  cleared.delete(key);
  return [...cleared];
}
