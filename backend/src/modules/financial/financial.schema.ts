import { z } from 'zod'

export const createFinancialSchema = z.object({
  tipo: z.enum(['entrada', 'saida'], { errorMap: () => ({ message: 'Tipo deve ser entrada ou saida' }) }),
  descricao: z.string().optional(),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  categoria: z.string().optional(),
  status: z.string().optional(),
  data: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
})

export const updateFinancialSchema = z.object({
  tipo: z.enum(['entrada', 'saida']).optional(),
  descricao: z.string().optional(),
  valor: z.coerce.number().positive().optional(),
  categoria: z.string().optional(),
  status: z.string().optional(),
  data: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
})

export const financialQuerySchema = z.object({
  tipo: z.enum(['entrada', 'saida']).optional(),
  client_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type CreateFinancialInput = z.infer<typeof createFinancialSchema>
export type UpdateFinancialInput = z.infer<typeof updateFinancialSchema>
export type FinancialQueryInput = z.infer<typeof financialQuerySchema>
