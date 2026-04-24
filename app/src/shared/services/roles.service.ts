import { supabase } from './supabase';
import type { Role } from '../types';

export const rolesService = {
  /**
   * Lista todos os cargos da organização via RPC.
   */
  async listByOrganization(organizationId: string) {
    const { data, error } = await supabase.rpc('admin_list_roles', {
      p_org_id: organizationId
    });
      
    if (error) {
      console.error('rolesService.listByOrganization ERROR:', error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  },

  /**
   * Cria um novo cargo via RPC.
   */
  async create(roleData: Partial<Role> & { organizationId: string }) {
    const { data, error } = await supabase.rpc('admin_save_role', {
      p_role_id: null,
      p_name: roleData.name,
      p_is_admin: roleData.isAdmin,
      p_permissions: roleData.permissions,
      p_org_id: roleData.organizationId
    });

    if (error) {
      console.error('rolesService.create ERROR:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Atualiza um cargo existente via RPC.
   */
  async update(roleId: string, roleData: Partial<Role> & { organizationId?: string }) {
    // Para simplificar, passamos a origin orgId se estiver disponível, ou pegamos da sessão se necessário,
    // Mas o frontend já passa a orgId no create. Vamos assumir que orgId vem do backend ou não muda.
    // O ideal seria passar o orgId do roleData ou pegar o do Auth, mas no nosso caso o RPC cuida disso.
    // Wait, o RPC precisa de p_org_id. Como a interface update atual não passa orgId, vamos buscar.
    
    // Na verdade, no RolesPage.tsx não passamos organizationId pro update.
    // Vamos fazer o frontend passar. Vou usar any por enquanto pra compatibilidade.
    const orgId = roleData.organizationId || (await supabase.auth.getUser()).data.user?.user_metadata?.organizationId;
    
    // Como workaround se não tiver orgId no roleData, vamos falhar gracisomente.
    // Modificaremos o RolesPage.tsx para passar organizationId no update também.
    const { data, error } = await supabase.rpc('admin_save_role', {
      p_role_id: roleId,
      p_name: roleData.name,
      p_is_admin: roleData.isAdmin,
      p_permissions: roleData.permissions,
      p_org_id: roleData.organizationId // O frontend será atualizado para passar
    });

    if (error) {
      console.error('rolesService.update ERROR:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Deleta um cargo existente via RPC.
   */
  async delete(roleId: string, orgId: string) {
    const { error } = await supabase.rpc('admin_delete_role', {
      p_role_id: roleId,
      p_org_id: orgId
    });

    if (error) {
      console.error('rolesService.delete ERROR:', error);
      return { error: error.message };
    }

    return { error: null };
  }
};
