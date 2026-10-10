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
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { Option } from '@/systems/form';
import type { UrlFilterValue } from '../hooks/use-url-filters';
import type { PopoverFieldShape } from '../lib/popover-fields';
import { FilterAsyncSelect } from './filter-async-select';
import { FilterSelect } from './filter-select';

type PopoverFieldControlProps = {
  field: PopoverFieldShape;
  value: UrlFilterValue;
  onChange: (value: UrlFilterValue) => void;
  // The control's id, which the field's label points at.
  id: string;
  labelId: string;
  placeholder?: string;
  disabled: boolean;
  parentValues?: Record<string, unknown>;
};

const asString = (value: UrlFilterValue) =>
  typeof value === 'string' ? value : undefined;

export function PopoverFieldControl({
  field,
  value,
  onChange,
  id,
  labelId,
  placeholder,
  disabled,
  parentValues,
}: PopoverFieldControlProps) {
  switch (field.type) {
    case 'select':
      return (
        <FilterSelect
          id={id}
          label={field.label}
          value={asString(value)}
          onChange={onChange}
          options={field.options}
          placeholder={placeholder ?? 'All'}
          disabled={disabled}
          className="sm:w-full"
        />
      );

    case 'asyncSelect':
      return (
        <FilterAsyncSelect
          id={id}
          label={field.label}
          value={asString(value)}
          onChange={onChange}
          source={field.source}
          initialOptions={field.initialOptions}
          parentValues={parentValues}
          placeholder={placeholder ?? 'All'}
          disabled={disabled}
          className="sm:w-full"
        />
      );

    case 'multiSelect':
      return (
        <MultiSelectControl
          id={id}
          labelId={labelId}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          options={field.options}
          placeholder={placeholder ?? 'Any'}
          disabled={disabled}
        />
      );

    case 'date':
      return (
        <DatePicker
          id={id}
          aria-label={field.label}
          value={asString(value)}
          onValueChange={onChange}
          min={field.min}
          max={field.max}
          placeholder={placeholder}
          disabled={disabled}
        />
      );

    case 'switch':
      return (
        <Switch
          id={id}
          aria-labelledby={labelId}
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(checked ? 'true' : undefined)}
          disabled={disabled}
        />
      );

    case 'radio':
      return (
        <RadioGroup
          aria-labelledby={labelId}
          value={asString(value) ?? ''}
          onValueChange={(next) => onChange(String(next))}
          disabled={disabled}
          className="gap-0"
        >
          {field.options.map((option) => (
            <label
              key={option.value}
              className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm sm:min-h-9"
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      );
  }
}

type MultiSelectControlProps = {
  id: string;
  labelId: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly Option[];
  placeholder: string;
  disabled: boolean;
};

function MultiSelectControl({
  id,
  labelId,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: MultiSelectControlProps) {
  const anchor = useComboboxAnchor();
  // A value the options no longer list still shows by its raw value, so it
  // can be seen and removed.
  const selected = value.map(
    (entry) =>
      options.find((option) => option.value === entry) ?? {
        value: entry,
        label: entry,
      },
  );

  return (
    <Combobox
      multiple
      items={[...options]}
      value={selected}
      onValueChange={(next: Option[]) =>
        onChange(next.map((option) => option.value))
      }
      isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(chips: Option[]) =>
            chips.map((option) => (
              <ComboboxChip key={option.value}>{option.label}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          aria-labelledby={labelId}
          placeholder={selected.length ? undefined : placeholder}
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
}
