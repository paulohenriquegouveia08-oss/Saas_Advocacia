// ============================================
// Juris Gestão — Prazos Page
// ============================================

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { prazosService } from '@/shared/services/prazos.service';
import { clientesService } from '@/shared/services/clientes.service';
import { formatDate, daysUntil, getDeadlineUrgency } from '@/shared/utils/formatters';
import type { Deadline, Client, DeadlinePriority, DeadlineStatus } from '@/shared/types';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  Plus,
  Filter,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import './prazos.css';

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  URGENT: 'badge-danger',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  OVERDUE: 'Vencido',
};

export default function PrazosPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(!!orgId);
  const [showModal, setShowModal] = useState(false);
  const [editingPrazo, setEditingPrazo] = useState<Deadline | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterDays, setFilterDays] = useState<string>('');

  const loadData = async () => {
    if (!orgId) return;
    const res = await prazosService.list(orgId, {
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
      daysAhead: filterDays ? parseInt(filterDays) : undefined,
    });
    if (res.data) setDeadlines(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    prazosService.list(orgId, {
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
      daysAhead: filterDays ? parseInt(filterDays) : undefined,
    }).then((res) => {
      if (!cancelled) {
        if (res.data) setDeadlines(res.data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId, filterStatus, filterPriority, filterDays]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este prazo?')) return;
    const res = await prazosService.remove(id);
    if (res.error) toast.error('Erro ao excluir');
    else {
      toast.success('Prazo excluído');
      loadData();
    }
  };

  const handleComplete = async (id: string) => {
    const res = await prazosService.update(id, { status: 'COMPLETED' as DeadlineStatus });
    if (res.error) toast.error('Erro ao concluir');
    else {
      toast.success('Prazo concluído!');
      loadData();
    }
  };

  const handleModalClose = (reload?: boolean) => {
    setShowModal(false);
    setEditingPrazo(null);
    if (reload) loadData();
  };

  return (
    <div className="prazos-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prazos</h1>
          <p className="page-subtitle">Controle de prazos e processos jurídicos</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingPrazo(null); setShowModal(true); }}
          id="create-prazo-btn"
        >
          <Plus size={18} />
          Novo Prazo
        </button>
      </div>

      {/* Filters */}
      <div className="fin-filters">
        <Filter size={16} />
        <select
          className="form-input fin-filter-select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setLoading(true); }}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="COMPLETED">Concluído</option>
          <option value="OVERDUE">Vencido</option>
        </select>
        <select
          className="form-input fin-filter-select"
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setLoading(true); }}
        >
          <option value="">Todas as prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
        <select
          className="form-input fin-filter-select"
          value={filterDays}
          onChange={(e) => { setFilterDays(e.target.value); setLoading(true); }}
        >
          <option value="">Todos os períodos</option>
          <option value="7">Próximos 7 dias</option>
          <option value="15">Próximos 15 dias</option>
          <option value="30">Próximos 30 dias</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="page-loader"><div className="spinner spinner-lg" /></div>
      ) : deadlines.length === 0 ? (
        <div className="empty-state">
          <CalendarClock size={64} />
          <h3>Nenhum prazo encontrado</h3>
          <p>Cadastre prazos para acompanhar processos e vencimentos.</p>
        </div>
      ) : (
        <div className="prazos-list">
          {deadlines.map((d) => {
            const urgency = getDeadlineUrgency(d.dueDate);
            const days = daysUntil(d.dueDate);
            const isCompleted = d.status === 'COMPLETED';

            return (
              <div
                key={d.id}
                className={`prazo-card card ${isCompleted ? 'prazo-completed' : ''} ${urgency === 'overdue' && !isCompleted ? 'prazo-overdue' : ''}`}
              >
                <div className="card-body">
                  <div className="prazo-card-header">
                    <div className="prazo-card-left">
                      <div className={`prazo-urgency-dot prazo-urgency-${urgency}`} />
                      <div>
                        <h3 className="prazo-title">{d.title}</h3>
                        {d.processNumber && (
                          <span className="prazo-process">
                            <FileText size={12} />
                            {d.processNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="prazo-card-actions">
                      {!isCompleted && (
                        <button
                          className="btn btn-ghost btn-sm prazo-complete-btn"
                          onClick={() => handleComplete(d.id)}
                          title="Marcar como concluído"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEditingPrazo(d); setShowModal(true); }}
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(d.id)}
                        title="Excluir"
                        style={{ color: 'var(--color-danger-500)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {d.description && (
                    <p className="prazo-description">{d.description}</p>
                  )}

                  <div className="prazo-card-footer">
                    <div className="prazo-meta">
                      <span className={`badge ${PRIORITY_BADGE[d.priority]}`}>
                        {PRIORITY_LABELS[d.priority]}
                      </span>
                      <span className={`badge ${d.status === 'COMPLETED' ? 'badge-success' : d.status === 'OVERDUE' ? 'badge-danger' : 'badge-neutral'}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                      {d.client?.fullName && (
                        <span className="prazo-client-badge">{d.client.fullName}</span>
                      )}
                    </div>
                    <div className="prazo-date-info">
                      <Clock size={14} />
                      <span>{formatDate(d.dueDate)}</span>
                      {!isCompleted && (
                        <span className={`prazo-days prazo-days-${urgency}`}>
                          {days < 0
                            ? `${Math.abs(days)}d atrasado`
                            : days === 0
                            ? 'Hoje!'
                            : `${days}d restantes`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PrazoFormModal
          prazo={editingPrazo}
          organizationId={orgId!}
          userId={user!.id}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

// ---- Prazo Form Modal ----
function PrazoFormModal({
  prazo,
  organizationId,
  userId,
  onClose,
}: {
  prazo: Deadline | null;
  organizationId: string;
  userId: string;
  onClose: (reload?: boolean) => void;
}) {
  const isEditing = !!prazo;
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [form, setForm] = useState({
    title: prazo?.title ?? '',
    processNumber: prazo?.processNumber ?? '',
    description: prazo?.description ?? '',
    dueDate: prazo?.dueDate?.split('T')[0] ?? '',
    priority: (prazo?.priority ?? 'MEDIUM') as DeadlinePriority,
    status: (prazo?.status ?? 'PENDING') as DeadlineStatus,
    clientId: prazo?.clientId ?? '',
  });

  useEffect(() => {
    clientesService.list(organizationId).then((res) => {
      if (res.data) setClientes(res.data);
    });
  }, [organizationId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) {
      toast.error('Preencha título e data de vencimento');
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      processNumber: form.processNumber.trim() || null,
      description: form.description.trim() || null,
      dueDate: new Date(form.dueDate).toISOString(),
      priority: form.priority,
      status: form.status,
      clientId: form.clientId || null,
      organizationId,
      createdById: userId,
    };

    const res = isEditing
      ? await prazosService.update(prazo!.id, payload)
      : await prazosService.create(payload);

    if (res.error) toast.error(res.error);
    else {
      toast.success(isEditing ? 'Prazo atualizado!' : 'Prazo cadastrado!');
      onClose(true);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Prazo' : 'Novo Prazo'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} id="prazo-form">
          <div className="modal-form-grid">
            <div className="form-group modal-full-width">
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Audiência Trabalhista"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nº do Processo</label>
              <input
                className="form-input"
                value={form.processNumber}
                onChange={(e) => handleChange('processNumber', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Vencimento *</label>
              <input
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prioridade</label>
              <select
                className="form-input"
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="PENDING">Pendente</option>
                <option value="COMPLETED">Concluído</option>
                <option value="OVERDUE">Vencido</option>
              </select>
            </div>

            <div className="form-group modal-full-width">
              <label className="form-label">Cliente Vinculado</label>
              <select
                className="form-input"
                value={form.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
              >
                <option value="">Nenhum</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>

            <div className="form-group modal-full-width">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detalhes do prazo..."
              />
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onClose()}>Cancelar</button>
          <button
            className="btn btn-primary"
            form="prazo-form"
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : isEditing ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
