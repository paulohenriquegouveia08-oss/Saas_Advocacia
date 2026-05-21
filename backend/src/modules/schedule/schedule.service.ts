import { ScheduleRepository } from './schedule.repository'
import type { CreateScheduleInput, UpdateScheduleInput } from './schedule.schema'
import { supabaseAdmin } from '../../config/supabase'

export class ScheduleService {
  private repository = new ScheduleRepository()

  async create(data: CreateScheduleInput, userId: string) {
    if (data.client_id) {
      const { data: clientExists } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('id', data.client_id)
        .single()
      if (!clientExists) throw new Error('Cliente não encontrado')
    }

    if (data.process_id) {
      const { data: processExists } = await supabaseAdmin
        .from('processes')
        .select('id')
        .eq('id', data.process_id)
        .single()
      if (!processExists) throw new Error('Processo não encontrado')
    }

    return this.repository.create({ ...data, user_id: userId })
  }

  async findAll(filters: any, userId: string, role: string) {
    const finalFilters = { ...filters }
    console.log('[Schedule] findAll filters:', finalFilters)
    const events = await this.repository.findAll(finalFilters)
    console.log('[Schedule] findAll result count:', events.length)
    return events
  }

  async findById(id: string) {
    const event = await this.repository.findById(id)
    if (!event) throw new Error('Evento não encontrado')
    return event
  }

  async update(id: string, data: UpdateScheduleInput) {
    await this.findById(id)

    if (data.client_id) {
      const { data: clientExists } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('id', data.client_id)
        .single()
      if (!clientExists) throw new Error('Cliente não encontrado')
    }

    if (data.process_id) {
      const { data: processExists } = await supabaseAdmin
        .from('processes')
        .select('id')
        .eq('id', data.process_id)
        .single()
      if (!processExists) throw new Error('Processo não encontrado')
    }

    return this.repository.update(id, data)
  }

  async delete(id: string) {
    await this.findById(id)
    return this.repository.delete(id)
  }
}
