// ============================================
// Juris Gestão — Client Dashboard Page
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { prazosService } from '@/shared/services/prazos.service';
import type { Deadline } from '@/shared/types';
import { LogOut, Calendar, Clock, CheckCircle, Scale, Wallet, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './clientPortal.css';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  COMPLETED: 'badge-success',
  OVERDUE: 'badge-danger',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  OVERDUE: 'Atrasado',
};

export default function ClientDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    if (user.organizationId && user.clientId) {
      prazosService.list(user.organizationId, { clientId: user.clientId }).then((res) => {
        if (res.data) setDeadlines(res.data);
        setLoading(false);
      });
    } else {
      // Avoid synchronous setState in effect body
      Promise.resolve().then(() => setLoading(false));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const pendingDeadlines = deadlines.filter(d => d.status === 'PENDING').length;
  const completedDeadlines = deadlines.filter(d => d.status === 'COMPLETED').length;

  return (
    <div className="client-portal-layout">
      {/* Header Simplificado */}
      <header className="client-header">
        <div className="client-header-container">
          <div className="client-logo">
            <Scale size={28} className="text-primary-600" />
            <span className="font-bold text-xl">Portal do Cliente</span>
          </div>
          <div className="client-user-menu">
            <span className="client-greeting">Olá, {user?.name?.split(' ')[0]}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut} title="Sair">
              <LogOut size={18} />
              <span className="hide-mobile">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="client-main-content animate-fade-in">
        <div className="client-welcome-section">
          <h1>Acompanhe seu processo</h1>
          <p>Veja o andamento dos seus prazos e futuras atualizações.</p>
        </div>

        {/* Resumo de Prazos */}
        <div className="client-summary-cards">
          <div className="client-card">
            <div className="client-card-icon bg-warning-light text-warning-700">
              <Clock size={24} />
            </div>
            <div className="client-card-content">
              <h3>{pendingDeadlines}</h3>
              <p>Prazos Pendentes</p>
            </div>
          </div>
          <div className="client-card">
            <div className="client-card-icon bg-success-light text-success-700">
              <CheckCircle size={24} />
            </div>
            <div className="client-card-content">
              <h3>{completedDeadlines}</h3>
              <p>Prazos Concluídos</p>
            </div>
          </div>
        </div>

        {/* Lista de Prazos */}
        <div className="client-section">
          <div className="client-section-header">
            <Calendar size={20} />
            <h2>Meus Prazos e Andamentos</h2>
          </div>
          
          <div className="client-card-container">
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : deadlines.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <h3>Nenhum prazo registrado</h3>
                <p>Assim que houver novidades sobre o seu caso, elas aparecerão aqui.</p>
              </div>
            ) : (
              <div className="deadlines-list">
                {deadlines.map((d) => (
                  <div key={d.id} className="deadline-item">
                    <div className="deadline-date">
                      <span className="date-day">{d.dueDate.split('-')[2].substring(0, 2)}</span>
                      <span className="date-month">
                        {new Date(d.dueDate).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="deadline-info">
                      <h4>{d.title}</h4>
                      {d.processNumber && <span className="process-number">Processo: {d.processNumber}</span>}
                      {d.description && <p className="deadline-desc">{d.description}</p>}
                    </div>
                    <div className="deadline-badges">
                      <span className={`badge ${STATUS_BADGE[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área Futura: Pagamentos (Mock) */}
        <div className="client-section mt-8 opacity-60">
          <div className="client-section-header">
            <Wallet size={20} />
            <h2>Meus Pagamentos (Em Breve)</h2>
          </div>
          <div className="client-card-container">
            <div className="empty-state p-6">
              <p>Em futuras atualizações, você poderá visualizar e gerenciar seus pagamentos por aqui.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
