import { useId, type ReactNode } from 'react';

export type FieldHelp = {
  hint?: string;
  error?: string;
};

export function useFieldIds(
  id: string | undefined,
  hint: string | undefined,
  error: string | undefined,
  extra: string | undefined,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? inputId + '-hint' : undefined;
  const errorId = error ? inputId + '-error' : undefined;
  return {
    inputId,
    hintId,
    errorId,
    describedBy: [extra, hintId, errorId].filter(Boolean).join(' ') || undefined,
  };
}

export function FieldHelpText({
  hint,
  error,
  hintId,
  errorId,
}: FieldHelp & { hintId?: string; errorId?: string }) {
  return (
    <>
      {hint && (
        <p id={hintId} className="ds-form-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ds-form-error">
          {error}
        </p>
      )}
    </>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="ds-form-label" htmlFor={htmlFor}>
      {children}
      {required && <span className="ds-form-required"> (obrigatório)</span>}
    </label>
  );
}
