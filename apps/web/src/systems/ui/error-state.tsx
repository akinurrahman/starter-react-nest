import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/api-error';
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Couldn't load this data",
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-5 text-destructive" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {getErrorMessage(error)}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-2"
          onClick={onRetry}
        >
          <RotateCcw />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
