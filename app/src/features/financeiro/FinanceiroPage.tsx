// ============================================
// Juris Gestão — Financeiro Page (Redesenhado)
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
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
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

const INCOME_CATEGORIES = ['Honorários', 'Consulta', 'Acordo', 'Outros'];
const EXPENSE_CATEGORIES = ['Aluguel', 'Internet', 'Energia', 'Software/Assinaturas', 'Marketing', 'Custas judiciais', 'Outros'];
const PAYMENT_METHODS = ['Pix', 'Transferência', 'Dinheiro', 'Cartão'];

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
                  <th>Cliente / Beneficiário</th>
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
                    <td>
                      {t.type === 'INCOME' 
                        ? (t.client?.fullName || '—') 
                        : (t.beneficiary || '—')}
                    </td>
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

// ---- Transaction Form Modal (Redesenhado com 2 etapas) ----
type ModalStep = 'select-type' | 'form';

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
  const [step, setStep] = useState<ModalStep>(isEditing ? 'form' : 'select-type');
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
    paymentMethod: transaction?.paymentMethod ?? '',
    beneficiary: transaction?.beneficiary ?? '',
    notes: transaction?.notes ?? '',
  });

  useEffect(() => {
    clientesService.list(organizationId).then((res) => {
      if (res.data) setClientes(res.data);
    });
  }, [organizationId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectType = (type: TransactionType) => {
    setForm((prev) => ({ ...prev, type, category: '', clientId: '', beneficiary: '' }));
    setStep('form');
  };

  const categories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.dueDate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (form.type === 'INCOME' && !form.clientId) {
      toast.error('Selecione um cliente para a entrada');
      return;
    }
    setSaving(true);

    // Determinar status automático
    let finalStatus = form.status;
    if (form.paidDate) {
      finalStatus = 'PAID';
    } else if (form.dueDate) {
      const due = new Date(form.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today && finalStatus === 'PENDING') {
        finalStatus = 'OVERDUE';
      }
    }

    const payload = {
      type: form.type,
      status: finalStatus,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      category: form.category.trim() || null,
      dueDate: new Date(form.dueDate).toISOString(),
      paidDate: form.paidDate ? new Date(form.paidDate).toISOString() : null,
      clientId: form.clientId || null,
      beneficiary: form.beneficiary.trim() || null,
      paymentMethod: form.paymentMethod || null,
      notes: form.notes.trim() || null,
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
      <div className="modal-content modal-financeiro" onClick={(e) => e.stopPropagation()}>
        
        {/* ---- STEP 1: Selecionar Tipo ---- */}
        {step === 'select-type' && (
          <>
            <div className="modal-header">
              <h2>Nova Transação</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="fin-step-subtitle">Selecione o tipo de transação</p>
              <div className="fin-type-selector">
                <button
                  className="fin-type-card fin-type-income"
                  onClick={() => selectType('INCOME')}
                  type="button"
                >
                  <div className="fin-type-icon-wrapper fin-type-icon-income">
                    <ArrowDownLeft size={28} strokeWidth={2.5} />
                  </div>
                  <span className="fin-type-label">Entrada</span>
                  <span className="fin-type-desc">Recebimentos, honorários, acordos</span>
                </button>
                <button
                  className="fin-type-card fin-type-expense"
                  onClick={() => selectType('EXPENSE')}
                  type="button"
                >
                  <div className="fin-type-icon-wrapper fin-type-icon-expense">
                    <ArrowUpRight size={28} strokeWidth={2.5} />
                  </div>
                  <span className="fin-type-label">Saída</span>
                  <span className="fin-type-desc">Despesas, aluguel, custas</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---- STEP 2: Formulário Dinâmico ---- */}
        {step === 'form' && (
          <>
            <div className="modal-header">
              <div className="fin-form-header-left">
                {!isEditing && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setStep('select-type')}
                    type="button"
                    title="Voltar"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <h2>
                    {isEditing
                      ? 'Editar Transação'
                      : form.type === 'INCOME'
                        ? '💰 Nova Entrada'
                        : '💸 Nova Saída'}
                  </h2>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
                <X size={18} />
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSubmit} id="transaction-form">
              <div className="modal-form-grid">

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Atrasado</option>
                  </select>
                </div>

                {/* Categoria */}
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div className="form-group modal-full-width">
                  <label className="form-label">Descrição *</label>
                  <input
                    className="form-input"
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder={form.type === 'INCOME' ? 'Ex: Honorários - Processo #123' : 'Ex: Aluguel do escritório - Maio'}
                    required
                  />
                </div>

                {/* Valor */}
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

                {/* Forma de Pagamento */}
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select
                    className="form-input"
                    value={form.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Data de Vencimento */}
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

                {/* Data de Pagamento */}
                <div className="form-group">
                  <label className="form-label">Data de Pagamento</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.paidDate}
                    onChange={(e) => handleChange('paidDate', e.target.value)}
                  />
                </div>

                {/* Cliente (somente Entrada) */}
                {form.type === 'INCOME' && (
                  <div className="form-group modal-full-width">
                    <label className="form-label">Cliente *</label>
                    <select
                      className="form-input"
                      value={form.clientId}
                      onChange={(e) => handleChange('clientId', e.target.value)}
                      required
                    >
                      <option value="">Selecione o cliente...</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Beneficiário (somente Saída) */}
                {form.type === 'EXPENSE' && (
                  <div className="form-group modal-full-width">
                    <label className="form-label">Beneficiário</label>
                    <input
                      className="form-input"
                      value={form.beneficiary}
                      onChange={(e) => handleChange('beneficiary', e.target.value)}
                      placeholder="Quem recebeu o pagamento?"
                    />
                  </div>
                )}

                {/* Observações */}
                <div className="form-group modal-full-width">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="form-input"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Informações adicionais (opcional)"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
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
          </>
        )}
      </div>
    </div>
  );
}
