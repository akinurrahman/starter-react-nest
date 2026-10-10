import { MoreHorizontal } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ROW_ICON_BUTTON } from './row-actions';

export type RowAction = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
};

type RowActionsMenuProps = {
  // Names the row, so the trigger reads "Actions for Design team".
  subject: string;
  actions: RowAction[];
  className?: string;
};

export function RowActionsMenu({
  subject,
  actions,
  className,
}: RowActionsMenuProps) {
  return (
    <div className={cn('flex justify-end', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${subject}`}
          render={
            <Button variant="ghost" size="icon" className={ROW_ICON_BUTTON} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-auto min-w-44">
          {actions.map(({ label, icon: Icon, onSelect, variant, disabled }) => (
            <DropdownMenuItem
              key={label}
              variant={variant}
              disabled={disabled}
              onClick={onSelect}
              className="gap-2 px-2 py-2 sm:py-1.5"
            >
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
