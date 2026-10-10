import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterBarProps = {
  // True only while something is off its default, so a pristine screen never
  // offers to clear filters nobody applied.
  isFiltered?: boolean;
  // Left out when a FilterPopover in the row already owns clearing.
  onReset?: () => void;
  // Page actions such as the create button, kept in this row so the page
  // header stays copy only.
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

// Controls stack full width on a phone and settle into a row from sm up.
export function FilterBar({
  isFiltered,
  onReset,
  actions,
  className,
  children,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center',
        className,
      )}
    >
      {children}

      {isFiltered && onReset ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          className="h-10 self-start sm:h-9"
        >
          <XIcon aria-hidden />
          Clear filters
        </Button>
      ) : null}

      {actions ? (
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
