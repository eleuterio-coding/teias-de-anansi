import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  variant?: 'default' | 'ornate';
  children: ReactNode;
};

export function Card({
  title,
  description,
  actions,
  variant = 'default',
  children,
  className = '',
  ...rest
}: CardProps) {
  return (
    <article
      {...rest}
      className={['ds-card', 'ds-card--' + variant, className].filter(Boolean).join(' ')}
    >
      {(title || description || actions) && (
        <header className="ds-card-header">
          <div>
            {title && <h3 className="ds-card-title">{title}</h3>}
            {description && <p className="ds-card-description">{description}</p>}
          </div>
          {actions && <div className="ds-card-actions">{actions}</div>}
        </header>
      )}
      <div className="ds-card-content">{children}</div>
    </article>
  );
}
