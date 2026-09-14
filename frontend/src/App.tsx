import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LinkAccountPage } from './pages/LinkAccountPage';
import { TopUpPage } from './pages/TopUpPage';
import { TransferPage } from './pages/TransferPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { RefundRequestsPage } from './pages/RefundRequestsPage';
import { BankAccountsPage } from './pages/BankAccountsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminTransactionsPage } from './pages/AdminTransactionsPage';
import { AdminCommissionsPage } from './pages/AdminCommissionsPage';
import { AdminBankAccountsPage } from './pages/AdminBankAccountsPage';

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <DashboardPage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <BankAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/link"
              element={
                <ProtectedRoute>
                  <LinkAccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/topup"
              element={
                <ProtectedRoute>
                  <TopUpPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <TransferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/refund-requests"
              element={
                <ProtectedRoute>
                  <RefundRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute adminOnly>
                  <AdminTransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/commissions"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCommissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute adminOnly>
                  <AdminBankAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
