import type { SelectHTMLAttributes } from 'react';
import { FieldHelpText, FieldLabel, useFieldIds } from './field';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'multiple' | 'size'
> & {
  label: string;
  hint?: string;
  error?: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

export function SelectField({
  label,
  hint,
  error,
  id,
  options,
  placeholder,
  required,
  className = '',
  ...rest
}: SelectFieldProps) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(
    id,
    hint,
    error,
    rest['aria-describedby'],
  );

  return (
    <div className={['ds-form-field', className].filter(Boolean).join(' ')}>
      <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>
      <select
        {...rest}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className="ds-form-control"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldHelpText hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
