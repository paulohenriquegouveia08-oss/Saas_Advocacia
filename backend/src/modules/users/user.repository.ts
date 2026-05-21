import { supabaseAdmin } from '../../config/supabase'

export interface UserRow {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  created_at: Date
  telefone?: string | null
}

export class UserRepository {
  async findAll(): Promise<UserRow[]> {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, nome, email, role, ativo, created_at, telefone')
      .order('created_at', { ascending: false })
    return (data || []) as UserRow[]
  }

  async findById(id: string): Promise<UserRow | null> {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, nome, email, role, ativo, created_at, telefone')
      .eq('id', id)
      .single()
    return (data || null) as UserRow | null
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, nome, email, role, ativo, created_at, telefone')
      .eq('email', email)
      .single()
    return (data || null) as UserRow | null
  }

  async create(data: { id: string; nome: string; email: string; role: string }): Promise<UserRow> {
    const { data: result, error } = await supabaseAdmin
      .from('users')
      .insert({ id: data.id, nome: data.nome, email: data.email, role: data.role })
      .select('id, nome, email, role, ativo, created_at')
      .single()
    if (error || !result) throw error
    return result as UserRow
  }

  async update(id: string, data: { nome?: string; role?: string; ativo?: boolean; telefone?: string | null }): Promise<UserRow | null> {
    const updateData: Record<string, any> = {}
    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.role !== undefined) updateData.role = data.role
    if (data.ativo !== undefined) updateData.ativo = data.ativo
    if (data.telefone !== undefined) updateData.telefone = data.telefone

    if (Object.keys(updateData).length === 0) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, nome, email, role, ativo, created_at, telefone')
      .single()
    return (result || null) as UserRow | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }
}
