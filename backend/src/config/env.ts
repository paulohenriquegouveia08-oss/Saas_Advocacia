import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL é obrigatória' }),
  SUPABASE_URL: z.string({ required_error: 'SUPABASE_URL é obrigatória' }),
  SUPABASE_ANON_KEY: z.string({ required_error: 'SUPABASE_ANON_KEY é obrigatória' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY é obrigatória' }),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Exportação tipada e segura
export const env = envSchema.parse(process.env)