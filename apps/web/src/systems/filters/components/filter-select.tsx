import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Option } from '@/systems/form';
import { ALL_VALUE, FILTER_CONTROL } from '../lib/filter-control';

type FilterSelectProps = {
  value?: string;
  // undefined for the "All" entry, so the param leaves the URL.
  onChange: (value?: string) => void;
  options: readonly Option[];
  placeholder: string;
  // The accessible name. Defaults to the placeholder, since a filter bar has
  // no visible labels.
  label?: string;
  // "All categories" reads better than "All" when several sit side by side.
  allLabel?: string;
  // Off for a filter that always holds a value, where "All" would only be a
  // second way to pick the default.
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  allLabel = 'All',
  clearable = true,
  disabled,
  id,
  className,
}: FilterSelectProps) {
  const items = clearable
    ? [{ value: ALL_VALUE, label: allLabel }, ...options]
    : [...options];

  return (
    <Select
      value={value ?? (clearable ? ALL_VALUE : null)}
      onValueChange={(next) =>
        onChange(!next || next === ALL_VALUE ? undefined : next)
      }
      items={items}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={label ?? placeholder}
        className={cn(FILTER_CONTROL, className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
