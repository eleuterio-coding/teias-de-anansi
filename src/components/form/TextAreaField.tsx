import type { TextareaHTMLAttributes } from 'react';
import { FieldHelpText, FieldLabel, useFieldIds } from './field';

export type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  id,
  required,
  rows = 4,
  className = '',
  ...rest
}: TextAreaFieldProps) {
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
      <textarea
        {...rest}
        id={inputId}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className="ds-form-control ds-form-textarea"
      />
      <FieldHelpText hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
