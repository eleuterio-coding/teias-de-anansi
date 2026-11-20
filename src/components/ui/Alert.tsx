import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from './Button';
import type { BadgeTone } from './Badge';

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: Exclude<BadgeTone, 'gold'>;
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
};

export function Alert({
  title,
  children,
  tone = 'info',
  onDismiss,
  className = '',
  ...rest
}: AlertProps) {
  const headingId = useId();

  return (
    <div
      {...rest}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      aria-labelledby={headingId}
      className={['ds-alert', 'ds-alert--' + tone, className].filter(Boolean).join(' ')}
    >
      <div className="ds-alert-body">
        <strong id={headingId} className="ds-alert-heading">
          {title}
        </strong>
        <div className="ds-alert-message">{children}</div>
      </div>
      {onDismiss && (
        <Button variant="ghost" size="sm" aria-label="Dispensar aviso" onClick={onDismiss}>
          Fechar
        </Button>
      )}
    </div>
  );
}
