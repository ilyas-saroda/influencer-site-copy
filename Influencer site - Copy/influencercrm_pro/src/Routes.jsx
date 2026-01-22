import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useNavigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from './contexts/AuthContext';
import NotFound from "./pages/NotFound";
import PaymentProcessingCenter from './pages/payment-processing-center';
import ExecutiveDashboard from './pages/executive-dashboard';
import LoginAndAuthentication from './pages/login-and-authentication';
import CreatorDatabaseManagement from './pages/creator-database-management';
import CreatorProfileDetails from './pages/creator-profile-details';
import CampaignManagementCenter from './pages/campaign-management-center';
import BrandContactManagement from './pages/brand-contact-management';
import BulkInstagramProcessor from './pages/bulk-instagram-processor';
import SystemSettingsUserManagement from './pages/system-settings-user-management';
import UserProfile from './pages/user-profile';
import AdminStateManagement from './pages/admin-state-management';
import AdminCityManagement from './pages/admin-city-management';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/" element={<LoginAndAuthentication />} />
          {/* Protect the executive dashboard so unauthenticated users are redirected to login */}
          <Route
            path="/executive-dashboard"
            element={
              <RequireAuth>
                <ExecutiveDashboard />
              </RequireAuth>
            }
          />
          <Route path="/payment-processing-center" element={<RequireAuth><PaymentProcessingCenter /></RequireAuth>} />
          <Route path="/login-and-authentication" element={<LoginAndAuthentication />} />
          <Route path="/login" element={<LoginAndAuthentication />} />
          <Route path="/creator-database-management" element={<RequireAuth><CreatorDatabaseManagement /></RequireAuth>} />
          <Route path="/creator-profile-details/:id" element={<RequireAuth><CreatorProfileDetails /></RequireAuth>} />
          <Route path="/campaign-management-center" element={<RequireAuth><CampaignManagementCenter /></RequireAuth>} />
          <Route path="/brand-contact-management" element={<RequireAuth><BrandContactManagement /></RequireAuth>} />
          <Route path="/bulk-instagram-processor" element={<RequireAuth><BulkInstagramProcessor /></RequireAuth>} />
          <Route path="/system-settings-user-management" element={<RequireAuth><SystemSettingsUserManagement /></RequireAuth>} />
          <Route path="/admin-state-management" element={<RequireAuth><AdminStateManagement /></RequireAuth>} />
          <Route path="/admin-city-management" element={<RequireAuth><AdminCityManagement /></RequireAuth>} />
          <Route path="/user-profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
          <Route path="/logout" element={<LogoutRoute />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

// Inline auth guard to avoid creating new files
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // While auth state is loading, render a centered spinner to avoid blank screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Simple logout route useful for testing sessions
export function LogoutRoute() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      try {
        await signOut();
      } catch (err) {
        console.error('Error signing out', err);
      } finally {
        // clear common Supabase localStorage keys and app flags
        try { localStorage.removeItem('supabase.auth.token'); } catch(e){}
        try { localStorage.removeItem('supabase.auth'); } catch(e){}
        try { localStorage.removeItem('rememberMe'); } catch(e){}
        // navigate back to login page
        navigate('/login');
      }
    })();
  }, [signOut, navigate]);

  return null;
}

export default Routes;