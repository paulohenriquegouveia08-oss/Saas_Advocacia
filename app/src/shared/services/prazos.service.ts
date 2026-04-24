// ============================================
// Juris Gestão — Prazos Service
// ============================================

import { supabase } from './supabase';
import type { ApiResponse, Deadline } from '../types';

export const prazosService = {
  async list(organizationId: string, filters?: {
    status?: string;
    priority?: string;
    daysAhead?: number;
    clientId?: string;
  }): Promise<ApiResponse<Deadline[]>> {
    let query = supabase
      .from('Deadline')
      .select('*, client:Client(id, fullName), createdBy:User!createdById(id, name)', { count: 'exact' })
      .eq('organizationId', organizationId)
      .order('dueDate', { ascending: true });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.daysAhead) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.daysAhead);
      query = query.lte('dueDate', futureDate.toISOString());
      query = query.gte('dueDate', new Date().toISOString());
    }
    if (filters?.clientId) query = query.eq('clientId', filters.clientId);

    const { data, error, count } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as Deadline[], error: null, count: count ?? undefined };
  },

  async getById(id: string): Promise<ApiResponse<Deadline>> {
    const { data, error } = await supabase
      .from('Deadline')
      .select('*, client:Client(id, fullName), createdBy:User!createdById(id, name)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Deadline, error: null };
  },

  async create(payload: Omit<Deadline, 'id' | 'createdAt' | 'updatedAt' | 'client' | 'createdBy'>): Promise<ApiResponse<Deadline>> {
    const { data, error } = await supabase
      .from('Deadline')
      .insert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Deadline, error: null };
  },

  async update(id: string, payload: Partial<Deadline>): Promise<ApiResponse<Deadline>> {
    const { data, error } = await supabase
      .from('Deadline')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Deadline, error: null };
  },

  async remove(id: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('Deadline')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  },

  /** Prazos de hoje */
  async getToday(organizationId: string): Promise<ApiResponse<Deadline[]>> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('Deadline')
      .select('*, client:Client(id, fullName)')
      .eq('organizationId', organizationId)
      .gte('dueDate', startOfDay)
      .lt('dueDate', endOfDay)
      .order('dueDate', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as Deadline[], error: null };
  },
};
