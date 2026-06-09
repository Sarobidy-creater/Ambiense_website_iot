// =========================================================
//  App — routeur principal + providers
// =========================================================
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy-loading des pages pour l'eco-conception (code-splitting)
const HomePage      = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage     = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage    = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const DevicesPage   = lazy(() => import('./pages/DevicesPage').then(m => ({ default: m.DevicesPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdvancedPage  = lazy(() => import('./pages/AdvancedPage').then(m => ({ default: m.AdvancedPage })));

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', color: 'var(--clr-text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '1.1rem',
      }}
      role="status"
      aria-live="polite"
    >
      Chargement...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
            } />
            <Route path="/devices" element={
              <ProtectedRoute><Layout><DevicesPage /></Layout></ProtectedRoute>
            } />
            <Route path="/advanced" element={
              <ProtectedRoute><Layout><AdvancedPage /></Layout></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;