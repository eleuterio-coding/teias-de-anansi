import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
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
    <AppShell>
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
    </AppShell>
  );
}

export default function App() {
  // HashRouter preserva o funcionamento de prévias estáticas e GitHub Pages.
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
