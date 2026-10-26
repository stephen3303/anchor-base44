import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/anchor/ErrorBoundary';
import AppLayout from '@/components/anchor/AppLayout';
import Home from '@/pages/Home';
import Messages from '@/pages/Messages';
import MessageRecord from '@/pages/MessageRecord';
import Drafting from '@/pages/Drafting';
import DraftNew from '@/pages/DraftNew';
import DraftWorkspace from '@/pages/DraftWorkspace';
import AdminRouting from '@/pages/AdminRouting';
import Admin from '@/pages/Admin';
import Audit from '@/pages/Audit';
import Reports from '@/pages/Reports';
import Simulators from '@/pages/Simulators';
import Subscriptions from '@/pages/Subscriptions';
import Briefings from '@/pages/Briefings';
import WatchTurnover from '@/pages/WatchTurnover';
import Offline from '@/pages/Offline';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated application */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<MessageRecord />} />
          <Route path="/drafting" element={<Drafting />} />
          <Route path="/drafting/new" element={<DraftNew />} />
          <Route path="/drafting/:id" element={<DraftWorkspace />} />
          <Route path="/admin/routing" element={<AdminRouting />} />
          <Route path="/simulators" element={<Simulators />} />
          <Route path="/search" element={<Navigate to="/messages" replace />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/briefings" element={<Briefings />} />
          <Route path="/watch-turnover" element={<WatchTurnover />} />
          <Route path="/offline" element={<Offline />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          {/* Top-level net: catches a fault in the shell itself, which the inner boundary cannot. */}
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App