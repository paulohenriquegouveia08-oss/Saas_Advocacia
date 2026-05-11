import { z } from 'zod'

export const settingsSchema = z.object({
  escritorio_nome: z.string().optional().nullable(),
  escritorio_cnpj: z.string().optional().nullable(),
  escritorio_telefone: z.string().optional().nullable(),
  escritorio_email: z.string().email().optional().or(z.literal('')).nullable(),
  escritorio_endereco: z.string().optional().nullable(),
  escritorio_logo: z.string().optional().nullable(),
  notificar_prazo_vencido: z.boolean().optional().nullable(),
  notificar_prazo_proximo: z.boolean().optional().nullable(),
  dias_antecedencia: z.coerce.number().min(1).max(30).optional().nullable(),
})

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional().nullable(),
  notificacoes_email: z.boolean().optional().nullable(),
})

export type SettingsInput = z.infer<typeof settingsSchema>
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>