// ============================================
// Juris Gestão — Admin Global: Roles Page
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { rolesService } from '@/shared/services/roles.service';
import { formatDate } from '@/shared/utils/formatters';
import type { Role, RolePermissions } from '@/shared/types';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Lock,
  Trash2,
  Edit2
} from 'lucide-react';
import './admin.css';

export default function RolesPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(!!orgId);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [perms, setPerms] = useState({
    canAccessClientes: false,
    canAccessFinanceiro: false,
    canAccessPrazos: false,
  });

  const loadData = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const { data } = await rolesService.listByOrganization(orgId);
    if (data) setRoles(data as Role[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    rolesService.listByOrganization(orgId).then(({ data }) => {
      if (!cancelled) {
        if (data) setRoles(data as Role[]);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [orgId]);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setIsAdminRole(role.isAdmin);
      const p: RolePermissions = (role.permissions as RolePermissions) || {};
      setPerms({
        canAccessClientes: !!p.canAccessClientes,
        canAccessFinanceiro: !!p.canAccessFinanceiro,
        canAccessPrazos: !!p.canAccessPrazos,
      });
    } else {
      setEditingRole(null);
      setRoleName('');
      setIsAdminRole(false);
      setPerms({
        canAccessClientes: false,
        canAccessFinanceiro: false,
        canAccessPrazos: false,
      });
    }
    setShowModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !orgId) return;

    setIsSaving(true);
    const roleData = {
      name: roleName,
      isAdmin: isAdminRole,
      permissions: isAdminRole ? {} : perms,
    };

    if (editingRole) {
      const { error } = await rolesService.update(editingRole.id, {
        ...roleData,
        organizationId: orgId,
      });
      if (error) {
        toast.error('Erro ao atualizar cargo: ' + error);
      } else {
        toast.success('Cargo atualizado com sucesso!');
        setShowModal(false);
        loadData();
      }
    } else {
      const { error } = await rolesService.create({
        ...roleData,
        organizationId: orgId,
      });
      if (error) {
        toast.error('Erro ao criar cargo: ' + error);
      } else {
        toast.success('Cargo criado com sucesso!');
        setShowModal(false);
        loadData();
      }
    }
    setIsSaving(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!orgId) return;
    if (!window.confirm('Tem certeza que deseja excluir este cargo? Usuários com este cargo podem perder o acesso.')) return;
    
    const { error } = await rolesService.delete(roleId, orgId);
    if (error) {
      toast.error('Erro ao excluir cargo. Verifique se existem usuários vinculados.');
    } else {
      toast.success('Cargo excluído com sucesso.');
      loadData();
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
          <h1>Gestão de Cargos</h1>
          <p className="page-subtitle">Crie perfis de acesso e defina as permissões de cada cargo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <ShieldCheck size={18} className="mr-2" />
          Novo Cargo
        </button>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
          <span>Carregando cargos...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="empty-state">
          <Lock size={64} />
          <h3>Nenhum cargo encontrado</h3>
          <p>Crie cargos para controlar o que os usuários podem acessar no sistema.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Cargo</th>
                  <th>Nível de Acesso</th>
                  <th>Módulos Permitidos</th>
                  <th>Cadastrado em</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const p: RolePermissions = (r.permissions as RolePermissions) || {};
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>
                        {r.isAdmin ? (
                          <span className="badge badge-primary">Admin Global</span>
                        ) : (
                          <span className="badge badge-neutral">Acesso Limitado</span>
                        )}
                      </td>
                      <td>
                        {r.isAdmin ? (
                          <span className="text-sm text-gray-500 italic">Acesso Total</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {p.canAccessClientes && <span className="badge badge-info text-xs">Clientes</span>}
                            {p.canAccessFinanceiro && <span className="badge badge-warning text-xs">Financeiro</span>}
                            {p.canAccessPrazos && <span className="badge badge-success text-xs">Prazos</span>}
                            {!p.canAccessClientes && !p.canAccessFinanceiro && !p.canAccessPrazos && (
                              <span className="text-sm text-gray-400 italic">Apenas leitura básica</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenModal(r)}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteRole(r.id)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editingRole ? 'Editar Cargo' : 'Adicionar Novo Cargo'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRole} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome do Cargo</label>
                <input
                  type="text"
                  className="form-input"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ex: Advogado Associado"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={isAdminRole}
                      onChange={(e) => setIsAdminRole(e.target.checked)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${isAdminRole ? 'bg-primary' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAdminRole ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-800">É Administrador Global?</span>
                    <span className="text-xs text-gray-500 block">Dá acesso total a todos os recursos do sistema.</span>
                  </div>
                </label>
              </div>

              {!isAdminRole && (
                <div className="permissions-section">
                  <label className="form-label mb-3 block">Módulos de Acesso</label>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary rounded"
                        checked={perms.canAccessClientes}
                        onChange={(e) => setPerms({...perms, canAccessClientes: e.target.checked})}
                      />
                      <div>
                        <span className="font-medium block text-gray-800">Gestão de Clientes</span>
                        <span className="text-xs text-gray-500 block">Permite visualizar, adicionar e editar clientes.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary rounded"
                        checked={perms.canAccessFinanceiro}
                        onChange={(e) => setPerms({...perms, canAccessFinanceiro: e.target.checked})}
                      />
                      <div>
                        <span className="font-medium block text-gray-800">Financeiro</span>
                        <span className="text-xs text-gray-500 block">Acesso ao fluxo de caixa, pagamentos e recebimentos.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary rounded"
                        checked={perms.canAccessPrazos}
                        onChange={(e) => setPerms({...perms, canAccessPrazos: e.target.checked})}
                      />
                      <div>
                        <span className="font-medium block text-gray-800">Prazos e Agenda</span>
                        <span className="text-xs text-gray-500 block">Controle e visualização de todos os prazos judiciais.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="modal-footer mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Cargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
