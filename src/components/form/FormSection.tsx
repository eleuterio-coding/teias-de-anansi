import { useId, type ReactNode } from 'react';

export type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  const id = useId();
  return (
    <section
      className={['ds-form-section', className].filter(Boolean).join(' ')}
      aria-labelledby={id}
    >
      <header className="ds-form-section-header">
        <h3 id={id}>{title}</h3>
        {description && <p>{description}</p>}
      </header>
      <div className="ds-form-grid">{children}</div>
    </section>
  );
}
