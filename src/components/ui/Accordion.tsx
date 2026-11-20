import type { DetailsHTMLAttributes, ReactNode } from 'react';

export type AccordionProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> & {
  title: string;
  children: ReactNode;
};

export function Accordion({ title, children, className = '', ...rest }: AccordionProps) {
  return (
    <details {...rest} className={['ds-accordion', className].filter(Boolean).join(' ')}>
      <summary className="ds-accordion-summary">
        <span>{title}</span>
        <span className="ds-accordion-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="ds-accordion-content">{children}</div>
    </details>
  );
}
