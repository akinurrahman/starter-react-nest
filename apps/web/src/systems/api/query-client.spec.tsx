import { useMutation, useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { apiCall } from '@/lib/api/api-call';
import { conflict, notFound, validationFailed } from '@/test/error-fixtures';
import { server } from '@/test/msw-server';
import { renderWithQuery } from '@/test/render-with-query';
import { Form, FormError, InputField } from '@/systems/form';

function countRequests(status: number, body: object) {
  const count = { value: 0 };
  server.use(
    http.all('/api/thing', () => {
      count.value += 1;
      return HttpResponse.json(body, { status });
    }),
  );
  return count;
}

const unavailable = {
  statusCode: 503,
  code: 'SERVICE_UNAVAILABLE',
  message: 'Service unavailable',
};

function Thing() {
  const query = useQuery({
    queryKey: ['thing'],
    queryFn: ({ signal }) => apiCall<string>('/thing', { signal }),
  });
  if (query.isError) return <p>failed</p>;
  return <p>{query.isSuccess ? 'loaded' : 'loading'}</p>;
}

function SaveButton({ onError }: { onError?: () => void }) {
  const mutation = useMutation({
    mutationFn: () => apiCall<void>('/thing', { method: 'POST' }),
    onError,
  });
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      Save
    </button>
  );
}

function CaughtSaveButton({ onCaught }: { onCaught: () => void }) {
  const mutation = useMutation({
    mutationFn: () => apiCall<void>('/thing', { method: 'POST' }),
  });
  return (
    <button
      type="button"
      onClick={() => void mutation.mutateAsync().catch(onCaught)}
    >
      Save
    </button>
  );
}

const userSchema = z.object({ email: z.string(), name: z.string() });

function SaveForm() {
  const mutation = useMutation({
    mutationFn: (values: z.output<typeof userSchema>) =>
      apiCall<void>('/thing', { method: 'POST', body: values }),
  });
  return (
    <Form
      schema={userSchema}
      onSubmit={(values) => mutation.mutateAsync(values)}
    >
      <InputField name="email" label="Email" />
      <InputField name="name" label="Name" />
      <FormError />
      <button type="submit">Save</button>
    </Form>
  );
}

const toasts = () => document.querySelectorAll('[data-sonner-toast]');

// Past the global toast's one macrotask deferral, with room for sonner to
// render, so an absent toast is absent and not just late.
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('query retries', () => {
  it('does not retry a 4xx', async () => {
    const count = countRequests(404, notFound);
    renderWithQuery(<Thing />);

    expect(await screen.findByText('failed')).toBeInTheDocument();
    await settle();
    expect(count.value).toBe(1);
  });

  it('retries a 503 twice', async () => {
    const count = countRequests(503, unavailable);
    renderWithQuery(<Thing />);

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(count.value).toBe(3);
  });
});

describe('mutation error toast', () => {
  it('toasts once', async () => {
    const count = countRequests(409, conflict);
    renderWithQuery(<SaveButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(conflict.message)).toBeInTheDocument();
    await settle();
    expect(toasts()).toHaveLength(1);
    expect(count.value).toBe(1);
  });

  it('skips a mutation with its own onError', async () => {
    countRequests(409, conflict);
    const onError = vi.fn();
    renderWithQuery(<SaveButton onError={onError} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    await settle();
    expect(toasts()).toHaveLength(0);
  });

  it('toasts a rejection a caller catches outside any form', async () => {
    countRequests(409, conflict);
    const onCaught = vi.fn();
    renderWithQuery(<CaughtSaveButton onCaught={onCaught} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onCaught).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(conflict.message)).toBeInTheDocument();
    expect(toasts()).toHaveLength(1);
  });

  it('skips an error a form shows on its fields', async () => {
    countRequests(400, validationFailed);
    renderWithQuery(<SaveForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Invalid email address'),
    ).toBeInTheDocument();
    await settle();
    expect(toasts()).toHaveLength(0);
  });

  it('skips an error a form shows as its root message', async () => {
    countRequests(409, conflict);
    renderWithQuery(<SaveForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      conflict.message,
    );
    await settle();
    expect(toasts()).toHaveLength(0);
  });
});
