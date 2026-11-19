import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronsUpDown, Menu, Search, ShieldAlert, Sparkles, X } from 'lucide-react';
import {
  allNavigation,
  primaryNavigation,
  settingsNavigation,
  supportNavigation,
  type PageId,
  type NavItem,
} from '../data/navigation';

function Brand() {
  return (
    <div className="brand" aria-label="Teias de Anansi">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="1" opacity=".65" />
          <circle cx="26" cy="26" r="13.5" stroke="currentColor" strokeWidth="1" opacity=".65" />
          <path d="M26 4V48M4 26H48M10.45 10.45L41.55 41.55M41.55 10.45L10.45 41.55" stroke="currentColor" strokeWidth="1" opacity=".6" />
          <circle cx="26" cy="26" r="4.5" fill="currentColor" />
        </svg>
      </div>
      <div>
        <strong>Teias de Anansi</strong>
        <span>HUB DE RPG</span>
      </div>
    </div>
  );
}

type Props = {
  activePage: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
};

export function AppShell({ activePage, onNavigate, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const activeItem = allNavigation.find((item) => item.id === activePage) ?? primaryNavigation[0];
  const matches = allNavigation.filter((item) =>
    `${item.label} ${item.description}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')),
  );

  function navigate(id: PageId) {
    setMenuOpen(false);
    setQuery('');
    onNavigate(id);
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA' && !target?.isContentEditable) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('keydown', focusSearch);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('keydown', focusSearch);
    };
  }, []);

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        className={`nav-item${item.id === activePage ? ' nav-item--active' : ''}`}
        aria-current={item.id === activePage ? 'page' : undefined}
        onClick={() => navigate(item.id)}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
        {item.id === activePage && <span className="nav-active-indicator" aria-hidden="true" />}
      </button>
    );
  }

  return (
    <div className="shell">
      {menuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`} aria-label="Menu principal">
        <div className="sidebar-head"><Brand /><button className="mobile-close icon-button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={20}/></button></div>
        <div className="workspace-picker" aria-label="Área de trabalho: Mesa principal">
          <span className="workspace-icon"><DicesGlyph /></span>
          <span className="workspace-text"><strong>Mesa principal</strong><small>Área de trabalho</small></span>
          <ChevronsUpDown size={15} aria-hidden="true" />
        </div>
        <nav className="sidebar-nav" aria-label="Navegação">
          <div className="nav-group"><span className="nav-heading">ORGANIZAÇÃO</span>{primaryNavigation.map(renderNavItem)}</div>
          <div className="nav-group"><span className="nav-heading">RECURSOS</span>{supportNavigation.map(renderNavItem)}</div>
        </nav>
        <div className="sidebar-bottom">
          {renderNavItem(settingsNavigation)}
          <div className="build-notice"><span className="build-dot" /><span>Estrutura em desenvolvimento</span></div>
        </div>
      </aside>

      <div className="main-layout">
        <header className="topbar">
          <div className="topbar-start">
            <button className="mobile-menu icon-button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22}/></button>
            <span className="breadcrumb-root">Teias de Anansi</span><span className="breadcrumb-separator" aria-hidden="true">/</span><span className="breadcrumb-current">{activeItem.label}</span>
          </div>
          <div className="topbar-end">
            <div className="search-box">
              <Search size={17} aria-hidden="true" />
              <input ref={searchRef} aria-label="Buscar uma área do Hub" placeholder="Buscar uma área do Hub..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <kbd>/</kbd>
              {query.trim() && (
                <div className="search-results" role="listbox" aria-label="Áreas encontradas">
                  {matches.length ? matches.map((item) => (
                    <button key={item.id} role="option" aria-selected={false} onClick={() => navigate(item.id)}>{item.label}<small>{item.description}</small></button>
                  )) : <span>Nenhuma área encontrada.</span>}
                </div>
              )}
            </div>
            <span className="preview-tag"><Sparkles size={14} /> Prévia de layout</span>
            <div className="avatar" title="Acesso ainda não conectado" aria-label="Conta não conectada"><ShieldAlert size={18} /></div>
          </div>
        </header>
        <main className="main-content" id="conteudo-principal">
          {children}
          <footer className="app-footer"><span>Teias de Anansi · Fundação visual</span><span>A autenticação e os dados privados ainda não estão conectados.</span></footer>
        </main>
      </div>
    </div>
  );
}

function DicesGlyph() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true"><path d="m12 1.8 8.3 5.1v10.2L12 22.2l-8.3-5.1V6.9L12 1.8Z" stroke="currentColor" strokeWidth="1.6"/><path d="M3.7 6.9 12 12l8.3-5.1M12 12v10.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="8.3" r="1" fill="currentColor" /></svg>;
}