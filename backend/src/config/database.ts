import { Pool, QueryResult, QueryResultRow } from 'pg'
import { env } from './env'

// Configuração otimizada para Vercel + Supabase
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // Reduzido para evitar erro de muitas conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
  const result: QueryResult<T> = await pool.query<T>(text, params)
  return result.rows
}

export async function queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
  const result: QueryResult<T> = await pool.query<T>(text, params)
  return result.rows[0] || null
}

export async function queryCount(text: string, params?: any[]): Promise<number> {
  const result = await pool.query(text, params)
  return parseInt(result.rows[0]?.count || '0', 10)
}

