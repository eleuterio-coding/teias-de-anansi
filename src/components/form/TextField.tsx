import type { InputHTMLAttributes } from 'react';
import { FieldHelpText, FieldLabel, useFieldIds } from './field';

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'size' | 'type'
> & {
  label: string;
  hint?: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search';
};

export function TextField({
  label,
  hint,
  error,
  id,
  type = 'text',
  required,
  className = '',
  ...rest
}: TextFieldProps) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(
    id,
    hint,
    error,
    rest['aria-describedby'],
  );

  return (
    <div className={['ds-form-field', className].filter(Boolean).join(' ')}>
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <input
        {...rest}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className="ds-form-control"
      />
      <FieldHelpText hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
