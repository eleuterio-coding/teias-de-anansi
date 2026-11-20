import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type ActionMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export type ActionMenuProps = {
  label: string;
  items: readonly ActionMenuItem[];
};

export function ActionMenu({ label, items }: ActionMenuProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = items.filter((item) => !item.disabled);

  useEffect(() => {
    if (!open) return;
    const id = options[focused]?.id;
    if (!id) return;
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]',
    );
    const button = Array.from(buttons ?? []).find((element) => element.dataset.itemId === id);
    button?.focus();
  }, [open, focused, options]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openMenu(atEnd = false) {
    if (options.length === 0) return;
    setFocused(atEnd ? options.length - 1 : 0);
    setOpen(true);
  }

  function closeMenu(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function onTriggerKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowUp');
    }
  }

  function onMenuKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === 'Tab') {
      closeMenu(false);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    if (event.key === 'Home') setFocused(0);
    if (event.key === 'End') setFocused(options.length - 1);
    if (event.key === 'ArrowDown') setFocused((index) => (index + 1) % options.length);
    if (event.key === 'ArrowUp') {
      setFocused((index) => (index - 1 + options.length) % options.length);
    }
  }

  return (
    <div className="ds-action-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="ds-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? uid + '-menu' : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeys}
        disabled={options.length === 0}
      >
        {label}
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div
          id={uid + '-menu'}
          role="menu"
          aria-label={label}
          className="ds-menu-popover"
          onKeyDown={onMenuKeys}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-item-id={item.id}
              className={'ds-menu-item' + (item.danger ? ' ds-menu-item--danger' : '')}
              disabled={item.disabled}
              tabIndex={options[focused]?.id === item.id ? 0 : -1}
              onClick={() => {
                if (item.disabled) return;
                closeMenu();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
