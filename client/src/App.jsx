import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/common/Loader';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import ApprovalRulesPage from './pages/admin/ApprovalRulesPage';
import ApprovalRuleFormPage from './pages/admin/ApprovalRuleFormPage';
import AllExpensesPage from './pages/admin/AllExpensesPage';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ApprovalDetailPage from './pages/manager/ApprovalDetailPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import NewExpensePage from './pages/employee/NewExpensePage';
import ExpenseDetailPage from './pages/employee/ExpenseDetailPage';

// Other
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/auth/ProfilePage';
import NotificationsPage from './pages/dashboard/NotificationsPage';

// Protected Route wrapper
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard
    const roleRoutes = { ADMIN: '/admin', MANAGER: '/manager', EMPLOYEE: '/employee', CFO: '/manager' };
    return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
  }
  return <Outlet />;
}

// Public Route wrapper (redirect if already logged in)
function PublicRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (isAuthenticated) {
    const roleRoutes = { ADMIN: '/admin', MANAGER: '/manager', EMPLOYEE: '/employee', CFO: '/manager' };
    return <Navigate to={roleRoutes[user?.role] || '/'} replace />;
  }
  return <Outlet />;
}

// Root redirect
function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roleRoutes = { ADMIN: '/admin', MANAGER: '/manager', EMPLOYEE: '/employee', CFO: '/manager' };
  return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Universal Protected Routes (Any Role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/approval-rules" element={<ApprovalRulesPage />} />
          <Route path="/admin/approval-rules/new" element={<ApprovalRuleFormPage />} />
          <Route path="/admin/approval-rules/:id/edit" element={<ApprovalRuleFormPage />} />
          <Route path="/admin/expenses" element={<AllExpensesPage />} />
        </Route>
      </Route>

      {/* Manager / CFO Routes */}
      <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'CFO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/approvals/:id" element={<ApprovalDetailPage />} />
        </Route>
      </Route>

      {/* Employee Routes */}
      <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/expenses/new" element={<NewExpensePage />} />
          <Route path="/employee/expenses/:id" element={<ExpenseDetailPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
