import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 40px on touch, where a 32px target gets mis-tapped, 32px from sm up.
export const ROW_ICON_BUTTON = 'size-10 sm:size-8';

type RowActionsProps = {
  // Names the row, so a screen reader hears "Edit Design team" rather than a
  // column of identical "Edit" buttons.
  subject: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
};

export function RowActions({
  subject,
  onEdit,
  onDelete,
  disabled,
  className,
}: RowActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-1', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Edit ${subject}`}
        disabled={disabled}
        onClick={onEdit}
        className={ROW_ICON_BUTTON}
      >
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Delete ${subject}`}
        disabled={disabled}
        onClick={onDelete}
        className={cn(
          ROW_ICON_BUTTON,
          'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        )}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
