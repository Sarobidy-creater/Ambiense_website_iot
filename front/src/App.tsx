// =========================================================
//  App — routeur principal + providers
// =========================================================
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

const HomePage         = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage        = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage       = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const DashboardPage    = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NetworkPage      = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const AdvancedPage     = lazy(() => import('./pages/AdvancedPage').then(m => ({ default: m.AdvancedPage })));
const ProfilePage      = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SensorDetailPage = lazy(() => import('./pages/SensorDetailPage').then(m => ({ default: m.SensorDetailPage })));

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
            {/* Pages publiques */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Page d'accueil avec Layout */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />

            {/* Pages protegees avec Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
            } />
            <Route path="/network" element={
              <ProtectedRoute><Layout><NetworkPage /></Layout></ProtectedRoute>
            } />
            <Route path="/advanced" element={
              <ProtectedRoute><Layout><AdvancedPage /></Layout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
            } />
            {/* Page de surveillance detail d'un capteur */}
            <Route path="/sensor/:deviceId" element={
              <ProtectedRoute><Layout><SensorDetailPage /></Layout></ProtectedRoute>
            } />

            {/* Anciennes routes — redirige */}
            <Route path="/devices" element={<Navigate to="/network" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;