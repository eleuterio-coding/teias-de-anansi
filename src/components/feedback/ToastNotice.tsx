import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';
import type { ToastRecord } from './types';

export type ToastNoticeProps = {
  notice: ToastRecord;
  onDismiss: (id: string) => void;
};

export function ToastNotice({ notice, onDismiss }: ToastNoticeProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  );
  const remainingMs = useRef(notice.durationMs);
  const paused = hovered || focused || pageHidden;

  useEffect(() => {
    function onVisibilityChange() {
      setPageHidden(document.hidden);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (notice.durationMs === 0 || paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismiss(notice.id), remainingMs.current);

    return () => {
      window.clearTimeout(timer);
      remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - startedAt));
    };
  }, [notice.id, notice.durationMs, paused, onDismiss]);

  const urgent = notice.tone === 'danger' || notice.tone === 'warning';

  return (
    <article
      className={'ds-toast ds-toast--' + notice.tone}
      role={urgent ? 'alert' : 'status'}
      aria-atomic="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="ds-toast-body">
        <strong className="ds-toast-title">{notice.title}</strong>
        <p className="ds-toast-message">{notice.message}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        aria-label={'Dispensar notificação: ' + notice.title}
        onClick={() => onDismiss(notice.id)}
      >
        Fechar
      </Button>
    </article>
  );
}
