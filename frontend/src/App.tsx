import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import axios from 'axios';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BudgetPage from './pages/Budget';
import Categories from './pages/Categories';
import Scenarios from './pages/Scenarios';
import ScenarioForm from './pages/ScenarioForm';
import BankAccounts from './pages/BankAccounts';
import Timeline from './pages/Timeline';
import MonthlyExpenses from './pages/MonthlyExpenses';
import Assets from './pages/Assets';
import AssetHistory from './pages/AssetHistory';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Configure axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="categories" element={<Categories />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="monthly-expenses" element={<MonthlyExpenses />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="scenarios/new" element={<ScenarioForm />} />
        <Route path="scenarios/:id/edit" element={<ScenarioForm />} />
        <Route path="bank-accounts" element={<BankAccounts />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id/history" element={<AssetHistory />} />
      </Route>
    </>
  )
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <RouterProvider router={router} />
          <ToastContainer position="bottom-right" />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;