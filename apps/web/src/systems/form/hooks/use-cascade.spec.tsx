import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { z } from 'zod';
import { InputField } from '../fields/input-field';
import { Form } from '../form';

const schema = z.object({ country: z.string(), city: z.string() });

function renderCascade({
  strict = false,
  onSubmit = vi.fn(),
}: {
  strict?: boolean;
  onSubmit?: (values: z.output<typeof schema>) => void;
} = {}) {
  const tree = (
    <Form
      schema={schema}
      defaultValues={{ country: 'IN', city: 'Pune' }}
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <InputField name="country" label="Country" />
          <InputField name="city" label="City" dependsOn="country" />
          <button
            type="button"
            onClick={() => form.reset({ country: 'US', city: 'Austin' })}
          >
            Load record
          </button>
          <button type="submit">Save</button>
        </>
      )}
    </Form>
  );
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return userEvent.setup();
}

const city = () => screen.getByRole('textbox', { name: 'City' });

describe('useCascade', () => {
  it('clears the child when the parent changes', async () => {
    const user = renderCascade();

    await user.type(screen.getByRole('textbox', { name: 'Country' }), 'D');

    expect(city()).toHaveValue('');
  });

  it('hides the child while the parent is empty', async () => {
    const user = renderCascade();

    await user.clear(screen.getByRole('textbox', { name: 'Country' }));

    expect(screen.queryByRole('textbox', { name: 'City' })).toBeNull();
  });

  it('keeps edit defaults through a StrictMode mount', async () => {
    const onSubmit = vi.fn();
    const user = renderCascade({ strict: true, onSubmit });

    expect(city()).toHaveValue('Pune');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({ country: 'IN', city: 'Pune' });
  });

  it('clears every level below a changed parent', async () => {
    const chain = z.object({
      country: z.string(),
      state: z.string(),
      city: z.string(),
    });
    const onSubmit = vi.fn();
    render(
      <Form
        schema={chain}
        defaultValues={{ country: 'IN', state: 'MH', city: 'Pune' }}
        onSubmit={onSubmit}
      >
        <InputField name="country" label="Country" />
        <InputField
          name="state"
          label="State"
          dependsOn="country"
          alwaysVisible
        />
        <InputField name="city" label="City" dependsOn="state" alwaysVisible />
        <button type="submit">Save</button>
      </Form>,
    );
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox', { name: 'Country' }), 'D');

    expect(screen.getByRole('textbox', { name: 'State' })).toHaveValue('');
    expect(city()).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      country: 'IND',
      state: '',
      city: '',
    });
  });

  it('keeps the new child value after reset(newValues)', async () => {
    const user = renderCascade({ strict: true });

    await user.click(screen.getByRole('button', { name: 'Load record' }));

    expect(screen.getByRole('textbox', { name: 'Country' })).toHaveValue('US');
    expect(city()).toHaveValue('Austin');
  });
});
