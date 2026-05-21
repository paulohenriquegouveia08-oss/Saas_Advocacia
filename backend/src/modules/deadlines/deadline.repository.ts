import { supabaseAdmin } from '../../config/supabase'

export interface DeadlineRow {
  id: string
  process_id: string
  descricao: string | null
  data_inicio: string | null
  data_vencimento: string
  status: string
  responsavel_id: string | null
  dias_restantes: number
  urgencia?: string
  processo_numero?: string
  cliente_nome?: string
}

function calcUrgency(dataVencimento: string): { urgencia: string; dias_restantes: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento)
  venc.setHours(0, 0, 0, 0)
  const diff = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let urgencia: string
  if (diff < 0) urgencia = 'vencido'
  else if (diff === 0) urgencia = 'vence_hoje'
  else if (diff <= 3) urgencia = 'critico'
  else if (diff <= 7) urgencia = 'urgente'
  else if (diff <= 30) urgencia = 'proximo'
  else urgencia = 'normal'

  return { urgencia, dias_restantes: diff }
}

export class DeadlineRepository {
  async findAllWithUrgency(params: { status?: string; responsavel_id?: string; page: number; limit: number }): Promise<{ data: DeadlineRow[]; total: number }> {
    let q = supabaseAdmin.from('deadlines').select('*, processes(numero, clients(nome))', { count: 'exact' })

    if (params.status) {
      q = q.eq('status', params.status)
    } else {
      q = q.neq('status', 'concluido')
    }
    if (params.responsavel_id) q = q.eq('responsavel_id', params.responsavel_id)

    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, count } = await q
      .order('data_vencimento', { ascending: true })
      .range(from, to)

    const mapped = (data || []).map((d: any) => {
      const { urgencia, dias_restantes } = calcUrgency(d.data_vencimento)
      return {
        ...d,
        processo_numero: d.processes?.numero || null,
        cliente_nome: d.processes?.clients?.nome || null,
        urgencia,
        dias_restantes,
      }
    })

    return { data: mapped as DeadlineRow[], total: count || 0 }
  }

  async findById(id: string): Promise<DeadlineRow | null> {
    const { data } = await supabaseAdmin
      .from('deadlines')
      .select('*, processes(numero, clients(nome))')
      .eq('id', id)
      .single()

    if (!data) return null
    const { urgencia, dias_restantes } = calcUrgency(data.data_vencimento)
    return {
      ...data,
      processo_numero: (data as any).processes?.numero || null,
      cliente_nome: (data as any).processes?.clients?.nome || null,
      urgencia,
      dias_restantes,
    } as DeadlineRow
  }

  async create(data: { process_id: string; descricao?: string; data_inicio?: string; data_vencimento: string; responsavel_id?: string }): Promise<DeadlineRow> {
    const { data: result, error } = await supabaseAdmin
      .from('deadlines')
      .insert({
        process_id: data.process_id,
        descricao: data.descricao || null,
        data_inicio: data.data_inicio || null,
        data_vencimento: data.data_vencimento,
        responsavel_id: data.responsavel_id || null,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as DeadlineRow
  }

  async update(id: string, data: { descricao?: string; data_inicio?: string; data_vencimento?: string; status?: string; responsavel_id?: string | null }): Promise<DeadlineRow | null> {
    const updateData: Record<string, any> = {}
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio
    if (data.data_vencimento !== undefined) updateData.data_vencimento = data.data_vencimento
    if (data.status !== undefined) updateData.status = data.status
    if (data.responsavel_id !== undefined) updateData.responsavel_id = data.responsavel_id

    if (Object.keys(updateData).length === 0) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('deadlines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    return (result || null) as DeadlineRow | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('deadlines')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }

  async findTopUrgent(limit: number = 5): Promise<DeadlineRow[]> {
    const { data } = await supabaseAdmin
      .from('deadlines')
      .select('*, processes(numero, clients(nome))')
      .neq('status', 'concluido')
      .order('data_vencimento', { ascending: true })
      .limit(limit)

    return (data || []).map((d: any) => {
      const { urgencia, dias_restantes } = calcUrgency(d.data_vencimento)
      return {
        ...d,
        processo_numero: d.processes?.numero || null,
        cliente_nome: d.processes?.clients?.nome || null,
        urgencia,
        dias_restantes,
      }
    }) as DeadlineRow[]
  }
}
