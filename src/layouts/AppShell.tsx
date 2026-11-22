import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { moduleRoutes } from '../app/routes';
import { useNavigationRole } from '../app/useNavigationRole';
import { demoRoutes } from '../app/demo-routes';
import { HubLink } from '../components/ui';

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
  if (pathname === '/usuarios') {
    return {
      title: 'Usuários e vínculos',
      description: 'Gerencie o acesso de seus jogadores.',
      section: 'Administração',
    };
  }

  if (pathname === '/entrar') {
    return {
      title: 'Acesso ao Hub',
      description: 'Entre com seu usuario e senha de sempre.',
      section: 'Minha conta',
    };
  }

  if (pathname === '/') {
    return {
      title: 'Início',
      description: 'O ponto de encontro dos caminhos do seu universo de RPG.',
      section: 'Visão geral',
    };
  }

  const demo = demoRoutes.find((route) => route.path === pathname);
  if (demo) {
    return {
      title: demo.label,
      description: 'Página de demonstração com dados e interações fictícios.',
      section: 'Design System · Etapa 2.10',
    };
  }

  const module = moduleRoutes.find((route) => route.path === pathname);
  if (module) {
    return {
      title: module.label,
      description: 'Seu espaço de ' + module.label.toLowerCase() + ' no Hub.',
      section: 'Teias de Anansi',
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
 * O shell nao acessa Firebase nem dados privados diretamente; a rota de entrada usa servicos.
 */
export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const page = resolvePage(pathname);
  const onHome = pathname === '/';
  const role = useNavigationRole();
  const inLab = demoRoutes.some((route) => route.path === pathname);
  const [compact, setCompact] = useState(isCompactViewport);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(location.pathname);
  const restoreFocusRef = useRef(false);
  const focusMainRef = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(compactQuery);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.title = page.title + ' | Teias de Anansi';
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      focusMainRef.current = true;
      setMenuOpen(false);
    }
  }, [location.pathname, page.title]);

  useEffect(() => {
    if (!compact) setMenuOpen(false);
  }, [compact]);

  // Menu recolhido não pode continuar no percurso do teclado.
  useEffect(() => {
    if (menuPanelRef.current) menuPanelRef.current.inert = compact && !menuOpen;
  }, [compact, menuOpen]);

  useEffect(() => {
    if (!compact || !menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const background = [
      document.querySelector<HTMLElement>('.hub-topbar'),
      document.querySelector<HTMLElement>('.hub-page'),
      document.querySelector<HTMLElement>('.hub-footer'),
      document.querySelector<HTMLElement>('.hub-skip-link'),
    ].filter((element): element is HTMLElement => element !== null);
    const previousInert = background.map((element) => ({
      element,
      inert: Boolean(element.inert),
    }));
    previousInert.forEach(({ element }) => {
      element.inert = true;
    });
    document.body.style.overflow = 'hidden';

    const panel = menuPanelRef.current;
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []);

    focusable()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        restoreFocusRef.current = true;
        setMenuOpen(false);
        return;
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

    function keepFocusInside(event: FocusEvent) {
      if (panel && !panel.contains(event.target as Node)) {
        focusable()[0]?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', keepFocusInside);
      previousInert.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
    };
  }, [compact, menuOpen]);

  useEffect(() => {
    if (menuOpen) return;
    if (focusMainRef.current) {
      focusMainRef.current = false;
      restoreFocusRef.current = false;
      document.getElementById('main-content')?.focus();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      menuTriggerRef.current?.focus();
    }
  }, [menuOpen, location.pathname]);

  function closeMenu() {
    restoreFocusRef.current = true;
    setMenuOpen(false);
  }

  function navigateFromMenu() {
    if (compact) {
      focusMainRef.current = true;
      setMenuOpen(false);
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
          <Link className="hub-brand" to="/" aria-label="Teias de Anansi — ir para o início">
            <WebMark />
            <span className="hub-brand-copy">
              <strong>Teias de Anansi</strong>
              <small>Hub de RPG · O Grande Tear</small>
            </span>
          </Link>
        </div>
        <div className="hub-topbar-end">
          <HubLink variant="secondary" to="/entrar">
            Acessar Hub
          </HubLink>
        </div>
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
            {moduleRoutes.filter((module) => role !== null && module.allowedRoles.some((allowed) => allowed === role)).map((module) => (
              <NavLink
                key={module.path}
                to={module.path}
                className={navLinkClass}
                onClick={navigateFromMenu}
              >
                {module.label}
              </NavLink>
            ))}
            {role === 'dm' && (
              <NavLink to="/usuarios" className={navLinkClass} onClick={navigateFromMenu}>
                Usuários
              </NavLink>
            )}
            {role === null && (
              <NavLink to="/entrar" className={navLinkClass} onClick={navigateFromMenu}>
                Entrar
              </NavLink>
            )}
          </nav>
          {import.meta.env.DEV && (
          <nav className="hub-demo-sidebar-nav" aria-label="Laboratório de interface">
            <p className="hub-sidebar-heading">Avaliação visual</p>
            <NavLink end to="/laboratorio" className={navLinkClass} onClick={navigateFromMenu}>
              Laboratório de interface
            </NavLink>
          </nav>
          )}
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
                    {inLab && pathname !== '/laboratorio' && (
                      <li>
                        <Link to="/laboratorio">Laboratório de interface</Link>
                      </li>
                    )}
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
                  <HubLink variant="primary" to="/entrar">
                    Entrar no Hub
                  </HubLink>
                ) : inLab && pathname !== '/laboratorio' ? (
                  <HubLink variant="secondary" to="/laboratorio">
                    Visão do laboratório
                  </HubLink>
                ) : (
                  <HubLink variant="secondary" to="/">
                    Visão geral
                  </HubLink>
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
        Teias de Anansi · Hub de RPG
      </footer>
    </div>
  );
}
