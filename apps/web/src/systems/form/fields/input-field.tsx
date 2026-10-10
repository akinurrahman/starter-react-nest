import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCascade } from '../hooks/use-cascade';
import { gatedText } from '../lib/cascade';
import type { BaseFieldProps } from '../types';
import { FieldShell } from './field-shell';

type InputType = 'text' | 'email' | 'url' | 'tel' | 'password' | 'number';

export type InputFieldProps = BaseFieldProps & {
  type?: InputType;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  autoComplete?: string;
};

export function InputField({
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
  type = 'text',
  min,
  max,
  step,
  maxLength,
  autoComplete,
}: InputFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const isNumber = type === 'number';

  const { gated, dependsOnList } = useCascade({
    name,
    dependsOn,
    emptyValue: isNumber ? undefined : '',
  });

  return (
    <FieldShell<string | number>
      name={name}
      label={label}
      hideLabel={hideLabel}
      description={description}
      required={required}
      className={className}
      hidden={gated && !alwaysVisible}
    >
      {(control) => (
        <div className="relative">
          <Input
            id={control.id}
            ref={control.ref}
            name={control.name}
            type={isPassword && revealed ? 'text' : type}
            // Empty number input is undefined, so `required` fires instead of
            // Zod seeing a 0 nobody typed.
            value={control.value ?? ''}
            onChange={(event) => {
              const next = event.target.value;
              control.onChange(
                isNumber ? (next === '' ? undefined : Number(next)) : next,
              );
            }}
            onBlur={control.onBlur}
            placeholder={gated ? gatedText(dependsOnList) : placeholder}
            disabled={disabled || gated}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            autoComplete={autoComplete}
            aria-invalid={control.invalid}
            aria-required={control.required || undefined}
            aria-describedby={control.describedBy}
            className={cn(
              // The browser's own reveal button would sit under this toggle.
              isPassword &&
                'pr-10 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden',
            )}
          />

          {isPassword ? (
            <button
              type="button"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              aria-pressed={revealed}
              disabled={disabled || gated}
              onClick={() => setRevealed((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
            >
              {revealed ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}
