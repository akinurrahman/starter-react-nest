import { createContext, useContext, useEffect } from 'react';

// react-hook-form's own registry also holds fields a cascade has hidden, and a
// reset empties it, so the fields actually on screen are tracked here.
export type FieldRegistry = Set<string>;

export const FieldRegistryContext = createContext<FieldRegistry | null>(null);

export function useRegisterField(name: string, active: boolean): void {
  const registry = useContext(FieldRegistryContext);

  useEffect(() => {
    if (!registry || !active) return;
    registry.add(name);
    return () => {
      registry.delete(name);
    };
  }, [registry, name, active]);
}
