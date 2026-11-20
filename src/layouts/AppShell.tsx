import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { moduleRoutes } from '../app/routes';

type AppShellProps = {
  children: ReactNode;
};

const compactQuery = '(max-width: 1023px)';

function isCompactViewport() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(compactQuery).matches
    : false;
}

function WebMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="hub-web-mark"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
    >
      <polygon points="24,3 39,9 45,24 39,39 24,45 9,39 3,24 9,9" />
      <polygon points="24,11 33,15 37,24 33,33 24,37 15,33 11,24 15,15" />
      <polygon points="24,18 28,20 30,24 28,28 24,30 20,28 18,24 20,20" />
      <path d="M24 3V45M3 24H45M9 9L39 39M39 9L9 39" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function resolvePage(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'Início',
      description: 'O ponto de encontro dos caminhos do seu universo de RPG.',
      section: 'Visão geral',
    };
  }

  const module = moduleRoutes.find((route) => route.path === pathname);
  if (module) {
    return {
      title: module.label,
      description: 'Área prevista para ' + module.etapa.toLowerCase() + '.',
      section: module.etapa,
    };
  }

  return {
    title: 'Endereço indisponível',
    description: 'Esta rota não faz parte das áreas cadastradas no Hub.',
    section: 'Navegação',
  };
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'hub-nav-link is-active' : 'hub-nav-link';
}

/**
 * AppShell único: desktop persistente, tablet e celular com gaveta.
 * Não acessa Firebase, autenticação ou dados privados.
 */
export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const page = resolvePage(pathname);
  const onHome = pathname === '/';
  const [compact, setCompact] = useState(isCompactViewport);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(compactQuery);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      setMenuOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!compact) setMenuOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!compact || !menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = menuPanelRef.current;
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []);

    focusable()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
      }

      if (event.key !== 'Tab') return;

      const elements = focusable();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [compact, menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    menuTriggerRef.current?.focus();
  }

  function navigateFromMenu() {
    if (compact) {
      setMenuOpen(false);
      document.getElementById('main-content')?.focus();
    }
  }

  return (
    <div className="hub-shell">
      <button
        className="hub-skip-link"
        type="button"
        onClick={() => document.getElementById('main-content')?.focus()}
      >
        Pular para o conteúdo
      </button>

      <header className="hub-topbar">
        <div className="hub-topbar-start">
          <button
            ref={menuTriggerRef}
            className="hub-menu-trigger"
            type="button"
            aria-label="Abrir menu de navegação"
            aria-controls="hub-sidebar"
            aria-expanded={compact && menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <Link
            className="hub-brand"
            to="/"
            aria-label="Teias de Anansi — ir para o início"
          >
            <WebMark />
            <span className="hub-brand-copy">
              <strong>Teias de Anansi</strong>
              <small>Hub de RPG · O Grande Tear</small>
            </span>
          </Link>
        </div>
        <span className="hub-preview-label">Prévia estrutural · sem dados reais</span>
      </header>

      <div className="hub-workspace">
        {compact && menuOpen && (
          <button
            className="hub-drawer-backdrop"
            type="button"
            aria-label="Fechar menu de navegação"
            onClick={closeMenu}
          />
        )}

        <aside
          ref={menuPanelRef}
          id="hub-sidebar"
          className={'hub-sidebar' + (menuOpen ? ' is-open' : '')}
          role={compact && menuOpen ? 'dialog' : undefined}
          aria-modal={compact && menuOpen ? 'true' : undefined}
          aria-label={compact && menuOpen ? 'Menu de navegação' : undefined}
          aria-hidden={compact && !menuOpen ? true : undefined}
        >
          <div className="hub-drawer-header">
            <span>Caminhos do tear</span>
            <button
              className="hub-drawer-close"
              type="button"
              aria-label="Fechar navegação"
              onClick={closeMenu}
            >
              <CloseIcon />
            </button>
          </div>
          <p className="hub-sidebar-heading">Caminhos do tear</p>
          <nav className="hub-main-nav" aria-label="Navegação principal">
            <NavLink end to="/" className={navLinkClass} onClick={navigateFromMenu}>
              Início
            </NavLink>
            {moduleRoutes.map((module) => (
              <NavLink
                key={module.path}
                to={module.path}
                className={navLinkClass}
                onClick={navigateFromMenu}
              >
                {module.label}
              </NavLink>
            ))}
          </nav>
          <p className="hub-sidebar-note">
            Navegação demonstrativa, sem informações privadas.
          </p>
        </aside>

        <div className="hub-page">
          <div className="hub-page-header">
            <nav className="hub-breadcrumb" aria-label="Localização da página">
              <ol>
                {onHome ? (
                  <li aria-current="page">Início</li>
                ) : (
                  <>
                    <li>
                      <Link to="/">Início</Link>
                    </li>
                    <li aria-current="page">{page.title}</li>
                  </>
                )}
              </ol>
            </nav>
            <div className="hub-page-intro">
              <div>
                <p className="hub-page-kicker">{page.section}</p>
                <h1 id="hub-page-title">{page.title}</h1>
                <p className="hub-page-description">{page.description}</p>
              </div>
              <nav className="hub-page-actions" aria-label="Ações da página">
                {onHome ? (
                  <Link className="hub-action hub-action-primary" to="/biblioteca">
                    Explorar Biblioteca
                  </Link>
                ) : (
                  <Link className="hub-action hub-action-secondary" to="/">
                    Visão geral
                  </Link>
                )}
              </nav>
            </div>
          </div>

          <main
            id="main-content"
            className="hub-main-content"
            tabIndex={-1}
            aria-labelledby="hub-page-title"
          >
            {children}
          </main>
        </div>
      </div>

      <footer className="hub-footer">
        Prévia do Hub · Sem autenticação ou dados privados.
      </footer>
    </div>
  );
}
