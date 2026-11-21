import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '../components/feedback';
import { demoRoutes } from './demo-routes';
import { AppShell } from '../layouts/AppShell';
import { LoadingState } from './LoadingState';
import { PageErrorBoundary } from './PageErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { moduleRoutes } from './routes';
import { ProtectedModuleRoute } from './ProtectedModuleRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SectionPlaceholder = lazy(() => import('./pages/SectionPlaceholder'));
const DemoOverviewPage = lazy(() => import('./pages/demo/DemoOverviewPage'));
const DemoComponentsPage = lazy(() => import('./pages/demo/DemoComponentsPage'));
const DemoDataPage = lazy(() => import('./pages/demo/DemoDataPage'));
const DemoFormsPage = lazy(() => import('./pages/demo/DemoFormsPage'));
const DemoStatesPage = lazy(() => import('./pages/demo/DemoStatesPage'));

/** Exportado para testar rotas com MemoryRouter, sem depender de URL real. */
export function AppContent() {
  const location = useLocation();

  return (
    <ToastProvider>
      <AppShell>
        <PageErrorBoundary key={location.pathname}>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route path={demoRoutes[0].path} element={<DemoOverviewPage />} />
              <Route path={demoRoutes[1].path} element={<DemoComponentsPage />} />
              <Route path={demoRoutes[2].path} element={<DemoDataPage />} />
              <Route path={demoRoutes[3].path} element={<DemoFormsPage />} />
              <Route path={demoRoutes[4].path} element={<DemoStatesPage />} />
              {moduleRoutes.map((module) => (
                <Route
                  key={module.path}
                  path={module.path}
                  element={
                    <ProtectedModuleRoute route={module}>
                      <SectionPlaceholder label={module.label} etapa={module.etapa} />
                    </ProtectedModuleRoute>
                  }
                />
              ))}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </PageErrorBoundary>
      </AppShell>
    </ToastProvider>
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
