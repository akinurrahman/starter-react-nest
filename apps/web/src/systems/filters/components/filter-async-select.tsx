import { cn } from '@/lib/utils';
import {
  AsyncCombobox,
  type AsyncOptionsSource,
  type Option,
} from '@/systems/form';
import { ALL_VALUE, FILTER_CONTROL } from '../lib/filter-control';

type FilterAsyncSelectProps = {
  value?: string;
  // undefined for the "All" entry, so the param leaves the URL.
  onChange: (value?: string) => void;
  source: AsyncOptionsSource;
  placeholder: string;
  // The accessible name. Defaults to the placeholder.
  label?: string;
  allLabel?: string;
  // Names the value a shared link arrived with, before any fetch.
  initialOptions?: readonly Option[];
  parentValues?: Record<string, unknown>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  debounceMs?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
};

// FilterSelect for a list too long to ship to the browser, searched and paged
// on the server.
export function FilterAsyncSelect({
  value,
  onChange,
  source,
  placeholder,
  label,
  allLabel = 'All',
  initialOptions,
  parentValues,
  searchPlaceholder,
  emptyMessage,
  debounceMs,
  disabled,
  id,
  className,
}: FilterAsyncSelectProps) {
  return (
    <AsyncCombobox
      id={id}
      aria-label={label ?? placeholder}
      value={value ?? ALL_VALUE}
      onChange={(next) =>
        onChange(!next || next === ALL_VALUE ? undefined : next)
      }
      source={source}
      leadingOptions={[{ value: ALL_VALUE, label: allLabel }]}
      initialOptions={initialOptions}
      parentValues={parentValues}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      debounceMs={debounceMs}
      disabled={disabled}
      className={cn(FILTER_CONTROL, className)}
    />
  );
}
