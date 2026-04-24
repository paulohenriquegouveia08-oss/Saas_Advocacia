// ============================================
// Juris Gestão — Admin Global: Users Page
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { usersService } from '@/shared/services/users.service';
import { rolesService } from '@/shared/services/roles.service';
import { supabase } from '@/shared/services/supabase';
import { formatDate } from '@/shared/utils/formatters';
import type { User, Role } from '@/shared/types';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';
import './admin.css';

export default function UsersPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!orgId) return;

    const [usersRes, rolesRes] = await Promise.all([
      usersService.listByOrganization(orgId),
      rolesService.listByOrganization(orgId),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as Role[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    Promise.all([
      usersService.listByOrganization(orgId),
      rolesService.listByOrganization(orgId),
    ]).then(([usersRes, rolesRes]) => {
      if (!cancelled) {
        if (usersRes.data) setUsers(usersRes.data);
        if (rolesRes.data) setRoles(rolesRes.data as Role[]);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId]);

  const [showModal, setShowModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleActive = async (u: User) => {
    const res = await usersService.toggleActive(u.id, !u.active);
    if (res.error) toast.error('Erro ao alterar status');
    else loadData();
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    const res = await usersService.updateRole(userId, roleId || null);
    if (res.error) toast.error('Erro ao alterar cargo');
    else {
      toast.success('Cargo atualizado');
      loadData();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserRole || !orgId) return;

    setIsCreating(true);

    try {
      // Importação dinâmica do admin client
      const { supabaseAdmin } = await import('@/shared/services/supabase');
      if (!supabaseAdmin) throw new Error('Service Role Key não configurada.');

      // 1. Criar o usuário via API Admin oficial do Supabase (GoTrue)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newUserEmail,
        password: '123456', // Senha temporária, será trocada no primeiro acesso
        email_confirm: true,
        user_metadata: { full_name: newUserName },
      });

      if (authError) throw new Error(authError.message);
      if (!authData?.user?.id) throw new Error('Falha ao criar conta de autenticação.');

      // 2. Registrar na tabela pública via RPC segura
      const { error: regError } = await supabase.rpc('admin_register_user', {
        p_auth_user_id: authData.user.id,
        p_email: newUserEmail,
        p_name: newUserName,
        p_role_id: newUserRole,
        p_org_id: orgId,
      });

      if (regError) throw new Error(regError.message);

      toast.success('Usuário criado com sucesso! Ele já pode acessar o sistema.');
      setShowModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('');
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao criar usuário: ' + message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <div>
          <div className="admin-title-badge">
            <ShieldCheck size={18} />
            Administração Global
          </div>
          <h1>Gestão de Usuários</h1>
          <p className="page-subtitle">Gerencie os acessos, cargos e permissões do sistema.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Users size={18} className="mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Info Banner */}
      <div className="admin-info-banner">
        <ShieldCheck size={20} />
        <div>
          <strong>Painel Administrativo</strong>
          <p>
            Gerencie os usuários do escritório. Para criar novos usuários, é necessário
            configurar uma Edge Function no Supabase que utiliza a <code>service_role_key</code>.
          </p>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="page-loader"><div className="spinner spinner-lg" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h3>Nenhum usuário encontrado</h3>
          <p>Os usuários aparecerão aqui após se registrarem no sistema.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th>Cadastrado em</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="client-name">{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="form-input admin-role-select"
                        value={u.roleId ?? ''}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                      >
                        <option value="">Sem cargo</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.isAdmin ? '👑 ' : ''}{r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <button
                        className={`btn btn-ghost btn-sm admin-toggle-btn ${u.active ? '' : 'admin-toggle-off'}`}
                        onClick={() => handleToggleActive(u)}
                        title={u.active ? 'Desativar' : 'Ativar'}
                        disabled={u.id === user?.id}
                      >
                        {u.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale">
            <div className="modal-header">
              <h3>Adicionar Novo Usuário</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="joao@advocacia.com.br"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo Inicial</label>
                <select
                  className="form-input"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione um cargo...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isCreating}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
