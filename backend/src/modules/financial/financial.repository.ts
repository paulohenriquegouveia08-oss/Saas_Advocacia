import { query, queryOne, queryCount } from '../../config/database'

export interface FinancialRow {
  id: string
  tipo: string
  descricao: string | null
  valor: number
  categoria: string | null
  status: string | null
  data: string | null
  client_id: string | null
  cliente_nome?: string
}

export interface FinancialSummary {
  total_entradas: number
  total_saidas: number
  saldo: number
}

export class FinancialRepository {
  async findAll(params: { tipo?: string; client_id?: string; page: number; limit: number }): Promise<{ data: FinancialRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit
    const conditions: string[] = []
    const values: any[] = []
    let idx = 1

    if (params.tipo) {
      conditions.push(`f.tipo = $${idx++}`)
      values.push(params.tipo)
    }
    if (params.client_id) {
      conditions.push(`f.client_id = $${idx++}`)
      values.push(params.client_id)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = await queryCount(`SELECT COUNT(*) FROM financial_transactions f ${where}`, values)

    const data = await query<FinancialRow>(
      `SELECT f.*, c.nome AS cliente_nome
       FROM financial_transactions f
       LEFT JOIN clients c ON f.client_id = c.id
       ${where}
       ORDER BY f.data DESC NULLS LAST, f.id DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    )

    return { data, total }
  }

  async findById(id: string): Promise<FinancialRow | null> {
    return queryOne<FinancialRow>(
      `SELECT f.*, c.nome AS cliente_nome
       FROM financial_transactions f
       LEFT JOIN clients c ON f.client_id = c.id
       WHERE f.id = $1`,
      [id]
    )
  }

  async getSummary(): Promise<FinancialSummary> {
    const result = await queryOne<FinancialSummary>(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) AS total_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) AS total_saidas,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
       FROM financial_transactions`
    )
    return result || { total_entradas: 0, total_saidas: 0, saldo: 0 }
  }

  async create(data: { tipo: string; descricao?: string; valor: number; categoria?: string; status?: string; data?: string; client_id?: string | null }): Promise<FinancialRow> {
    const result = await queryOne<FinancialRow>(
      `INSERT INTO financial_transactions (tipo, descricao, valor, categoria, status, data, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.tipo, data.descricao || null, data.valor, data.categoria || null, data.status || null, data.data || null, data.client_id || null]
    )
    return result!
  }

  async update(id: string, data: { tipo?: string; descricao?: string; valor?: number; categoria?: string; status?: string; data?: string; client_id?: string | null }): Promise<FinancialRow | null> {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.tipo !== undefined) { fields.push(`tipo = $${idx++}`); values.push(data.tipo) }
    if (data.descricao !== undefined) { fields.push(`descricao = $${idx++}`); values.push(data.descricao) }
    if (data.valor !== undefined) { fields.push(`valor = $${idx++}`); values.push(data.valor) }
    if (data.categoria !== undefined) { fields.push(`categoria = $${idx++}`); values.push(data.categoria) }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status) }
    if (data.data !== undefined) { fields.push(`data = $${idx++}`); values.push(data.data) }
    if (data.client_id !== undefined) { fields.push(`client_id = $${idx++}`); values.push(data.client_id) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    return queryOne<FinancialRow>(
      `UPDATE financial_transactions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>('DELETE FROM financial_transactions WHERE id = $1 RETURNING id', [id])
    return result !== null
  }
}
