import { supabaseAdmin } from '../../config/supabase'

export interface ClientRow {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  status: string | null
  created_at: Date
}

export class ClientRepository {
  async findAll(params: { search?: string; page: number; limit: number }): Promise<{ data: ClientRow[]; total: number }> {
    let q = supabaseAdmin.from('clients').select('*', { count: 'exact' })

    if (params.search) {
      q = q.or(`nome.ilike.%${params.search}%,cpf.ilike.%${params.search}%`)
    }

    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, count } = await q
      .order('created_at', { ascending: false })
      .range(from, to)

    return { data: (data || []) as ClientRow[], total: count || 0 }
  }

  async findById(id: string): Promise<ClientRow | null> {
    const { data } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    return (data || null) as ClientRow | null
  }

  async create(data: { nome: string; cpf?: string; telefone?: string; email?: string; status?: string }): Promise<ClientRow> {
    const { data: result, error } = await supabaseAdmin
      .from('clients')
      .insert({
        nome: data.nome,
        cpf: data.cpf || null,
        telefone: data.telefone || null,
        email: data.email || null,
        status: data.status || 'ativo',
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as ClientRow
  }

  async update(id: string, data: { nome?: string; cpf?: string; telefone?: string; email?: string; status?: string }): Promise<ClientRow | null> {
    const updateData: Record<string, any> = {}
    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.cpf !== undefined) updateData.cpf = data.cpf || null
    if (data.telefone !== undefined) updateData.telefone = data.telefone || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.status !== undefined) updateData.status = data.status

    if (Object.keys(updateData).length === 0) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    return (result || null) as ClientRow | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }
}
