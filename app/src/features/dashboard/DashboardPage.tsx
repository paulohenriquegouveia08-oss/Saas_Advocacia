// ============================================
// Juris Gestão — Dashboard Page
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { clientesService } from '@/shared/services/clientes.service';
import { financeiroService } from '@/shared/services/financeiro.service';
import { prazosService } from '@/shared/services/prazos.service';
import { formatCurrency, formatDate, daysUntil, getDeadlineUrgency } from '@/shared/utils/formatters';
import type { Deadline } from '@/shared/types';
import {
  Users,
  Wallet,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './dashboard.css';

interface DashboardStats {
  totalClientes: number;
  totalIncome: number;
  totalExpense: number;
  pendingIncome: number;
  pendingExpense: number;
  todayDeadlines: Deadline[];
  upcomingDeadlines: Deadline[];
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const orgId = user?.organizationId;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(!!orgId);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    Promise.all([
      clientesService.list(orgId),
      financeiroService.getSummary(orgId),
      prazosService.getToday(orgId),
      prazosService.list(orgId, { daysAhead: 7, status: 'PENDING' }),
    ]).then(([clientesRes, finRes, todayRes, upcomingRes]) => {
      if (!cancelled) {
        setStats({
          totalClientes: clientesRes.count ?? clientesRes.data?.length ?? 0,
          totalIncome: finRes.data?.totalIncome ?? 0,
          totalExpense: finRes.data?.totalExpense ?? 0,
          pendingIncome: finRes.data?.pendingIncome ?? 0,
          pendingExpense: finRes.data?.pendingExpense ?? 0,
          todayDeadlines: todayRes.data ?? [],
          upcomingDeadlines: upcomingRes.data ?? [],
        });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
        <span>Carregando dashboard...</span>
      </div>
    );
  }

  const saldo = (stats?.totalIncome ?? 0) - (stats?.totalExpense ?? 0);

  return (
    <div className="dashboard animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bem-vindo, <strong>{user?.name?.split(' ')[0]}</strong> 👋
          </p>
        </div>
      </div>

      {!orgId && !isAdmin && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded shadow-sm">
          <p className="font-bold">Organização não vinculada</p>
          <p>
            Sua conta ainda não está vinculada a nenhum escritório (organização). 
            Peça ao administrador para configurar seu acesso no painel de usuários.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-clients">
          <div className="stat-card-icon">
            <Users size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total de Clientes</span>
            <span className="stat-card-value">{stats?.totalClientes ?? 0}</span>
          </div>
          <Link to="/clientes" className="stat-card-action" id="dashboard-link-clientes">
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="stat-card stat-card-income">
          <div className="stat-card-icon">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Entradas (Pagas)</span>
            <span className="stat-card-value">{formatCurrency(stats?.totalIncome ?? 0)}</span>
            <span className="stat-card-secondary">
              {formatCurrency(stats?.pendingIncome ?? 0)} a receber
            </span>
          </div>
        </div>

        <div className="stat-card stat-card-expense">
          <div className="stat-card-icon">
            <TrendingDown size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Saídas (Pagas)</span>
            <span className="stat-card-value">{formatCurrency(stats?.totalExpense ?? 0)}</span>
            <span className="stat-card-secondary">
              {formatCurrency(stats?.pendingExpense ?? 0)} a pagar
            </span>
          </div>
        </div>

        <div className={`stat-card ${saldo >= 0 ? 'stat-card-positive' : 'stat-card-negative'}`}>
          <div className="stat-card-icon">
            <Wallet size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Saldo Atual</span>
            <span className="stat-card-value">{formatCurrency(saldo)}</span>
          </div>
          <Link to="/financeiro" className="stat-card-action" id="dashboard-link-financeiro">
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* Deadlines Section */}
      <div className="dashboard-grid-2">
        {/* Today's Deadlines */}
        <div className="card">
          <div className="card-body">
            <div className="section-header">
              <div className="section-header-left">
                <CalendarClock size={20} className="section-icon" />
                <h2 className="section-title">Prazos de Hoje</h2>
              </div>
              <Link to="/prazos" className="section-action" id="dashboard-link-prazos-hoje">
                Ver todos
              </Link>
            </div>

            {stats?.todayDeadlines.length === 0 ? (
              <div className="dashboard-empty">
                <Clock size={32} />
                <p>Nenhum prazo para hoje</p>
              </div>
            ) : (
              <div className="deadline-list">
                {stats?.todayDeadlines.map((d) => (
                  <DeadlineItem key={d.id} deadline={d} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-body">
            <div className="section-header">
              <div className="section-header-left">
                <AlertTriangle size={20} className="section-icon" />
                <h2 className="section-title">Próximos 7 Dias</h2>
              </div>
              <Link to="/prazos" className="section-action" id="dashboard-link-prazos-semana">
                Ver todos
              </Link>
            </div>

            {stats?.upcomingDeadlines.length === 0 ? (
              <div className="dashboard-empty">
                <Clock size={32} />
                <p>Nenhum prazo próximo</p>
              </div>
            ) : (
              <div className="deadline-list">
                {stats?.upcomingDeadlines.slice(0, 5).map((d) => (
                  <DeadlineItem key={d.id} deadline={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineItem({ deadline }: { deadline: Deadline }) {
  const urgency = getDeadlineUrgency(deadline.dueDate);
  const days = daysUntil(deadline.dueDate);

  const urgencyClass = {
    overdue: 'badge-danger',
    urgent: 'badge-danger',
    soon: 'badge-warning',
    normal: 'badge-info',
  }[urgency];

  const urgencyLabel = {
    overdue: 'Vencido',
    urgent: days === 0 ? 'Hoje' : `${days}d`,
    soon: `${days}d`,
    normal: `${days}d`,
  }[urgency];

  return (
    <div className="deadline-item">
      <div className="deadline-item-content">
        <span className="deadline-item-title">{deadline.title}</span>
        <span className="deadline-item-meta">
          {deadline.client?.fullName && `${deadline.client.fullName} · `}
          {formatDate(deadline.dueDate)}
        </span>
      </div>
      <span className={`badge ${urgencyClass}`}>{urgencyLabel}</span>
    </div>
  );
}
