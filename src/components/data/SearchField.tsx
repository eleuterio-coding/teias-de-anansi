import { useId } from 'react';
import { Button } from '../ui';

export type SearchFieldProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function SearchField({
  label,
  value,
  onChange,
  placeholder = 'Buscar…',
  disabled = false,
  id,
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="ds-data-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="ds-search-control">
        <input
          id={inputId}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={disabled}
        />
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="Limpar busca"
            onClick={() => onChange('')}
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
