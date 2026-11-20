import { useId, type FormEvent, type FormHTMLAttributes, type ReactNode } from 'react';

export type FormPanelProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'title' | 'action' | 'method' | 'onSubmit' | 'children'
> & {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function FormPanel({
  title,
  description,
  children,
  footer,
  onSubmit,
  noValidate = true,
  className = '',
  ...rest
}: FormPanelProps) {
  const headingId = useId();

  return (
    <form
      {...rest}
      noValidate={noValidate}
      aria-labelledby={headingId}
      className={['ds-form-panel', className].filter(Boolean).join(' ')}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
    >
      <header className="ds-form-panel-header">
        <h2 id={headingId}>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      <div className="ds-form-panel-body">{children}</div>
      {footer && <footer className="ds-form-panel-actions">{footer}</footer>}
    </form>
  );
}
