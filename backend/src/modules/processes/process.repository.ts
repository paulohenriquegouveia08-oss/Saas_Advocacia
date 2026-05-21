import { supabaseAdmin } from '../../config/supabase'

export interface ProcessRow {
  id: string
  client_id: string
  numero: string
  tribunal: string | null
  tipo_acao: string | null
  parte_contraria: string | null
  status: string
  created_at: Date
  cliente_nome?: string
}

export interface MovementRow {
  id: string
  process_id: string
  tipo: string | null
  descricao: string | null
  data: Date | null
  created_at: Date
}

export class ProcessRepository {
  async findAll(params: { status?: string; client_id?: string; search?: string; page: number; limit: number }): Promise<{ data: ProcessRow[]; total: number }> {
    let q = supabaseAdmin.from('processes').select('*, clients(nome)', { count: 'exact' })

    if (params.status) q = q.eq('status', params.status)
    if (params.client_id) q = q.eq('client_id', params.client_id)
    if (params.search) {
      q = q.or(`numero.ilike.%${params.search}%,tribunal.ilike.%${params.search}%,tipo_acao.ilike.%${params.search}%,parte_contraria.ilike.%${params.search}%,clients.nome.ilike.%${params.search}%`)
    }

    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, count } = await q
      .order('created_at', { ascending: false })
      .range(from, to)

    const mapped = (data || []).map((p: any) => ({
      ...p,
      cliente_nome: p.clients?.nome || null,
    }))

    return { data: mapped as ProcessRow[], total: count || 0 }
  }

  async findById(id: string): Promise<ProcessRow | null> {
    const { data } = await supabaseAdmin
      .from('processes')
      .select('*, clients(nome)')
      .eq('id', id)
      .single()

    if (!data) return null
    return {
      ...data,
      cliente_nome: (data as any).clients?.nome || null,
    } as ProcessRow
  }

  async findByNumero(numero: string): Promise<ProcessRow | null> {
    const { data } = await supabaseAdmin
      .from('processes')
      .select('*')
      .eq('numero', numero)
      .single()
    return (data || null) as ProcessRow | null
  }

  async create(data: { client_id: string; numero: string; tribunal?: string; tipo_acao?: string; parte_contraria?: string; status?: string }): Promise<ProcessRow> {
    const { data: result, error } = await supabaseAdmin
      .from('processes')
      .insert({
        client_id: data.client_id,
        numero: data.numero,
        tribunal: data.tribunal || null,
        tipo_acao: data.tipo_acao || null,
        parte_contraria: data.parte_contraria || null,
        status: data.status || 'ativo',
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as ProcessRow
  }

  async update(id: string, data: { client_id?: string; numero?: string; tribunal?: string; tipo_acao?: string; parte_contraria?: string; status?: string }): Promise<ProcessRow | null> {
    const updateData: Record<string, any> = {}
    if (data.client_id !== undefined) updateData.client_id = data.client_id
    if (data.numero !== undefined) updateData.numero = data.numero
    if (data.tribunal !== undefined) updateData.tribunal = data.tribunal
    if (data.tipo_acao !== undefined) updateData.tipo_acao = data.tipo_acao
    if (data.parte_contraria !== undefined) updateData.parte_contraria = data.parte_contraria
    if (data.status !== undefined) updateData.status = data.status

    if (Object.keys(updateData).length === 0) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('processes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    return (result || null) as ProcessRow | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('processes')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }

  async findMovements(processId: string): Promise<MovementRow[]> {
    const { data } = await supabaseAdmin
      .from('process_movements')
      .select('*')
      .eq('process_id', processId)
      .order('data', { ascending: false })
    return (data || []) as MovementRow[]
  }

  async createMovement(data: { process_id: string; tipo?: string; descricao?: string; data?: string }): Promise<MovementRow> {
    const { data: result, error } = await supabaseAdmin
      .from('process_movements')
      .insert({
        process_id: data.process_id,
        tipo: data.tipo || null,
        descricao: data.descricao || null,
        data: data.data || null,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as MovementRow
  }
}
