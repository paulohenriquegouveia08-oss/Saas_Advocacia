import { query, queryOne, queryCount } from '../../config/database'

export interface DeadlineRow {
  id: string
  process_id: string
  descricao: string | null
  data_inicio: string | null
  data_vencimento: string
  status: string
  responsavel_id: string | null
  dias_restantes: number
  urgencia?: string
  processo_numero?: string
  cliente_nome?: string
}

export class DeadlineRepository {
  async findAllWithUrgency(params: { status?: string; responsavel_id?: string; page: number; limit: number }): Promise<{ data: DeadlineRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit
    const conditions: string[] = ["d.status != 'concluido'"]
    const values: any[] = []
    let idx = 1

    if (params.status) {
      conditions[0] = `d.status = $${idx++}`
      values.push(params.status)
    }
    if (params.responsavel_id) {
      conditions.push(`d.responsavel_id = $${idx++}`)
      values.push(params.responsavel_id)
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const total = await queryCount(
      `SELECT COUNT(*) FROM deadlines d ${where}`,
      values
    )

    const data = await query<DeadlineRow>(
      `SELECT d.id, d.process_id, d.descricao, d.data_inicio, d.data_vencimento,
              d.status, d.responsavel_id,
              p.numero AS processo_numero,
              c.nome AS cliente_nome,
              CASE
                WHEN d.data_vencimento < CURRENT_DATE     THEN 'vencido'
                WHEN d.data_vencimento = CURRENT_DATE     THEN 'vence_hoje'
                WHEN d.data_vencimento <= CURRENT_DATE+3  THEN 'critico'
                WHEN d.data_vencimento <= CURRENT_DATE+7  THEN 'urgente'
                WHEN d.data_vencimento <= CURRENT_DATE+30 THEN 'proximo'
                ELSE 'normal'
              END AS urgencia,
              (d.data_vencimento - CURRENT_DATE) AS dias_restantes
       FROM deadlines d
       JOIN processes p ON d.process_id = p.id
       JOIN clients c ON p.client_id = c.id
       ${where}
       ORDER BY d.data_vencimento ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    )

    return { data, total }
  }

  async findById(id: string): Promise<DeadlineRow | null> {
    return queryOne<DeadlineRow>(
      `SELECT d.*, p.numero AS processo_numero, c.nome AS cliente_nome,
              CASE
                WHEN d.data_vencimento < CURRENT_DATE     THEN 'vencido'
                WHEN d.data_vencimento = CURRENT_DATE     THEN 'vence_hoje'
                WHEN d.data_vencimento <= CURRENT_DATE+3  THEN 'critico'
                WHEN d.data_vencimento <= CURRENT_DATE+7  THEN 'urgente'
                WHEN d.data_vencimento <= CURRENT_DATE+30 THEN 'proximo'
                ELSE 'normal'
              END AS urgencia,
              (d.data_vencimento - CURRENT_DATE) AS dias_restantes
       FROM deadlines d
       JOIN processes p ON d.process_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE d.id = $1`,
      [id]
    )
  }

  async create(data: { process_id: string; descricao?: string; data_inicio?: string; data_vencimento: string; responsavel_id?: string }): Promise<DeadlineRow> {
    const result = await queryOne<DeadlineRow>(
      `INSERT INTO deadlines (process_id, descricao, data_inicio, data_vencimento, responsavel_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.process_id, data.descricao || null, data.data_inicio || null, data.data_vencimento, data.responsavel_id || null]
    )
    return result!
  }

  async update(id: string, data: { descricao?: string; data_inicio?: string; data_vencimento?: string; status?: string; responsavel_id?: string | null }): Promise<DeadlineRow | null> {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.descricao !== undefined) { fields.push(`descricao = $${idx++}`); values.push(data.descricao) }
    if (data.data_inicio !== undefined) { fields.push(`data_inicio = $${idx++}`); values.push(data.data_inicio) }
    if (data.data_vencimento !== undefined) { fields.push(`data_vencimento = $${idx++}`); values.push(data.data_vencimento) }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status) }
    if (data.responsavel_id !== undefined) { fields.push(`responsavel_id = $${idx++}`); values.push(data.responsavel_id) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    return queryOne<DeadlineRow>(
      `UPDATE deadlines SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>('DELETE FROM deadlines WHERE id = $1 RETURNING id', [id])
    return result !== null
  }

  async findTopUrgent(limit: number = 5): Promise<DeadlineRow[]> {
    return query<DeadlineRow>(
      `SELECT d.id, d.process_id, d.descricao, d.data_vencimento, d.status, d.responsavel_id,
              p.numero AS processo_numero, c.nome AS cliente_nome,
              CASE
                WHEN d.data_vencimento < CURRENT_DATE     THEN 'vencido'
                WHEN d.data_vencimento = CURRENT_DATE     THEN 'vence_hoje'
                WHEN d.data_vencimento <= CURRENT_DATE+3  THEN 'critico'
                WHEN d.data_vencimento <= CURRENT_DATE+7  THEN 'urgente'
                WHEN d.data_vencimento <= CURRENT_DATE+30 THEN 'proximo'
                ELSE 'normal'
              END AS urgencia,
              (d.data_vencimento - CURRENT_DATE) AS dias_restantes
       FROM deadlines d
       JOIN processes p ON d.process_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE d.status != 'concluido'
       ORDER BY d.data_vencimento ASC
       LIMIT $1`,
      [limit]
    )
  }
}
