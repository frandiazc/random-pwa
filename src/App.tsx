import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import WaiterApp from './pages/WaiterApp';
import KitchenDisplay from './components/KitchenDisplay';

// Admin components
import DashboardHome from './components/admin/DashboardHome';
import ZoneManager from './components/admin/ZoneManager';
import TableManager from './components/admin/TableManager';
import CategoryManager from './components/admin/CategoryManager';
import ProductManager from './components/admin/ProductManager';

// Waiter components
import TableOrder from './components/waiter/TableOrder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kitchen" element={<KitchenDisplay />} />

      {/* Waiter app (public for now, could add PIN auth later) */}
      <Route path="/waiter" element={<WaiterApp />} />
      <Route path="/waiter/table/:tableId" element={<TableOrder />} />

      {/* Admin routes (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="zones" element={<ZoneManager />} />
        <Route path="tables" element={<TableManager />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="products" element={<ProductManager />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/waiter" replace />} />
      <Route path="*" element={<Navigate to="/waiter" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
