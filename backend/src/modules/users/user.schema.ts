import { z } from 'zod'

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin_global', 'funcionario', 'cliente'], {
    errorMap: () => ({ message: 'Role deve ser admin_global, funcionario ou cliente' }),
  }),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  role: z.enum(['admin_global', 'funcionario', 'cliente']).optional(),
  ativo: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
