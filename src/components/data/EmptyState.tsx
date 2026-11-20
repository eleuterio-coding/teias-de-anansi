import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty-state">
      <div className="ds-empty-ornament" aria-hidden="true">
        ◇
      </div>
      <strong className="ds-empty-title">{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="ds-empty-action">{action}</div>}
    </div>
  );
}
