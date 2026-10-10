import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PanelSectionProps = {
  title: string;
  description?: ReactNode;
  // Section-level control, right of the title.
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function PanelSection({
  title,
  description,
  action,
  className,
  children,
}: PanelSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-6 text-card-foreground',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
