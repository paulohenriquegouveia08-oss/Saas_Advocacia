import { supabaseAdmin } from '../../config/supabase'

export interface NotificationRow {
  id: string
  deadline_id: string | null
  user_id: string
  tipo: string
  mensagem: string
  lida: boolean
  created_at: Date
}

export class NotificationRepository {
  async findByUser(userId: string, params: { page: number; limit: number }): Promise<{ data: NotificationRow[]; total: number }> {
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('lida', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to)

    return { data: (data || []) as NotificationRow[], total: count || 0 }
  }

  async markAsRead(id: string, userId: string): Promise<NotificationRow | null> {
    const { data } = await supabaseAdmin
      .from('notifications')
      .update({ lida: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    return (data || null) as NotificationRow | null
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { data } = await supabaseAdmin
      .from('notifications')
      .update({ lida: true })
      .eq('user_id', userId)
      .eq('lida', false)
      .select('id')
    return data?.length || 0
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('lida', false)
    return count || 0
  }

  async markReadByDeadline(deadlineId: string): Promise<void> {
    await supabaseAdmin
      .from('notifications')
      .update({ lida: true })
      .eq('deadline_id', deadlineId)
  }

  async createIfNotExists(data: {
    deadline_id: string
    user_id: string
    tipo: string
    mensagem: string
  }): Promise<NotificationRow | null> {
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('deadline_id', data.deadline_id)
      .eq('user_id', data.user_id)
      .eq('tipo', data.tipo)
      .single()

    if (existing) return null

    const { data: result } = await supabaseAdmin
      .from('notifications')
      .insert({
        deadline_id: data.deadline_id,
        user_id: data.user_id,
        tipo: data.tipo,
        mensagem: data.mensagem,
      })
      .select()
      .single()

    return (result || null) as NotificationRow | null
  }

  async create(data: {
    deadline_id?: string | null
    user_id: string
    tipo: string
    mensagem: string
  }): Promise<NotificationRow> {
    const { data: result, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        deadline_id: data.deadline_id || null,
        user_id: data.user_id,
        tipo: data.tipo,
        mensagem: data.mensagem,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as NotificationRow
  }
}
