// ============================================
// Juris Gestão — Users Service (Admin Global)
// Consultas diretas ao Supabase (PK Fit Pro)
// ============================================

import { supabase } from './supabase';
import type { ApiResponse, User } from '../types';

export const usersService = {
  /** Listar todos os usuários da organização */
  async listByOrganization(organizationId: string): Promise<ApiResponse<User[]>> {
    const { data, error, count } = await supabase
      .from('User')
      .select('*, role:Role(*)', { count: 'exact' })
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as User[], error: null, count: count ?? undefined };
  },

  /** Buscar usuário por ID */
  async getById(userId: string): Promise<ApiResponse<User>> {
    const { data, error } = await supabase
      .from('User')
      .select('*, role:Role(*), organization:Organization(*)')
      .eq('id', userId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  },

  /** Criar novo usuário (via Supabase Auth Admin — requer Edge Function)
   *  No padrão SPA puro, esta ação precisa de uma Edge Function no Supabase
   *  que usa a service_role key para criar o auth user.
   *  Por ora, chamamos diretamente via supabase.functions.invoke.
   */
  async createUser(payload: {
    email: string;
    password: string;
    name: string;
    roleId: string;
    organizationId: string;
  }): Promise<ApiResponse<User>> {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: payload,
    });
    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  },

  /** Desativar/Ativar usuário */
  async toggleActive(userId: string, active: boolean): Promise<ApiResponse<User>> {
    const { data, error } = await supabase
      .from('User')
      .update({ active, updatedAt: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  },

  /** Atualizar role de um usuário */
  async updateRole(userId: string, roleId: string): Promise<ApiResponse<User>> {
    const { data, error } = await supabase
      .from('User')
      .update({ roleId, updatedAt: new Date().toISOString() })
      .eq('id', userId)
      .select('*, role:Role(*)')
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  },
};
