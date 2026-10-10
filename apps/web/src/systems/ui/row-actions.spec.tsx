import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Archive, Copy } from 'lucide-react';
import { RowActions } from './row-actions';
import { RowActionsMenu, type RowAction } from './row-actions-menu';

describe('RowActions', () => {
  it('names each button after the subject and fires its handler', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <RowActions subject="Design team" onEdit={onEdit} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Design team' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Delete Design team' }),
    );
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('disables both buttons', () => {
    render(
      <RowActions
        subject="Design team"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        disabled
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Edit Design team' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Delete Design team' }),
    ).toBeDisabled();
  });
});

describe('RowActionsMenu', () => {
  function renderMenu(overrides: Partial<RowAction> = {}) {
    const duplicate = vi.fn();
    const archive = vi.fn();
    render(
      <RowActionsMenu
        subject="Design team"
        actions={[
          { label: 'Duplicate', icon: Copy, onSelect: duplicate },
          {
            label: 'Archive',
            icon: Archive,
            onSelect: archive,
            variant: 'destructive',
            ...overrides,
          },
        ]}
      />,
    );
    return { user: userEvent.setup(), duplicate, archive };
  }

  async function openMenu(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole('button', { name: 'Actions for Design team' }),
    );
    return screen.findByRole('menu');
  }

  it('names the trigger after the subject', () => {
    renderMenu();

    expect(
      screen.getByRole('button', { name: 'Actions for Design team' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['Duplicate', 'duplicate'],
    ['Archive', 'archive'],
  ] as const)('fires %s', async (label, handler) => {
    const handlers = renderMenu();
    await openMenu(handlers.user);

    await handlers.user.click(screen.getByRole('menuitem', { name: label }));

    expect(handlers[handler]).toHaveBeenCalledOnce();
    const other = handler === 'duplicate' ? 'archive' : 'duplicate';
    expect(handlers[other]).not.toHaveBeenCalled();
  });

  it('marks a destructive action', async () => {
    const { user } = renderMenu();
    await openMenu(user);

    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'data-variant',
      'destructive',
    );
  });

  it('does not fire a disabled action', async () => {
    const { user, archive } = renderMenu({ disabled: true });
    await openMenu(user);

    const item = screen.getByRole('menuitem', { name: 'Archive' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    await user.click(item);

    expect(archive).not.toHaveBeenCalled();
  });
});
