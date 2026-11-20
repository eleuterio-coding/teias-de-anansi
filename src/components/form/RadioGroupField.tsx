import { useId } from 'react';
import { FieldHelpText } from './field';

export type RadioOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type RadioGroupFieldProps = {
  legend: string;
  name: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function RadioGroupField({
  legend,
  name,
  options,
  value,
  onChange,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  className = '',
}: RadioGroupFieldProps) {
  const generated = useId();
  const groupId = id ?? generated;
  const hintId = hint ? groupId + '-hint' : undefined;
  const errorId = error ? groupId + '-error' : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className={['ds-form-fieldset', 'ds-form-choice-group', className].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-describedby={describedBy}
    >
      <legend className="ds-form-label">
        {legend}
        {required && <span className="ds-form-required"> (obrigatório)</span>}
      </legend>
      <div className="ds-form-choice-options">
        {options.map((option, index) => (
          <div className="ds-form-choice" key={option.value}>
            <input
              id={groupId + '-option-' + index}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              required={required}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={describedBy}
              onChange={() => onChange(option.value)}
              className="ds-form-native-choice"
            />
            <label htmlFor={groupId + '-option-' + index} className="ds-form-choice-label">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      <FieldHelpText hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </fieldset>
  );
}
