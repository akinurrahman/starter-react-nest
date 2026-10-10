import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage, isApiError } from '@/lib/api/api-error';
import { isErrorHandled } from './handled-errors';

const MAX_RETRIES = 2;

function isClientError(error: unknown): boolean {
  return isApiError(error) && error.status >= 400 && error.status < 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.onError) return;
        // This runs before mutateAsync rejects, so a Form awaiting the
        // mutation has not caught and shown the error yet. Its catch runs in
        // the same microtask chain, so one macrotask later it has.
        setTimeout(() => {
          if (!isErrorHandled(error)) toast.error(getErrorMessage(error));
        }, 0);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}
