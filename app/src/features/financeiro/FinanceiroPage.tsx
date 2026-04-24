// ============================================
// Juris Gestão — Financeiro Page
// ============================================

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { financeiroService } from '@/shared/services/financeiro.service';
import { clientesService } from '@/shared/services/clientes.service';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import type { FinancialTransaction, Client, TransactionType, TransactionStatus } from '@/shared/types';
import toast from 'react-hot-toast';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Filter,
  X,
  Edit3,
  Trash2,
  CircleDollarSign,
} from 'lucide-react';
import './financeiro.css';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  OVERDUE: 'badge-danger',
  CANCELLED: 'badge-neutral',
};

export default function FinanceiroPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(!!orgId);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadData = async () => {
    if (!orgId) return;
    const res = await financeiroService.list(orgId, {
      type: filterType ? (filterType as 'INCOME' | 'EXPENSE') : undefined,
      status: filterStatus || undefined,
    });
    if (res.data) setTransactions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    financeiroService.list(orgId, {
      type: filterType ? (filterType as 'INCOME' | 'EXPENSE') : undefined,
      status: filterStatus || undefined,
    }).then((res) => {
      if (!cancelled) {
        if (res.data) setTransactions(res.data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId, filterType, filterStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return;
    const res = await financeiroService.remove(id);
    if (res.error) toast.error('Erro ao excluir');
    else {
      toast.success('Transação excluída');
      loadData();
    }
  };

  const handleModalClose = (reload?: boolean) => {
    setShowModal(false);
    setEditingTx(null);
    if (reload) loadData();
  };

  // Calculate totals from current filter
  const totals = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return (
    <div className="financeiro-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Fluxo de caixa e controle financeiro</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingTx(null); setShowModal(true); }}
          id="create-transaction-btn"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* Summary Cards */}
      <div className="fin-summary">
        <div className="fin-summary-card fin-income">
          <TrendingUp size={20} />
          <div>
            <span className="fin-summary-label">Entradas</span>
            <span className="fin-summary-value">{formatCurrency(totals.income)}</span>
          </div>
        </div>
        <div className="fin-summary-card fin-expense">
          <TrendingDown size={20} />
          <div>
            <span className="fin-summary-label">Saídas</span>
            <span className="fin-summary-value">{formatCurrency(totals.expense)}</span>
          </div>
        </div>
        <div className={`fin-summary-card ${totals.income - totals.expense >= 0 ? 'fin-positive' : 'fin-negative'}`}>
          <Wallet size={20} />
          <div>
            <span className="fin-summary-label">Saldo</span>
            <span className="fin-summary-value">{formatCurrency(totals.income - totals.expense)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="fin-filters">
        <Filter size={16} />
        <select
          className="form-input fin-filter-select"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setLoading(true); }}
          id="filter-type"
        >
          <option value="">Todos os tipos</option>
          <option value="INCOME">Entradas</option>
          <option value="EXPENSE">Saídas</option>
        </select>
        <select
          className="form-input fin-filter-select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setLoading(true); }}
          id="filter-status"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="OVERDUE">Vencido</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><div className="spinner spinner-lg" /></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <CircleDollarSign size={64} />
          <h3>Nenhuma transação encontrada</h3>
          <p>Registre entradas e saídas para controlar o fluxo de caixa do escritório.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className={`badge ${t.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                        {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td>
                      <span className="client-name">{t.description}</span>
                      {t.category && <span className="tx-category">{t.category}</span>}
                    </td>
                    <td>{t.client?.fullName ?? '—'}</td>
                    <td className={t.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                    </td>
                    <td>{formatDate(t.dueDate)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditingTx(t); setShowModal(true); }}
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(t.id)}
                          title="Excluir"
                          style={{ color: 'var(--color-danger-500)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <TransacaoFormModal
          transaction={editingTx}
          organizationId={orgId!}
          userId={user!.id}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

// ---- Transaction Form Modal ----
function TransacaoFormModal({
  transaction,
  organizationId,
  userId,
  onClose,
}: {
  transaction: FinancialTransaction | null;
  organizationId: string;
  userId: string;
  onClose: (reload?: boolean) => void;
}) {
  const isEditing = !!transaction;
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [form, setForm] = useState({
    type: (transaction?.type ?? 'INCOME') as TransactionType,
    status: (transaction?.status ?? 'PENDING') as TransactionStatus,
    amount: transaction?.amount?.toString() ?? '',
    description: transaction?.description ?? '',
    category: transaction?.category ?? '',
    dueDate: transaction?.dueDate?.split('T')[0] ?? '',
    paidDate: transaction?.paidDate?.split('T')[0] ?? '',
    clientId: transaction?.clientId ?? '',
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
    if (!form.description.trim() || !form.amount || !form.dueDate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setSaving(true);

    const payload = {
      type: form.type,
      status: form.status,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      category: form.category.trim() || null,
      dueDate: new Date(form.dueDate).toISOString(),
      paidDate: form.paidDate ? new Date(form.paidDate).toISOString() : null,
      clientId: form.clientId || null,
      organizationId,
      createdById: userId,
    };

    const res = isEditing
      ? await financeiroService.update(transaction!.id, payload)
      : await financeiroService.create(payload);

    if (res.error) toast.error(res.error);
    else {
      toast.success(isEditing ? 'Transação atualizada!' : 'Transação registrada!');
      onClose(true);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} id="transaction-form">
          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select
                className="form-input"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="INCOME">Entrada (Receita)</option>
                <option value="EXPENSE">Saída (Despesa)</option>
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
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Vencido</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="form-group modal-full-width">
              <label className="form-label">Descrição *</label>
              <input
                className="form-input"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Ex: Honorários advocatícios - Processo #123"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Ex: Honorários, Aluguel..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vencimento *</label>
              <input
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Pagamento</label>
              <input
                className="form-input"
                type="date"
                value={form.paidDate}
                onChange={(e) => handleChange('paidDate', e.target.value)}
              />
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
          </div>
        </form>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onClose()}>Cancelar</button>
          <button
            className="btn btn-primary"
            form="transaction-form"
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : isEditing ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
