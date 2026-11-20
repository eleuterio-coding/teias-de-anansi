export type FormError = {
  fieldId: string;
  label: string;
  message: string;
};

export type FormErrorSummaryProps = {
  errors: readonly FormError[];
  title?: string;
};

export function FormErrorSummary({
  errors,
  title = 'Revise os campos indicados',
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div role="alert" className="ds-form-error-summary">
      <strong>{title}</strong>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <button
              type="button"
              className="ds-form-error-target"
              onClick={() => document.getElementById(error.fieldId)?.focus()}
            >
              {error.label}: {error.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
