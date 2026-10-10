import { useState, type ComponentProps } from 'react';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { AsyncCombobox, AsyncOptionsList } from '../controls/async-combobox';
import { useAsyncOptions } from '../hooks/use-async-options';
import { useCascade } from '../hooks/use-cascade';
import { gatedText } from '../lib/cascade';
import type { AsyncOptionsSource, BaseFieldProps, Option } from '../types';
import { FieldShell } from './field-shell';

type SourceProps = {
  source: AsyncOptionsSource;
  // Labels for the values an edit form starts with, so the control shows
  // names before its first fetch.
  initialOptions?: readonly Option[];
  debounceMs?: number;
  emptyMessage?: string;
};

export type AsyncSelectFieldProps = BaseFieldProps &
  SourceProps & {
    multi?: boolean;
  };

export function AsyncSelectField({ multi, ...props }: AsyncSelectFieldProps) {
  return multi ? (
    <AsyncMultiSelectField {...props} />
  ) : (
    <AsyncSingleSelectField {...props} />
  );
}

type FieldProps = Omit<AsyncSelectFieldProps, 'multi'>;

function AsyncSingleSelectField({
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
  source,
  initialOptions,
  debounceMs,
  emptyMessage,
}: FieldProps) {
  const { gated, dependsOnList, parentValues } = useCascade({
    name,
    dependsOn,
  });

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
        <AsyncCombobox
          id={control.id}
          ref={control.ref}
          onBlur={control.onBlur}
          aria-labelledby={control.labelId}
          aria-invalid={control.invalid}
          aria-required={control.required || undefined}
          aria-describedby={control.describedBy}
          value={control.value}
          onChange={control.onChange}
          source={source}
          parentValues={parentValues}
          initialOptions={initialOptions}
          placeholder={gated ? gatedText(dependsOnList) : placeholder}
          disabled={disabled || gated}
          debounceMs={debounceMs}
          emptyMessage={emptyMessage}
        />
      )}
    </FieldShell>
  );
}

function AsyncMultiSelectField({
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
  ...sourceProps
}: FieldProps) {
  const { gated, dependsOnList, parentValues } = useCascade({
    name,
    dependsOn,
    emptyValue: [],
  });

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
      {(control) => (
        <AsyncMultiCombobox
          id={control.id}
          ref={control.ref}
          onBlur={control.onBlur}
          aria-labelledby={control.labelId}
          aria-invalid={control.invalid}
          aria-required={control.required || undefined}
          aria-describedby={control.describedBy}
          value={control.value}
          onChange={control.onChange}
          parentValues={parentValues}
          placeholder={gated ? gatedText(dependsOnList) : placeholder}
          disabled={disabled || gated}
          {...sourceProps}
        />
      )}
    </FieldShell>
  );
}

type AsyncMultiComboboxProps = SourceProps & {
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  parentValues: Record<string, unknown>;
  placeholder: string;
  disabled: boolean | undefined;
} & Pick<
    ComponentProps<'input'>,
    | 'id'
    | 'ref'
    | 'onBlur'
    | 'aria-labelledby'
    | 'aria-invalid'
    | 'aria-required'
    | 'aria-describedby'
  >;

// Its own component so the options hook can read the field value that only
// FieldShell's render prop hands out.
function AsyncMultiCombobox({
  value,
  onChange,
  parentValues,
  placeholder,
  disabled,
  source,
  initialOptions,
  debounceMs,
  emptyMessage = 'No results.',
  ...inputProps
}: AsyncMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const anchor = useComboboxAnchor();
  const selected = value ?? [];
  const state = useAsyncOptions({
    source,
    enabled: open && !disabled,
    parentValues,
    selected,
    initialOptions,
    debounceMs,
  });

  return (
    <Combobox
      multiple
      items={state.options.map((option) => option.value)}
      itemToStringLabel={state.getLabel}
      filter={null}
      value={selected}
      onValueChange={(next: string[]) => onChange(next)}
      open={open}
      onOpenChange={setOpen}
      inputValue={state.search}
      onInputValueChange={state.setSearch}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className="w-full">
        {selected.map((item) => (
          <ComboboxChip key={item}>{state.getLabel(item)}</ComboboxChip>
        ))}
        <ComboboxChipsInput
          {...inputProps}
          placeholder={selected.length ? undefined : placeholder}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <AsyncOptionsList
          state={state}
          labelFor={state.getLabel}
          emptyMessage={emptyMessage}
        />
      </ComboboxContent>
    </Combobox>
  );
}
