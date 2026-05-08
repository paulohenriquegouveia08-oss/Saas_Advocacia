import { query, queryOne, queryCount } from '../../config/database'

export interface ProcessRow {
  id: string
  client_id: string
  numero: string
  tribunal: string | null
  tipo_acao: string | null
  parte_contraria: string | null
  status: string
  created_at: Date
  cliente_nome?: string
}

export interface MovementRow {
  id: string
  process_id: string
  tipo: string | null
  descricao: string | null
  data: Date | null
  created_at: Date
}

export class ProcessRepository {
  async findAll(params: { status?: string; client_id?: string; page: number; limit: number }): Promise<{ data: ProcessRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit
    const conditions: string[] = []
    const values: any[] = []
    let idx = 1

    if (params.status) {
      conditions.push(`p.status = $${idx++}`)
      values.push(params.status)
    }
    if (params.client_id) {
      conditions.push(`p.client_id = $${idx++}`)
      values.push(params.client_id)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = await queryCount(
      `SELECT COUNT(*) FROM processes p ${where}`,
      values
    )

    const data = await query<ProcessRow>(
      `SELECT p.*, c.nome AS cliente_nome
       FROM processes p
       JOIN clients c ON p.client_id = c.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    )

    return { data, total }
  }

  async findById(id: string): Promise<ProcessRow | null> {
    return queryOne<ProcessRow>(
      `SELECT p.*, c.nome AS cliente_nome
       FROM processes p
       JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [id]
    )
  }

  async findByNumero(numero: string): Promise<ProcessRow | null> {
    return queryOne<ProcessRow>('SELECT * FROM processes WHERE numero = $1', [numero])
  }

  async create(data: { client_id: string; numero: string; tribunal?: string; tipo_acao?: string; parte_contraria?: string; status?: string }): Promise<ProcessRow> {
    const result = await queryOne<ProcessRow>(
      `INSERT INTO processes (client_id, numero, tribunal, tipo_acao, parte_contraria, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.client_id, data.numero, data.tribunal || null, data.tipo_acao || null, data.parte_contraria || null, data.status || 'ativo']
    )
    return result!
  }

  async update(id: string, data: { client_id?: string; numero?: string; tribunal?: string; tipo_acao?: string; parte_contraria?: string; status?: string }): Promise<ProcessRow | null> {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.client_id !== undefined) { fields.push(`client_id = $${idx++}`); values.push(data.client_id) }
    if (data.numero !== undefined) { fields.push(`numero = $${idx++}`); values.push(data.numero) }
    if (data.tribunal !== undefined) { fields.push(`tribunal = $${idx++}`); values.push(data.tribunal) }
    if (data.tipo_acao !== undefined) { fields.push(`tipo_acao = $${idx++}`); values.push(data.tipo_acao) }
    if (data.parte_contraria !== undefined) { fields.push(`parte_contraria = $${idx++}`); values.push(data.parte_contraria) }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    return queryOne<ProcessRow>(
      `UPDATE processes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>('DELETE FROM processes WHERE id = $1 RETURNING id', [id])
    return result !== null
  }

  // Movements
  async findMovements(processId: string): Promise<MovementRow[]> {
    return query<MovementRow>(
      'SELECT * FROM process_movements WHERE process_id = $1 ORDER BY data DESC, created_at DESC',
      [processId]
    )
  }

  async createMovement(data: { process_id: string; tipo?: string; descricao?: string; data?: string }): Promise<MovementRow> {
    const result = await queryOne<MovementRow>(
      `INSERT INTO process_movements (process_id, tipo, descricao, data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.process_id, data.tipo || null, data.descricao || null, data.data || null]
    )
    return result!
  }
}
