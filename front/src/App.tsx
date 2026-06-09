// =========================================================
//  App — routeur principal + providers
// =========================================================
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

const HomePage         = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage        = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage       = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const DashboardPage    = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NetworkPage      = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const AdvancedPage     = lazy(() => import('./pages/AdvancedPage').then(m => ({ default: m.AdvancedPage })));
const ProfilePage      = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SensorDetailPage = lazy(() => import('./pages/SensorDetailPage').then(m => ({ default: m.SensorDetailPage })));

// Pages admin (chargées en code-split séparé)
const AdminOverviewPage      = lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminAnalyticsPage     = lazy(() => import('./pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })));
const AdminDevicesPage       = lazy(() => import('./pages/admin/AdminDevicesPage').then(m => ({ default: m.AdminDevicesPage })));
const AdminMeasurementsPage  = lazy(() => import('./pages/admin/AdminMeasurementsPage').then(m => ({ default: m.AdminMeasurementsPage })));
const AdminCommandsPage      = lazy(() => import('./pages/admin/AdminCommandsPage').then(m => ({ default: m.AdminCommandsPage })));
const AdminSchemaPage        = lazy(() => import('./pages/admin/AdminSchemaPage').then(m => ({ default: m.AdminSchemaPage })));

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

            {/* ── Admin (layout dedie + verification role) ── */}
            <Route path="/admin" element={
              <AdminRoute><AdminLayout><AdminOverviewPage /></AdminLayout></AdminRoute>
            } />
            <Route path="/admin/analytics" element={
              <AdminRoute><AdminLayout><AdminAnalyticsPage /></AdminLayout></AdminRoute>
            } />
            <Route path="/admin/devices" element={
              <AdminRoute><AdminLayout><AdminDevicesPage /></AdminLayout></AdminRoute>
            } />
            <Route path="/admin/measurements" element={
              <AdminRoute><AdminLayout><AdminMeasurementsPage /></AdminLayout></AdminRoute>
            } />
            <Route path="/admin/commands" element={
              <AdminRoute><AdminLayout><AdminCommandsPage /></AdminLayout></AdminRoute>
            } />
            <Route path="/admin/schema" element={
              <AdminRoute><AdminLayout><AdminSchemaPage /></AdminLayout></AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;