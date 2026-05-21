import { z } from 'zod'

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin_global', 'funcionario'], {
    errorMap: () => ({ message: 'Role deve ser admin_global ou funcionario' }),
  }),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  role: z.enum(['admin_global', 'funcionario']).optional(),
  ativo: z.boolean().optional(),
  telefone: z.string().optional().nullable(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
