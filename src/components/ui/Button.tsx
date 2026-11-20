import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={['ds-button', 'ds-button--' + variant, 'ds-button--' + size, className]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <span className="ds-button-spinner" aria-hidden="true" />}
      <span>{children}</span>
      {loading && <span className="ds-sr-only">Carregando</span>}
    </button>
  );
}
