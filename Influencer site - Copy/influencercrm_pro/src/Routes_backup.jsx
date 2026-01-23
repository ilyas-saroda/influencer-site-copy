import React from "react";
import { Routes as RouterRoutes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 20
    },
    in: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    out: {
      opacity: 0,
      scale: 1.02,
      y: -20
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
  };

  const PageWrapper = ({ children }) => (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/" element={<PageWrapper><LoginAndAuthentication /></PageWrapper>} />
          {/* Protect the executive dashboard so unauthenticated users are redirected to login */}
          <Route
            path="/executive-dashboard"
            element={
              <RequireAuth>
                <PageWrapper><ExecutiveDashboard /></PageWrapper>
              </RequireAuth>
            }
          />
          <Route path="/payment-processing-center" element={<RequireAuth><PageWrapper><PaymentProcessingCenter /></PageWrapper></RequireAuth>} />
          <Route path="/login-and-authentication" element={<PageWrapper><LoginAndAuthentication /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><LoginAndAuthentication /></PageWrapper>} />
          <Route path="/creator-database-management" element={<RequireAuth><PageWrapper><CreatorDatabaseManagement /></PageWrapper></RequireAuth>} />
          <Route path="/creator-profile-details/:id" element={<RequireAuth><PageWrapper><CreatorProfileDetails /></PageWrapper></RequireAuth>} />
          <Route path="/campaign-management-center" element={<RequireAuth><PageWrapper><CampaignManagementCenter /></PageWrapper></RequireAuth>} />
          <Route path="/brand-contact-management" element={<RequireAuth><PageWrapper><BrandContactManagement /></PageWrapper></RequireAuth>} />
          <Route path="/bulk-instagram-processor" element={<RequireAuth><PageWrapper><BulkInstagramProcessor /></PageWrapper></RequireAuth>} />
          <Route path="/system-settings-user-management" element={<RequireAuth><PageWrapper><SystemSettingsUserManagement /></PageWrapper></RequireAuth>} />
          <Route path="/admin-state-management" element={<RequireAuth><PageWrapper><AdminStateManagement /></PageWrapper></RequireAuth>} />
          <Route path="/admin-city-management" element={<RequireAuth><PageWrapper><AdminCityManagement /></PageWrapper></RequireAuth>} />
          <Route path="/user-profile" element={<RequireAuth><PageWrapper><UserProfile /></PageWrapper></RequireAuth>} />
          <Route path="/logout" element={<PageWrapper><LogoutRoute /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </RouterRoutes>
      </AnimatePresence>
    </ErrorBoundary>
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