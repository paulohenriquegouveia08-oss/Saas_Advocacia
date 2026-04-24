// ============================================
// Juris Gestão — Clientes Service
// ============================================

import { supabase } from './supabase';
import type { ApiResponse, Client } from '../types';

export const clientesService = {
  async list(organizationId: string): Promise<ApiResponse<Client[]>> {
    const { data, error, count } = await supabase
      .from('Client')
      .select('*', { count: 'exact' })
      .eq('organizationId', organizationId)
      .order('fullName', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as Client[], error: null, count: count ?? undefined };
  },

  async getById(clientId: string): Promise<ApiResponse<Client>> {
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Client, error: null };
  },

  async create(payload: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Client>> {
    try {
      // 1. Cria o cliente primeiro
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert(payload)
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);
      if (!clientData) throw new Error('Erro ao criar cliente');

      // 2. Se tiver email, cria o acesso de usuário via RPC
      if (payload.email) {
        const { error: rpcError } = await supabase.rpc('admin_create_client_user', {
          p_email: payload.email,
          p_name: payload.fullName,
          p_org_id: payload.organizationId,
          p_client_id: clientData.id
        });

        if (rpcError) {
          console.error('Erro ao criar usuário de acesso do cliente:', rpcError);
          // Retornamos o clientData mesmo assim, pois o cliente em si foi criado
        }
      }

      return { data: clientData as Client, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  },

  async update(clientId: string, payload: Partial<Client>): Promise<ApiResponse<Client>> {
    const { data, error } = await supabase
      .from('Client')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', clientId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Client, error: null };
  },

  async remove(clientId: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('Client')
      .delete()
      .eq('id', clientId);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  },

  async search(organizationId: string, query: string): Promise<ApiResponse<Client[]>> {
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .eq('organizationId', organizationId)
      .or(`fullName.ilike.%${query}%,cpf.ilike.%${query}%,email.ilike.%${query}%`)
      .order('fullName', { ascending: true })
      .limit(50);

    if (error) return { data: null, error: error.message };
    return { data: data as Client[], error: null };
  },
};
