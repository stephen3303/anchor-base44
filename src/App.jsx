import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/anchor/AppLayout';
import Home from '@/pages/Home';
import Messages from '@/pages/Messages';
import Planned from '@/pages/Planned';
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
          <Route
            path="/messages/:id"
            element={
              <Planned
                title="Message record"
                note="The full record view: precedence and lifecycle banners linking to the replacing message, Message, Metadata, Related, References and Distribution tabs, monospace official text with a separate AI summary panel, the integrity block, attachments, print rendition with classification markings, and Share link."
              />
            }
          />
          <Route
            path="/search"
            element={
              <Planned
                title="Search"
                note="Merged into the Messages surface per the review: advanced filters for date range, type, originator, precedence, community and status, keyword search over official text only, and saved searches."
              />
            }
          />
          <Route
            path="/subscriptions"
            element={
              <Planned
                title="Subscriptions"
                note="My subscriptions with status and channels, category sidebar, recommended feeds, and a request form with justification. Requests stay Pending Approval until an admin decides, and mandatory feeds cannot be paused."
              />
            }
          />
          <Route
            path="/briefings"
            element={
              <Planned
                title="Briefings"
                note="Generated briefing with executive summary, key takeaways, high-priority messages and action items. The tailored briefing builder is deferred beyond the pilot."
              />
            }
          />
          <Route
            path="/watch-turnover"
            element={
              <Planned
                title="Watch Turnover"
                note="Situation overview, high-priority traffic since the last watch, open actions, ongoing topics, watch notes and checklist, and a generated turnover package — one turnover per watch, authored by the watch officer on duty."
              />
            }
          />
          <Route
            path="/offline"
            element={
              <Planned
                title="Offline Mode"
                note="EMCON is a global mode controlled from the header. This screen manages what it covers: connection status, locally held traffic, the pending sync queue and sync priority with acknowledgements first."
              />
            }
          />
          <Route
            path="/reports"
            element={
              <Planned
                title="Reports"
                note="Acknowledgement accountability per message — acknowledged, pending, overdue and escalated, plus who has not acknowledged — and traffic volume by type and precedence."
              />
            }
          />
          <Route
            path="/audit"
            element={
              <Planned
                title="Audit and Integrity"
                note="Filterable append-only audit log with the hash chain, integrity check results that report the first break, and charts by action and classification."
              />
            }
          />
          <Route
            path="/admin"
            element={
              <Planned
                title="Admin"
                note="Subscription approval queue with approve and deny comments, mandatory alert rules with precedence conditions, acknowledgement windows and escalation roles, and access groups."
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Planned
                title="Profile and Settings"
                note="Rank, unit, role and groups, notification preferences per channel and precedence, display and density settings, and security information."
              />
            }
          />
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App