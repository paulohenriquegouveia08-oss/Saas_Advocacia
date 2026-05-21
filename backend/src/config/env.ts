import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string({ required_error: 'SUPABASE_URL é obrigatória' }),
  SUPABASE_ANON_KEY: z.string({ required_error: 'SUPABASE_ANON_KEY é obrigatória' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY é obrigatória' }),
  CORS_ORIGIN: z.string().default('*'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validar e logar erros claros
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente faltando ou inválidas:')
  for (const issue of parsed.error.issues) {
    console.error(`   → ${issue.path.join('.')}: ${issue.message}`)
  }
  // Listar quais vars existem e quais não
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  for (const key of required) {
    console.error(`   ${key}: ${process.env[key] ? '✅ definida' : '❌ NÃO DEFINIDA'}`)
  }
  throw new Error('Variáveis de ambiente obrigatórias não configuradas. Verifique o painel da Vercel.')
}

export const env = parsed.data