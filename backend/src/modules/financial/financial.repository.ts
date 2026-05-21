import { supabaseAdmin } from '../../config/supabase'

export interface FinancialRow {
  id: string
  tipo: string
  descricao: string | null
  valor: number
  categoria: string | null
  status: string | null
  data: string | null
  client_id: string | null
  cliente_nome?: string
}

export interface FinancialSummary {
  total_entradas: number
  total_saidas: number
  saldo: number
}

export class FinancialRepository {
  async findAll(params: { tipo?: string; client_id?: string; page: number; limit: number }): Promise<{ data: FinancialRow[]; total: number }> {
    let q = supabaseAdmin.from('financial_transactions').select('*, clients(nome)', { count: 'exact' })

    if (params.tipo) q = q.eq('tipo', params.tipo)
    if (params.client_id) q = q.eq('client_id', params.client_id)

    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, count } = await q
      .order('data', { ascending: false, nullsFirst: true })
      .order('id', { ascending: false })
      .range(from, to)

    const mapped = (data || []).map((f: any) => ({
      ...f,
      cliente_nome: f.clients?.nome || null,
    }))

    return { data: mapped as FinancialRow[], total: count || 0 }
  }

  async findById(id: string): Promise<FinancialRow | null> {
    const { data } = await supabaseAdmin
      .from('financial_transactions')
      .select('*, clients(nome)')
      .eq('id', id)
      .single()

    if (!data) return null
    return {
      ...data,
      cliente_nome: (data as any).clients?.nome || null,
    } as FinancialRow
  }

  async getSummary(): Promise<FinancialSummary> {
    const { data } = await supabaseAdmin
      .from('financial_transactions')
      .select('tipo, valor')

    if (!data || data.length === 0) {
      return { total_entradas: 0, total_saidas: 0, saldo: 0 }
    }

    let total_entradas = 0
    let total_saidas = 0
    for (const row of data) {
      if (row.tipo === 'entrada') {
        total_entradas += row.valor || 0
      } else {
        total_saidas += row.valor || 0
      }
    }

    return { total_entradas, total_saidas, saldo: total_entradas - total_saidas }
  }

  async create(data: { tipo: string; descricao?: string; valor: number; categoria?: string; status?: string; data?: string; client_id?: string | null }): Promise<FinancialRow> {
    const { data: result, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        tipo: data.tipo,
        descricao: data.descricao || null,
        valor: data.valor,
        categoria: data.categoria || null,
        status: data.status || null,
        data: data.data || null,
        client_id: data.client_id || null,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as FinancialRow
  }

  async update(id: string, data: { tipo?: string; descricao?: string; valor?: number; categoria?: string; status?: string; data?: string; client_id?: string | null }): Promise<FinancialRow | null> {
    const updateData: Record<string, any> = {}
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.valor !== undefined) updateData.valor = data.valor
    if (data.categoria !== undefined) updateData.categoria = data.categoria
    if (data.status !== undefined) updateData.status = data.status
    if (data.data !== undefined) updateData.data = data.data
    if (data.client_id !== undefined) updateData.client_id = data.client_id

    if (Object.keys(updateData).length === 0) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('financial_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    return (result || null) as FinancialRow | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('financial_transactions')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }
}
