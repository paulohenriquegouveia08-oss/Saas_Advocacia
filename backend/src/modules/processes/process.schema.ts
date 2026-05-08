import { z } from 'zod'

export const createProcessSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  numero: z.string().min(1, 'Número do processo é obrigatório'),
  tribunal: z.string().optional(),
  tipo_acao: z.string().optional(),
  parte_contraria: z.string().optional(),
  status: z.enum(['ativo', 'suspenso', 'encerrado']).default('ativo'),
})

export const updateProcessSchema = z.object({
  client_id: z.string().uuid().optional(),
  numero: z.string().min(1).optional(),
  tribunal: z.string().optional(),
  tipo_acao: z.string().optional(),
  parte_contraria: z.string().optional(),
  status: z.enum(['ativo', 'suspenso', 'encerrado']).optional(),
})

export const processQuerySchema = z.object({
  status: z.enum(['ativo', 'suspenso', 'encerrado']).optional(),
  client_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export const createMovementSchema = z.object({
  tipo: z.string().optional(),
  descricao: z.string().optional(),
  data: z.string().optional(),
})

export type CreateProcessInput = z.infer<typeof createProcessSchema>
export type UpdateProcessInput = z.infer<typeof updateProcessSchema>
export type ProcessQueryInput = z.infer<typeof processQuerySchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
