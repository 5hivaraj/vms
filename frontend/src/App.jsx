import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { KioskProvider } from './context/KioskContext';
import { ToastProvider } from './hooks/useToast';
import KioskLayout from './components/layout/KioskLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Welcome from './pages/kiosk/Welcome';
import InductionVideo from './pages/kiosk/InductionVideo';
import SelfieCapture from './pages/kiosk/SelfieCapture';
import VisitorForm from './pages/kiosk/VisitorForm';
import Success from './pages/kiosk/Success';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';

function App() {
  useEffect(() => {
    const enterFullscreen = () => {
      if (window.location.pathname === '/' && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    document.addEventListener('click', enterFullscreen, { once: true });
    return () => document.removeEventListener('click', enterFullscreen);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <KioskProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<KioskLayout />}>
                <Route index element={<Welcome />} />
                <Route path="induction" element={<InductionVideo />} />
                <Route path="selfie" element={<SelfieCapture />} />
                <Route path="register" element={<VisitorForm />} />
                <Route path="success" element={<Success />} />
              </Route>

              <Route path="admin/login" element={<AdminLogin />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </KioskProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
