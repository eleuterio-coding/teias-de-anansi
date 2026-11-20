import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: readonly TabItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
};

export function Tabs({ items, label, value, defaultValue, onValueChange }: TabsProps) {
  const uid = useId();
  const [internal, setInternal] = useState(defaultValue);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const enabled = items.filter((item) => !item.disabled);
  const first = enabled[0]?.id;
  const selected = enabled.some((item) => item.id === (value ?? internal))
    ? (value ?? internal)
    : first;
  const activeIndex = items.findIndex((item) => item.id === selected);

  if (!first) return null;

  function activate(id: string) {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  }

  function onKeys(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const current = enabled.findIndex((item) => item.id === id);
    let index = current;
    if (event.key === 'Home') index = 0;
    if (event.key === 'End') index = enabled.length - 1;
    if (event.key === 'ArrowRight') index = (current + 1) % enabled.length;
    if (event.key === 'ArrowLeft') index = (current - 1 + enabled.length) % enabled.length;

    const next = enabled[index];
    if (next) {
      activate(next.id);
      refs.current.get(next.id)?.focus();
    }
  }

  return (
    <div className="ds-tabs">
      <div className="ds-tab-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              if (element) refs.current.set(item.id, element);
              else refs.current.delete(item.id);
            }}
            id={uid + '-tab-' + index}
            type="button"
            role="tab"
            aria-selected={item.id === selected}
            aria-controls={uid + '-panel-' + index}
            disabled={item.disabled}
            tabIndex={item.id === selected ? 0 : -1}
            onClick={() => activate(item.id)}
            onKeyDown={(event) => onKeys(event, item.id)}
            className="ds-tab"
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          id={uid + '-panel-' + index}
          role="tabpanel"
          aria-labelledby={uid + '-tab-' + index}
          hidden={item.id !== selected}
          tabIndex={item.id === selected ? 0 : -1}
          className="ds-tab-panel"
        >
          {index === activeIndex ? item.content : null}
        </div>
      ))}
    </div>
  );
}
