import { query, queryOne, queryCount } from '../../config/database'

export interface ClientRow {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  status: string | null
  created_at: Date
}

export class ClientRepository {
  async findAll(params: { search?: string; page: number; limit: number }): Promise<{ data: ClientRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit
    const conditions: string[] = []
    const values: any[] = []
    let idx = 1

    if (params.search) {
      conditions.push(`(nome ILIKE $${idx} OR cpf ILIKE $${idx})`)
      values.push(`%${params.search}%`)
      idx++
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = await queryCount(
      `SELECT COUNT(*) FROM clients ${where}`,
      values
    )

    const data = await query<ClientRow>(
      `SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    )

    return { data, total }
  }

  async findById(id: string): Promise<ClientRow | null> {
    return queryOne<ClientRow>('SELECT * FROM clients WHERE id = $1', [id])
  }

  async create(data: { nome: string; cpf?: string; telefone?: string; email?: string; status?: string }): Promise<ClientRow> {
    const result = await queryOne<ClientRow>(
      `INSERT INTO clients (nome, cpf, telefone, email, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.nome, data.cpf || null, data.telefone || null, data.email || null, data.status || 'ativo']
    )
    return result!
  }

  async update(id: string, data: { nome?: string; cpf?: string; telefone?: string; email?: string; status?: string }): Promise<ClientRow | null> {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(data.nome) }
    if (data.cpf !== undefined) { fields.push(`cpf = $${idx++}`); values.push(data.cpf || null) }
    if (data.telefone !== undefined) { fields.push(`telefone = $${idx++}`); values.push(data.telefone || null) }
    if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email || null) }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    return queryOne<ClientRow>(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>('DELETE FROM clients WHERE id = $1 RETURNING id', [id])
    return result !== null
  }
}
