// ============================================
// Juris Gestão — Financeiro Service
// ============================================

import { supabase } from './supabase';
import type { ApiResponse, FinancialTransaction } from '../types';

export const financeiroService = {
  async list(organizationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'INCOME' | 'EXPENSE';
    status?: string;
  }): Promise<ApiResponse<FinancialTransaction[]>> {
    let query = supabase
      .from('FinancialTransaction')
      .select('*, client:Client(id, fullName), createdBy:User!createdById(id, name)', { count: 'exact' })
      .eq('organizationId', organizationId)
      .order('dueDate', { ascending: false });

    if (filters?.startDate) query = query.gte('dueDate', filters.startDate);
    if (filters?.endDate) query = query.lte('dueDate', filters.endDate);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as FinancialTransaction[], error: null, count: count ?? undefined };
  },

  async create(payload: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'client' | 'createdBy'>): Promise<ApiResponse<FinancialTransaction>> {
    const { data, error } = await supabase
      .from('FinancialTransaction')
      .insert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as FinancialTransaction, error: null };
  },

  async update(id: string, payload: Partial<FinancialTransaction>): Promise<ApiResponse<FinancialTransaction>> {
    const { data, error } = await supabase
      .from('FinancialTransaction')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as FinancialTransaction, error: null };
  },

  async remove(id: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('FinancialTransaction')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  },

  /** Resumo financeiro (totais) */
  async getSummary(organizationId: string): Promise<ApiResponse<{
    totalIncome: number;
    totalExpense: number;
    pendingIncome: number;
    pendingExpense: number;
  }>> {
    const { data, error } = await supabase
      .from('FinancialTransaction')
      .select('type, status, amount')
      .eq('organizationId', organizationId);

    if (error) return { data: null, error: error.message };

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      pendingIncome: 0,
      pendingExpense: 0,
    };

    data?.forEach((t: { type: string; status: string; amount: number }) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        if (t.status === 'PAID') summary.totalIncome += amount;
        if (t.status === 'PENDING') summary.pendingIncome += amount;
      } else {
        if (t.status === 'PAID') summary.totalExpense += amount;
        if (t.status === 'PENDING') summary.pendingExpense += amount;
      }
    });

    return { data: summary, error: null };
  },
};
