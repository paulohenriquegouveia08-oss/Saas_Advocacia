// ============================================
// Juris Gestão — Router Configuration
// React Router v6 com SPA routing
// ============================================

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './guards';

// Lazy-loaded feature pages
import LoginPage from '@/features/auth/LoginPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import AppLayout from '@/features/layout/AppLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ClientesPage from '@/features/clientes/ClientesPage';
import FinanceiroPage from '@/features/financeiro/FinanceiroPage';
import PrazosPage from '@/features/prazos/PrazosPage';
import UsersPage from '@/features/adminGlobal/UsersPage';
import RolesPage from '@/features/adminGlobal/RolesPage';

import ClientDashboardPage from '@/features/clientPortal/ClientDashboardPage';

export const router = createBrowserRouter([
  // ---- Public Routes ----
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },

  // ---- Client Portal Routes ----
  {
    path: '/client-dashboard',
    element: (
      <ProtectedRoute allowClient>
        <ClientDashboardPage />
      </ProtectedRoute>
    ),
  },

  // ---- Protected Routes (com Layout) ----
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'clientes',
        element: (
          <ProtectedRoute requiredPermission="canAccessClientes">
            <ClientesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'financeiro',
        element: (
          <ProtectedRoute requiredPermission="canAccessFinanceiro">
            <FinanceiroPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'prazos',
        element: (
          <ProtectedRoute requiredPermission="canAccessPrazos">
            <PrazosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute requireAdmin>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cargos',
        element: (
          <ProtectedRoute requireAdmin>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ---- Catch-all ----
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
