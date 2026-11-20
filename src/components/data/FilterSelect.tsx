import { useId } from 'react';

export type FilterOption = { value: string; label: string };

export type FilterSelectProps = {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  id,
}: FilterSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="ds-data-field">
      <label htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
