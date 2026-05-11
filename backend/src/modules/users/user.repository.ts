import { query, queryOne } from '../../config/database'

export interface UserRow {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  created_at: Date
  telefone?: string | null
}

export class UserRepository {
  async findAll(): Promise<UserRow[]> {
    return query<UserRow>(
      'SELECT id, nome, email, role, ativo, created_at, telefone FROM users ORDER BY created_at DESC'
    )
  }

  async findById(id: string): Promise<UserRow | null> {
    return queryOne<UserRow>(
      'SELECT id, nome, email, role, ativo, created_at, telefone FROM users WHERE id = $1',
      [id]
    )
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    return queryOne<UserRow>(
      'SELECT id, nome, email, role, ativo, created_at, telefone FROM users WHERE email = $1',
      [email]
    )
  }

  async create(data: { id: string; nome: string; email: string; role: string }): Promise<UserRow> {
    const result = await queryOne<UserRow>(
      `INSERT INTO users (id, nome, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, role, ativo, created_at`,
      [data.id, data.nome, data.email, data.role]
    )
    return result!
  }

  async update(id: string, data: { nome?: string; role?: string; ativo?: boolean; telefone?: string | null }): Promise<UserRow | null> {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(data.nome) }
    if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role) }
    if (data.ativo !== undefined) { fields.push(`ativo = $${idx++}`); values.push(data.ativo) }
    if (data.telefone !== undefined) { fields.push(`telefone = $${idx++}`); values.push(data.telefone) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    return queryOne<UserRow>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, nome, email, role, ativo, created_at, telefone`,
      values
    )
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    return result !== null
  }
}
