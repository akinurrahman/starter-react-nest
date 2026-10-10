// A test harness is never hot reloaded, so its local components are fine here.
/* oxlint-disable react/only-export-components */
import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  render,
  renderHook,
  type RenderHookOptions,
} from '@testing-library/react';
import { createContext, use, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type To } from 'react-router';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { createTestQueryClient } from './render-with-query';

type RouterOptions = {
  url?: string;
  // Wraps in a fresh query client and a Toaster, for controls that fetch.
  withQuery?: boolean;
};

// The route element is created once, so it reads the tree to render from
// here. That lets rerender and renderHook swap what sits inside the route.
const SlotContext = createContext<ReactNode>(null);

function Slot() {
  return use(SlotContext);
}

// A data router, the kind the app runs on, at a starting URL.
function createTestRouter({ url = '/', withQuery = false }: RouterOptions) {
  const router = createMemoryRouter([{ path: '*', element: <Slot /> }], {
    initialEntries: [url],
  });
  const client = withQuery ? createTestQueryClient() : undefined;
  if (withQuery) toast.dismiss();

  // Each committed location is a new key, even on a replace to the same URL.
  let navigations = 0;
  let lastKey = router.state.location.key;
  router.subscribe((state) => {
    if (state.location.key === lastKey) return;
    lastKey = state.location.key;
    navigations += 1;
  });

  function Wrapper({ children }: { children: ReactNode }) {
    const routed = (
      <SlotContext value={children}>
        <RouterProvider router={router} />
      </SlotContext>
    );
    return client ? (
      <QueryClientProvider client={client}>
        {routed}
        <Toaster />
      </QueryClientProvider>
    ) : (
      routed
    );
  }

  return {
    Wrapper,
    router,
    client,
    searchParams: () => new URLSearchParams(router.state.location.search),
    navigations: () => navigations,
    // A change from outside the component under test, like back or a link.
    navigate: (to: To | number) =>
      act(async () => {
        await (typeof to === 'number'
          ? router.navigate(to)
          : router.navigate(to));
      }),
  };
}

export function renderWithRouter(ui: ReactNode, options: RouterOptions = {}) {
  const { Wrapper, ...harness } = createTestRouter(options);
  return { ...render(ui, { wrapper: Wrapper }), ...harness };
}

export function renderHookWithRouter<Result>(
  hook: () => Result,
  options: RouterOptions & Omit<RenderHookOptions<unknown>, 'wrapper'> = {},
) {
  const { url, withQuery, ...hookOptions } = options;
  const { Wrapper, ...harness } = createTestRouter({ url, withQuery });
  return {
    ...renderHook(hook, { ...hookOptions, wrapper: Wrapper }),
    ...harness,
  };
}
