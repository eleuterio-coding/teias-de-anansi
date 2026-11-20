import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './toast-context';
import { ToastNotice } from './ToastNotice';
import type { ToastControls, ToastInput, ToastRecord } from './types';

const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 6500;

export type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const nextId = useRef(0);
  const [notices, setNotices] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const clear = useCallback(() => {
    setNotices([]);
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const tone = input.tone ?? 'info';
    const requested = input.durationMs;
    const defaultDuration = tone === 'warning' || tone === 'danger' ? 0 : DEFAULT_DURATION_MS;
    const durationMs =
      requested === undefined || !Number.isFinite(requested)
        ? defaultDuration
        : Math.max(0, Math.min(60000, requested));

    nextId.current += 1;
    const id = 'toast-' + nextId.current;

    setNotices((current) => [
      ...current,
      {
        id,
        title: input.title,
        message: input.message,
        tone,
        durationMs,
      },
    ]);

    return id;
  }, []);

  const controls = useMemo<ToastControls>(
    () => ({ notify, dismiss, clear }),
    [notify, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={controls}>
      {children}
      {notices.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <aside className="ds-toast-stack" aria-label="Notificações do sistema">
            {notices.slice(0, MAX_VISIBLE).map((notice) => (
              <ToastNotice key={notice.id} notice={notice} onDismiss={dismiss} />
            ))}
          </aside>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
