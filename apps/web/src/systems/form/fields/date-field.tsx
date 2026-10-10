import { DatePicker } from '@/components/ui/date-picker';
import { useCascade } from '../hooks/use-cascade';
import { gatedText } from '../lib/cascade';
import type { BaseFieldProps } from '../types';
import { FieldShell } from './field-shell';

export type DateFieldProps = BaseFieldProps & {
  // yyyy-MM-dd bounds. Days outside them cannot be picked at all.
  min?: string;
  max?: string;
};

// A calendar day as yyyy-MM-dd, the shape every date-only API field takes.
// Never an instant, never an offset.
export function DateField({
  name,
  label,
  hideLabel,
  description,
  placeholder,
  required,
  disabled,
  className,
  dependsOn,
  alwaysVisible,
  min,
  max,
}: DateFieldProps) {
  const { gated, dependsOnList } = useCascade({ name, dependsOn });

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
        <DatePicker
          id={control.id}
          ref={control.ref}
          value={control.value || undefined}
          onValueChange={(next) => {
            control.onChange(next ?? '');
            control.onBlur();
          }}
          min={min}
          max={max}
          placeholder={gated ? gatedText(dependsOnList) : placeholder}
          disabled={disabled || gated}
          aria-invalid={control.invalid}
          aria-describedby={control.describedBy}
        />
      )}
    </FieldShell>
  );
}
