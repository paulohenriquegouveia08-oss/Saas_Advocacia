import { z } from 'zod'

export const createRoleSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão')
})

export const updateRoleSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  descricao: z.string().optional(),
  permissions: z.array(z.string()).optional()
})

export type CreateRoleData = z.infer<typeof createRoleSchema>
export type UpdateRoleData = z.infer<typeof updateRoleSchema>
