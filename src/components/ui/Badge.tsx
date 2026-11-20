import type { HTMLAttributes } from 'react';

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={['ds-badge', 'ds-badge--' + tone, className].filter(Boolean).join(' ')}
    />
  );
}
