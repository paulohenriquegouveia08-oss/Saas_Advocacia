// ============================================
// Juris Gestão — Admin Global: Users Page
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { usersService } from '@/shared/services/users.service';
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
      supabase.from('Role').select('*').eq('organizationId', orgId),
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
      supabase.from('Role').select('*').eq('organizationId', orgId),
    ]).then(([usersRes, rolesRes]) => {
      if (!cancelled) {
        if (usersRes.data) setUsers(usersRes.data);
        if (rolesRes.data) setRoles(rolesRes.data as Role[]);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId]);

  const handleToggleActive = async (u: User) => {
    const res = await usersService.toggleActive(u.id, !u.active);
    if (res.error) toast.error('Erro ao alterar status');
    else {
      toast.success(u.active ? 'Usuário desativado' : 'Usuário ativado');
      loadData();
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    const res = await usersService.updateRole(userId, roleId);
    if (res.error) toast.error('Erro ao alterar cargo');
    else {
      toast.success('Cargo atualizado!');
      loadData();
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciar Usuários</h1>
          <p className="page-subtitle">Controle de acesso e permissões do escritório</p>
        </div>
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
    </div>
  );
}
