import type { ReactNode } from 'react';
import { create } from 'zustand';

export type ConfirmVariant = 'default' | 'destructive' | 'warning';

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  // Shown on the confirm button while onConfirm runs, e.g. "Archiving".
  pendingText?: string;
  onConfirm: () => void | Promise<void>;
};

type ConfirmationState = {
  open: boolean;
  // Kept after close so the dialog keeps its content while it animates out.
  options: ConfirmOptions | null;
  isPending: boolean;
};

export const useConfirmationStore = create<ConfirmationState>()(() => ({
  open: false,
  options: null,
  isPending: false,
}));

const { getState, setState } = useConfirmationStore;

export function confirm(options: ConfirmOptions): void {
  if (getState().isPending) return;
  setState({ open: true, options, isPending: false });
}

export function cancelConfirmation(): void {
  if (getState().isPending) return;
  setState({ open: false });
}

export async function runConfirmation(): Promise<void> {
  const { options, isPending } = getState();
  if (!options || isPending) return;

  setState({ isPending: true });
  try {
    await options.onConfirm();
  } catch {
    // The mutation's error toast reports it. Staying open lets the user
    // retry or cancel, and swallowing it keeps the rejection handled.
    setState({ isPending: false });
    return;
  }
  setState({ open: false, isPending: false });
}
