import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCascade } from '../hooks/use-cascade';
import { gatedText } from '../lib/cascade';
import type { BaseFieldProps, Option, OptionsFn } from '../types';
import { FieldShell } from './field-shell';

type OptionsProps = {
  options?: readonly Option[];
  // Narrows the list from the form's live values, without a round trip.
  optionsFn?: OptionsFn;
};

export type SelectFieldProps = BaseFieldProps &
  OptionsProps & {
    multi?: boolean;
  };

export function SelectField({ multi, ...props }: SelectFieldProps) {
  return multi ? (
    <MultiSelectField {...props} />
  ) : (
    <SingleSelectField {...props} />
  );
}

// Subscribing to every value re-renders the field on each keystroke anywhere
// in the form, so only a field that derives its options pays for it.
function useResolvedOptions({ options, optionsFn }: OptionsProps): Option[] {
  const { control } = useFormContext();
  const values = useWatch({ control, disabled: !optionsFn });

  return useMemo(
    () =>
      optionsFn
        ? optionsFn((values ?? {}) as Record<string, unknown>)
        : [...(options ?? [])],
    [optionsFn, options, values],
  );
}

type FieldProps = BaseFieldProps & OptionsProps;

function SingleSelectField({
  name,
  label,
  hideLabel,
  description,
  placeholder = 'Select...',
  required,
  disabled,
  className,
  dependsOn,
  alwaysVisible,
  options,
  optionsFn,
}: FieldProps) {
  const { gated, dependsOnList } = useCascade({ name, dependsOn });
  const resolved = useResolvedOptions({ options, optionsFn });

  return (
    <FieldShell<string>
      name={name}
      label={label}
      hideLabel={hideLabel}
      description={description}
      required={required}
      className={className}
      hidden={gated && !alwaysVisible}
    >
      {(control) => (
        <Select
          name={control.name}
          value={control.value || null}
          onValueChange={(next) => control.onChange(next ?? '')}
          items={resolved}
          disabled={disabled || gated}
        >
          <SelectTrigger
            id={control.id}
            ref={control.ref}
            onBlur={control.onBlur}
            aria-labelledby={control.labelId}
            aria-invalid={control.invalid}
            aria-required={control.required || undefined}
            aria-describedby={control.describedBy}
            className="w-full"
          >
            <SelectValue
              placeholder={gated ? gatedText(dependsOnList) : placeholder}
            />
          </SelectTrigger>
          <SelectContent>
            {resolved.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}

function MultiSelectField({
  name,
  label,
  hideLabel,
  description,
  placeholder = 'Select...',
  required,
  disabled,
  className,
  dependsOn,
  alwaysVisible,
  options,
  optionsFn,
}: FieldProps) {
  const { gated, dependsOnList } = useCascade({
    name,
    dependsOn,
    emptyValue: [],
  });
  const resolved = useResolvedOptions({ options, optionsFn });
  const anchor = useComboboxAnchor();

  return (
    <FieldShell<string[]>
      name={name}
      label={label}
      hideLabel={hideLabel}
      description={description}
      required={required}
      className={className}
      hidden={gated && !alwaysVisible}
    >
      {(control) => {
        // A value the options no longer list still shows, by its raw value,
        // so it can be seen and removed.
        const selected = (control.value ?? []).map(
          (value) =>
            resolved.find((option) => option.value === value) ?? {
              value,
              label: value,
            },
        );

        return (
          <Combobox
            multiple
            items={resolved}
            value={selected}
            onValueChange={(next: Option[]) =>
              control.onChange(next.map((option) => option.value))
            }
            isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
            disabled={disabled || gated}
          >
            <ComboboxChips ref={anchor} className="w-full">
              <ComboboxValue>
                {(values: Option[]) =>
                  values.map((option) => (
                    <ComboboxChip key={option.value}>
                      {option.label}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput
                id={control.id}
                ref={control.ref}
                onBlur={control.onBlur}
                aria-labelledby={control.labelId}
                aria-invalid={control.invalid}
                aria-required={control.required || undefined}
                aria-describedby={control.describedBy}
                placeholder={
                  gated
                    ? gatedText(dependsOnList)
                    : selected.length
                      ? undefined
                      : placeholder
                }
              />
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>No results.</ComboboxEmpty>
              <ComboboxList>
                {(option: Option) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        );
      }}
    </FieldShell>
  );
}
