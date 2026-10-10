import { Textarea } from '@/components/ui/textarea';
import { useCascade } from '../hooks/use-cascade';
import { gatedText } from '../lib/cascade';
import type { BaseFieldProps } from '../types';
import { FieldShell } from './field-shell';

export type TextareaFieldProps = BaseFieldProps & {
  rows?: number;
  maxLength?: number;
};

export function TextareaField({
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
  rows = 4,
  maxLength,
}: TextareaFieldProps) {
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
        <Textarea
          id={control.id}
          ref={control.ref}
          name={control.name}
          value={control.value ?? ''}
          onChange={(event) => control.onChange(event.target.value)}
          onBlur={control.onBlur}
          rows={rows}
          maxLength={maxLength}
          placeholder={gated ? gatedText(dependsOnList) : placeholder}
          disabled={disabled || gated}
          aria-invalid={control.invalid}
          aria-required={control.required || undefined}
          aria-describedby={control.describedBy}
        />
      )}
    </FieldShell>
  );
}
