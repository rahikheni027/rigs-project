import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MachineProvider } from './context/MachineContext';
import { useDeviceDetect } from './hooks/useDeviceDetect';

// Desktop Components
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import MachinesPage from './pages/MachinesPage';
import MachineDetailPage from './pages/MachineDetailPage';
import AlertsPage from './pages/AlertsPage';

// Mobile Components
import MobileLayout from './components/MobileLayout';
import MobileDashboard from './pages/mobile/MobileDashboard';
import MobileAdminDashboard from './pages/mobile/MobileAdminDashboard';
import MobileMachinesPage from './pages/mobile/MobileMachinesPage';
import MobileMachineDetailPage from './pages/mobile/MobileMachineDetailPage';
import MobileAlertsPage from './pages/mobile/MobileAlertsPage';

// Common Components
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Responsive Wrappers
const ResponsiveLayoutWrapper = () => {
  const { isMobile } = useDeviceDetect();
  return isMobile ? <MobileLayout /> : <Layout />;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  const { isMobile } = useDeviceDetect();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  if (isMobile) {
    return isAdmin ? <MobileAdminDashboard /> : <MobileDashboard />;
  }
  return isAdmin ? <AdminDashboard /> : <WorkerDashboard />;
};

const ResponsiveAdmin = () => {
  const { isMobile } = useDeviceDetect();
  return isMobile ? <MobileAdminDashboard /> : <AdminDashboard />;
};

const ResponsiveMachines = () => {
  const { isMobile } = useDeviceDetect();
  return isMobile ? <MobileMachinesPage /> : <MachinesPage />;
};

const ResponsiveMachineDetail = () => {
  const { isMobile } = useDeviceDetect();
  return isMobile ? <MobileMachineDetailPage /> : <MachineDetailPage />;
};

const ResponsiveAlerts = () => {
  const { isMobile } = useDeviceDetect();
  return isMobile ? <MobileAlertsPage /> : <AlertsPage />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MachineProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected layout */}
              <Route path="/app" element={<ResponsiveLayoutWrapper />}>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardRouter />} />
                <Route path="machines" element={<ResponsiveMachines />} />
                <Route path="machines/:id" element={<ResponsiveMachineDetail />} />
                <Route path="alerts" element={<ResponsiveAlerts />} />
                <Route path="admin" element={<ResponsiveAdmin />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Legacy redirects */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/machines" element={<Navigate to="/app/machines" replace />} />
              <Route path="/alerts" element={<Navigate to="/app/alerts" replace />} />
              <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
              <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </MachineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
