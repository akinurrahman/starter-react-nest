import { Input } from '@/components/ui/input';
import { useCascade } from '../hooks/use-cascade';
import type { BaseFieldProps } from '../types';
import { FieldShell } from './field-shell';

export type TimeFieldProps = Omit<BaseFieldProps, 'placeholder'>;

// Wall-clock time as HH:mm. The native control brings each platform's own
// picker and its 12h or 24h preference, which no custom dropdown matches.
export function TimeField({
  name,
  label,
  hideLabel,
  description,
  required,
  disabled,
  className,
  dependsOn,
  alwaysVisible,
}: TimeFieldProps) {
  const { gated } = useCascade({ name, dependsOn });

  return (
    <FieldShell<string>
      name={name}
      label={label}
      hideLabel={hideLabel}
      description={description}
      required={required}
      className={className}
      hidden={gated && !alwaysVisible}
    >
      {(control) => (
        <Input
          id={control.id}
          ref={control.ref}
          name={control.name}
          type="time"
          value={control.value ?? ''}
          onChange={(event) => control.onChange(event.target.value)}
          onBlur={control.onBlur}
          disabled={disabled || gated}
          aria-invalid={control.invalid}
          aria-required={control.required || undefined}
          aria-describedby={control.describedBy}
          className="tabular-nums"
        />
      )}
    </FieldShell>
  );
}
