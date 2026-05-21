import { supabaseAdmin } from '../../config/supabase'
import type { CreateScheduleInput, UpdateScheduleInput } from './schedule.schema'

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  event_type: string
  priority: string
  status: string
  start_date: Date
  end_date: Date
  start_time: string
  end_time: string
  client_id?: string
  process_id?: string
  user_id: string
  color?: string
  created_at: Date
  updated_at: Date
}

export class ScheduleRepository {
  async create(data: CreateScheduleInput & { user_id: string }): Promise<ScheduleEvent> {
    const { data: result, error } = await supabaseAdmin
      .from('schedule_events')
      .insert({
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        priority: data.priority,
        status: (data as any).status || 'pendente',
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time,
        end_time: data.end_time,
        client_id: data.client_id || null,
        process_id: data.process_id || null,
        user_id: data.user_id,
        color: data.color || null,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as ScheduleEvent
  }

  async findAll(filters: { start_date?: string; end_date?: string; user_id?: string; client_id?: string; event_type?: string }): Promise<ScheduleEvent[]> {
    let q = supabaseAdmin.from('schedule_events').select('*')

    if (filters.user_id) q = q.eq('user_id', filters.user_id)
    if (filters.client_id) q = q.eq('client_id', filters.client_id)
    if (filters.event_type) q = q.eq('event_type', filters.event_type)

    if (filters.start_date && filters.end_date) {
      q = q.lte('start_date', filters.end_date).gte('end_date', filters.start_date)
    } else if (filters.start_date) {
      q = q.gte('start_date', filters.start_date)
    }

    const { data, error } = await q
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) console.error('[Schedule] Supabase error:', error)
    console.log('[Schedule] Query filters:', filters)
    console.log('[Schedule] Results:', data?.length || 0, 'events')

    return (data || []) as ScheduleEvent[]
  }

  async findById(id: string): Promise<ScheduleEvent | null> {
    const { data } = await supabaseAdmin
      .from('schedule_events')
      .select('*')
      .eq('id', id)
      .single()
    return (data || null) as ScheduleEvent | null
  }

  async update(id: string, data: UpdateScheduleInput): Promise<ScheduleEvent | null> {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of Object.keys(data)) {
      const val = data[key as keyof UpdateScheduleInput]
      if (val !== undefined) updateData[key] = val
    }

    if (Object.keys(updateData).length === 1) return this.findById(id)

    const { data: result } = await supabaseAdmin
      .from('schedule_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    return (result || null) as ScheduleEvent | null
  }

  async delete(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('schedule_events')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    return data !== null
  }
}
