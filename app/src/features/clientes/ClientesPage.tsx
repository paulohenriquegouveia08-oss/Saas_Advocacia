// ============================================
// Juris Gestão — Clientes Page
// ============================================

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { clientesService } from '@/shared/services/clientes.service';
import { formatCPF, formatPhone, formatDate, getWhatsAppLink } from '@/shared/utils/formatters';
import type { Client } from '@/shared/types';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  X,
  Edit3,
  Trash2,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import './clientes.css';

export default function ClientesPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  const [clientes, setClientes] = useState<Client[]>([]);
  const [loading, setLoading] = useState(!!orgId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const loadClientes = async () => {
    if (!orgId) return;
    const res = searchQuery
      ? await clientesService.search(orgId, searchQuery)
      : await clientesService.list(orgId);
    if (res.data) setClientes(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      const fetchPromise = searchQuery
        ? clientesService.search(orgId, searchQuery)
        : clientesService.list(orgId);

      fetchPromise.then((res) => {
        if (!cancelled) {
          if (res.data) setClientes(res.data);
          setLoading(false);
        }
      });
    }, searchQuery ? 300 : 0);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [orgId, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) return;
    const res = await clientesService.remove(id);
    if (res.error) {
      toast.error('Erro ao excluir cliente');
    } else {
      toast.success('Cliente excluído');
      loadClientes();
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleModalClose = (reload?: boolean) => {
    setShowModal(false);
    setEditingClient(null);
    if (reload) loadClientes();
  };

  return (
    <div className="clientes-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie seus clientes e contatos jurídicos</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-client-btn">
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-input search-input"
          placeholder="Buscar por nome, CPF ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-clientes-input"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h3>Nenhum cliente encontrado</h3>
          <p>Comece cadastrando seu primeiro cliente para gerenciar processos e prazos.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={18} />
            Cadastrar Cliente
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Cadastrado em</th>
                  <th style={{ width: 120 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="client-name">{c.fullName}</span>
                    </td>
                    <td>{formatCPF(c.cpf)}</td>
                    <td>
                      <div className="client-phone-cell">
                        {formatPhone(c.phone)}
                        {c.phone && (
                          <a
                            href={getWhatsAppLink(c.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-link"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>{c.email ?? '—'}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(c)}
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(c.id, c.fullName)}
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

      {/* Modal */}
      {showModal && (
        <ClientFormModal
          client={editingClient}
          organizationId={orgId!}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

// ---- Client Form Modal ----
function ClientFormModal({
  client,
  organizationId,
  onClose,
}: {
  client: Client | null;
  organizationId: string;
  onClose: (reload?: boolean) => void;
}) {
  const isEditing = !!client;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: client?.fullName ?? '',
    cpf: client?.cpf ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    birthDate: client?.birthDate?.split('T')[0] ?? '',
    notes: client?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    setSaving(true);

    const payload = {
      fullName: form.fullName.trim(),
      cpf: form.cpf.replace(/\D/g, '') || null,
      phone: form.phone.replace(/\D/g, '') || null,
      email: form.email.trim() || null,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
      notes: form.notes.trim() || null,
      organizationId,
    };

    const res = isEditing
      ? await clientesService.update(client!.id, payload)
      : await clientesService.create(payload);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(isEditing ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      onClose(true);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} id="client-form">
          <div className="modal-form-grid">
            <div className="form-group modal-full-width">
              <label className="form-label">Nome Completo *</label>
              <input
                className="form-input"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CPF</label>
              <input
                className="form-input"
                value={form.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <div className="input-icon-wrapper">
                <Phone size={16} className="input-inline-icon" />
                <input
                  className="form-input input-with-icon"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-inline-icon" />
                <input
                  className="form-input input-with-icon"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <input
                className="form-input"
                type="date"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
              />
            </div>

            <div className="form-group modal-full-width">
              <label className="form-label">Observações</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Anotações sobre o cliente..."
              />
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onClose()} type="button">
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            form="client-form"
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : isEditing ? (
              'Salvar Alterações'
            ) : (
              'Cadastrar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
