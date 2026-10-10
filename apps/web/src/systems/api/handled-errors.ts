const handled = new WeakSet<object>();

// Set by whatever shows an error to the person, so the global mutation toast
// does not repeat a message that is already on screen.
export function markErrorHandled(error: unknown): void {
  if (typeof error === 'object' && error !== null) handled.add(error);
}

export function isErrorHandled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && handled.has(error);
}
