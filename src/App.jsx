import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignInHelpPage from './pages/SignInHelpPage.jsx';
import AccountRecoveryPage from './pages/AccountRecoveryPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import TicketFormPage from './pages/TicketFormPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import WorkflowSettingsPage from './pages/WorkflowSettingsPage.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading TaskFlow…</div>;
  if (!user) return (
    <Routes>
      <Route path="/forgot-password" element={<SignInHelpPage />} />
      <Route path="/reset-password" element={<AccountRecoveryPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/new" element={<TicketFormPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/tickets/:id/edit" element={<TicketFormPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings/workflow" element={user.role === 'Manager' ? <WorkflowSettingsPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
