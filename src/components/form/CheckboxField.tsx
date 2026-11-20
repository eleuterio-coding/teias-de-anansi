import type { InputHTMLAttributes, ReactNode } from 'react';
import { FieldHelpText, useFieldIds } from './field';

export type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children'
> & {
  label: ReactNode;
  hint?: string;
  error?: string;
};

export function CheckboxField({
  label,
  hint,
  error,
  id,
  required,
  className = '',
  ...rest
}: CheckboxFieldProps) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(
    id,
    hint,
    error,
    rest['aria-describedby'],
  );

  return (
    <div className={['ds-form-choice-field', className].filter(Boolean).join(' ')}>
      <div className="ds-form-choice">
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className="ds-form-native-choice"
        />
        <label htmlFor={inputId} className="ds-form-choice-label">
          {label}
          {required && <span className="ds-form-required"> (obrigatório)</span>}
        </label>
      </div>
      <FieldHelpText hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
