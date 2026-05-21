import { z } from 'zod'

export const eventTypeSchema = z.enum([
  'reuniao_cliente',
  'audiencia',
  'tarefa_interna',
  'prazo_processual',
  'atendimento',
  'revisao_documental',
  'diligencia',
  'financeiro',
  'outro'
])

export const prioritySchema = z.enum(['baixa', 'media', 'alta', 'urgente'])

const baseScheduleSchema = z.object({
  title: z.string().min(3, 'O título é obrigatório'),
  description: z.string().optional(),
  event_type: eventTypeSchema,
  priority: prioritySchema.default('media'),
  status: z.enum(['pendente', 'concluido', 'cancelado']).default('pendente'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário inicial inválido (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário final inválido (HH:MM)'),
  client_id: z.string().uuid('ID de cliente inválido').optional().nullable(),
  process_id: z.string().uuid('ID de processo inválido').optional().nullable(),
  color: z.string().optional()
})

export const createScheduleSchema = baseScheduleSchema.refine(data => {
  if (data.start_date === data.end_date) {
    return data.start_time < data.end_time
  }
  return data.start_date <= data.end_date
}, {
  message: 'O horário/data final deve ser posterior ao inicial',
  path: ['end_time']
})

export const updateScheduleSchema = baseScheduleSchema.partial()

export const queryScheduleSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  client_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  event_type: eventTypeSchema.optional()
})

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
