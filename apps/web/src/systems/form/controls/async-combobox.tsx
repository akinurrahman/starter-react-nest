import { useState, type ComponentProps, type UIEvent } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxButtonTrigger,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxStatus,
  ComboboxTriggerText,
} from '@/components/ui/combobox';
import { useAsyncOptions } from '../hooks/use-async-options';
import type { AsyncOptionsSource, Option } from '../types';

const LOAD_ERROR = "Couldn't load options";
const NEAR_BOTTOM_PX = 24;

type AsyncOptionsListProps = {
  state: ReturnType<typeof useAsyncOptions>;
  labelFor: (value: string) => string;
  emptyMessage: string;
};

// The popup body both async pickers share: items, paging on scroll, and the
// loading, empty and failed states.
export function AsyncOptionsList({
  state,
  labelFor,
  emptyMessage,
}: AsyncOptionsListProps) {
  const { isLoading, isError, loadMore, refetch } = state;

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const list = event.currentTarget;
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (remaining < NEAR_BOTTOM_PX) loadMore();
  };

  return (
    <>
      {/* A failed request is not an empty result. */}
      <ComboboxEmpty className="empty:py-0">
        {isLoading || isError ? null : emptyMessage}
      </ComboboxEmpty>
      <ComboboxList onScroll={handleScroll}>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {labelFor(item)}
          </ComboboxItem>
        )}
      </ComboboxList>
      {isError ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2 text-sm text-destructive">
          {LOAD_ERROR}
          <Button type="button" variant="outline" size="xs" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : null}
      <ComboboxStatus>
        {isLoading ? (
          <>
            <Loader2Icon aria-hidden className="size-4 animate-spin" />
            <span className="sr-only">Loading options</span>
          </>
        ) : null}
      </ComboboxStatus>
    </>
  );
}

export type AsyncComboboxProps = {
  value?: string;
  // '' when cleared, which suits both a form field and a filter.
  onChange: (value: string) => void;
  source: AsyncOptionsSource;
  placeholder?: string;
  // Pinned above the fetched options and never searched, like a filter's
  // "All" entry.
  leadingOptions?: readonly Option[];
  initialOptions?: readonly Option[];
  parentValues?: Record<string, unknown>;
  disabled?: boolean;
  debounceMs?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
} & Pick<
  ComponentProps<'button'>,
  | 'id'
  | 'ref'
  | 'onBlur'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-invalid'
  | 'aria-required'
  | 'aria-describedby'
>;

// A server-searched, paged single select controlled by plain props, so a form
// field and a URL filter can both sit on it.
export function AsyncCombobox({
  value,
  onChange,
  source,
  placeholder = 'Select...',
  leadingOptions,
  initialOptions,
  parentValues,
  disabled,
  debounceMs,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results.',
  className,
  ...triggerProps
}: AsyncComboboxProps) {
  const [open, setOpen] = useState(false);
  const state = useAsyncOptions({
    source,
    enabled: open && !disabled,
    parentValues,
    selected: value ? [value] : [],
    initialOptions,
    debounceMs,
  });

  const leading = leadingOptions ?? [];
  const items = [
    ...leading.map((option) => option.value),
    ...state.options
      .filter((option) => !leading.some((lead) => lead.value === option.value))
      .map((option) => option.value),
  ];
  const labelFor = (item: string) =>
    leading.find((option) => option.value === item)?.label ??
    state.getLabel(item);

  return (
    <Combobox
      items={items}
      itemToStringLabel={labelFor}
      // The server already searched, so filtering again here would hide
      // results it returned on purpose.
      filter={null}
      value={value || null}
      onValueChange={(next) => onChange(next ?? '')}
      open={open}
      onOpenChange={setOpen}
      inputValue={state.search}
      onInputValueChange={state.setSearch}
      disabled={disabled}
    >
      <ComboboxButtonTrigger className={className} {...triggerProps}>
        <ComboboxTriggerText placeholder={!value}>
          {value ? labelFor(value) : placeholder}
        </ComboboxTriggerText>
      </ComboboxButtonTrigger>
      <ComboboxContent>
        <ComboboxSearch placeholder={searchPlaceholder} />
        <AsyncOptionsList
          state={state}
          labelFor={labelFor}
          emptyMessage={emptyMessage}
        />
      </ComboboxContent>
    </Combobox>
  );
}
