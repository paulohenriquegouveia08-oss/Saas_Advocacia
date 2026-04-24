// ============================================
// Juris Gestão — App Layout (Sidebar + Content)
// ============================================

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  Scale,
  LayoutDashboard,
  Users,
  UserCog,
  Wallet,
  CalendarClock,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import './layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/clientes', label: 'Clientes', icon: <Users size={20} />, requiredPermission: 'canAccessClientes' },
  { to: '/financeiro', label: 'Financeiro', icon: <Wallet size={20} />, requiredPermission: 'canAccessFinanceiro' },
  { to: '/prazos', label: 'Prazos', icon: <CalendarClock size={20} />, requiredPermission: 'canAccessPrazos' },
  { to: '/usuarios', label: 'Usuários', icon: <UserCog size={20} />, requireAdmin: true },
];

export default function AppLayout() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const canAccess = (item: NavItem): boolean => {
    if (isAdmin) return true;
    if (item.requireAdmin) return false;
    if (item.requiredPermission) {
      const perms = user?.role?.permissions as Record<string, boolean> | undefined;
      return !!perms?.[item.requiredPermission];
    }
    return true;
  };

  const filteredNav = navItems.filter(canAccess);

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Scale size={24} strokeWidth={2.5} />
            {!collapsed && <span className="sidebar-logo-text">Juris Gestão</span>}
          </div>
          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Alternar sidebar"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="sidebar-close-btn mobile-only"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" title={user?.email ?? ''}>
            <div className="sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name ?? 'Usuário'}</span>
                <span className="sidebar-user-role">
                  {user?.role?.name ?? 'Sem cargo'}
                </span>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sair"
            id="logout-btn"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <header className="mobile-header mobile-only">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-header-brand">
            <Scale size={20} strokeWidth={2.5} />
            <span>Juris Gestão</span>
          </div>
          <div style={{ width: 40 }} />
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
