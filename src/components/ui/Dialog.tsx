import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  disableClose?: boolean;
};

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  disableClose = false,
}: DialogProps) {
  const uid = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeHandlerRef = useRef(onClose);
  const blockedRef = useRef(disableClose);
  closeHandlerRef.current = onClose;
  blockedRef.current = disableClose;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const elements = () => Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    (elements()[0] ?? panel)?.focus();

    function onKeys(event: KeyboardEvent) {
      if (event.key === 'Escape' && !blockedRef.current) {
        event.preventDefault();
        closeHandlerRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = elements();
      if (controls.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeys);
    return () => {
      document.removeEventListener('keydown', onKeys);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="ds-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disableClose) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={uid + '-title'}
        aria-describedby={description ? uid + '-description' : undefined}
        tabIndex={-1}
        className="ds-dialog-panel"
      >
        <header className="ds-dialog-header">
          <div>
            <h2 id={uid + '-title'} className="ds-dialog-title">{title}</h2>
            {description && (
              <p id={uid + '-description'} className="ds-dialog-description">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Fechar janela"
            onClick={onClose}
            disabled={disableClose}
          >
            Fechar
          </Button>
        </header>
        <div className="ds-dialog-content">{children}</div>
        {footer && <footer className="ds-dialog-footer">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}
