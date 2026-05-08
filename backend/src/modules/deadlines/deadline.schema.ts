import { z } from 'zod'

export const createDeadlineSchema = z.object({
  process_id: z.string().uuid('ID do processo inválido'),
  descricao: z.string().optional(),
  data_inicio: z.string().optional(),
  data_vencimento: z.string({ required_error: 'Data de vencimento é obrigatória' }),
  responsavel_id: z.string().uuid('ID do responsável inválido').optional(),
})

export const updateDeadlineSchema = z.object({
  descricao: z.string().optional(),
  data_inicio: z.string().optional(),
  data_vencimento: z.string().optional(),
  status: z.enum(['pendente', 'atrasado', 'concluido']).optional(),
  responsavel_id: z.string().uuid().optional().nullable(),
})

export const deadlineQuerySchema = z.object({
  status: z.enum(['pendente', 'atrasado', 'concluido']).optional(),
  responsavel_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>
export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>
export type DeadlineQueryInput = z.infer<typeof deadlineQuerySchema>
