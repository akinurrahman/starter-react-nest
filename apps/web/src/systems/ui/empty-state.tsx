import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
