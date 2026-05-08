import { Pool, QueryResult, QueryResultRow } from 'pg'
import { env } from './env'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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

