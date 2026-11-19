import { lazy, Suspense } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingState } from './LoadingState';
import { PageErrorBoundary } from './PageErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { moduleRoutes } from './routes';

const HomePage = lazy(() => import('./pages/HomePage'));
const SectionPlaceholder = lazy(() => import('./pages/SectionPlaceholder'));

/** Exportado para testar rotas com MemoryRouter, sem depender de URL real. */
export function AppContent() {
  const location = useLocation();

  return (
    <div className="app-root">
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >
        Pular para o conteúdo
      </button>
      <header className="app-header">
        <h1>Teias de Anansi</h1>
        <p>Hub de RPG — estrutura provisória</p>
      </header>
      <div className="app-body">
        <nav className="app-nav" aria-label="Navegação principal">
          <NavLink to="/" end>
            Início
          </NavLink>
          {moduleRoutes.map((module) => (
            <NavLink key={module.path} to={module.path}>
              {module.label}
            </NavLink>
          ))}
        </nav>
        <main id="main-content" tabIndex={-1}>
          <PageErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                {moduleRoutes.map((module) => (
                  <Route
                    key={module.path}
                    path={module.path}
                    element={<SectionPlaceholder label={module.label} etapa={module.etapa} />}
                  />
                ))}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </PageErrorBoundary>
        </main>
      </div>
      <footer className="app-footer">
        Prévia técnica sem login, dados privados ou funcionalidades de jogo.
      </footer>
    </div>
  );
}

export default function App() {
  // HashRouter funciona em prévias estáticas sem exigir reescrita do servidor.
  // O caminho base e a implantação no GitHub Pages pertencem ao item 1.06.
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
