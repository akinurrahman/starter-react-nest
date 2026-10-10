import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { getErrorMessage, isApiError } from '@/lib/api/api-error';

export const ROOT_ERROR = 'root.server';

/**
 * Puts a rejected submit back on the form. Field errors whose path names a
 * field on screen land on that field, and the first of them takes focus.
 * Anything the person cannot see next to a control, unknown paths included,
 * becomes one root message, so nothing is silently dropped.
 */
export function applyServerError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  fieldNames: ReadonlySet<string>,
): void {
  const fieldErrors = isApiError(error) ? error.fieldErrors : [];
  const onScreen = fieldErrors.filter(({ path }) => fieldNames.has(path));

  onScreen.forEach(({ path, message }, index) => {
    setError(
      path as Path<T>,
      { type: 'server', message },
      { shouldFocus: index === 0 },
    );
  });

  if (onScreen.length === 0 || onScreen.length < fieldErrors.length) {
    setError(ROOT_ERROR, { type: 'server', message: getErrorMessage(error) });
  }
}
