import { query, queryOne } from '../../config/database'

export interface SettingsRow {
  id: string
  escritorio_nome: string | null
  escritorio_cnpj: string | null
  escritorio_telefone: string | null
  escritorio_email: string | null
  escritorio_endereco: string | null
  escritorio_logo: string | null
  notificar_prazo_vencido: boolean
  notificar_prazo_proximo: boolean
  dias_antecedencia: number
  created_at: string
  updated_at: string
}

export interface UserPreferencesRow {
  id: string
  user_id: string
  theme: string
  notificacoes_email: boolean
  created_at: string
  updated_at: string
}

export class SettingsRepository {
  async getSettings(): Promise<SettingsRow | null> {
    return queryOne<SettingsRow>('SELECT * FROM settings LIMIT 1')
  }

  async getOrCreateSettings(): Promise<SettingsRow> {
    let settings = await this.getSettings()
    if (!settings) {
      settings = await queryOne<SettingsRow>(
        `INSERT INTO settings (escritorio_nome) VALUES ('Meu Escritório') RETURNING *`
      ) as SettingsRow
    }
    return settings
  }

  async updateSettings(data: Partial<SettingsRow>): Promise<SettingsRow | null> {
    const existing = await this.getSettings()
    if (!existing) {
      return this.getOrCreateSettings()
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.escritorio_nome !== undefined) { fields.push(`escritorio_nome = $${idx++}`); values.push(data.escritorio_nome) }
    if (data.escritorio_cnpj !== undefined) { fields.push(`escritorio_cnpj = $${idx++}`); values.push(data.escritorio_cnpj) }
    if (data.escritorio_telefone !== undefined) { fields.push(`escritorio_telefone = $${idx++}`); values.push(data.escritorio_telefone) }
    if (data.escritorio_email !== undefined) { fields.push(`escritorio_email = $${idx++}`); values.push(data.escritorio_email) }
    if (data.escritorio_endereco !== undefined) { fields.push(`escritorio_endereco = $${idx++}`); values.push(data.escritorio_endereco) }
    if (data.escritorio_logo !== undefined) { fields.push(`escritorio_logo = $${idx++}`); values.push(data.escritorio_logo) }
    if (data.notificar_prazo_vencido !== undefined) { fields.push(`notificar_prazo_vencido = $${idx++}`); values.push(data.notificar_prazo_vencido) }
    if (data.notificar_prazo_proximo !== undefined) { fields.push(`notificar_prazo_proximo = $${idx++}`); values.push(data.notificar_prazo_proximo) }
    if (data.dias_antecedencia !== undefined) { fields.push(`dias_antecedencia = $${idx++}`); values.push(data.dias_antecedencia) }

    if (fields.length === 0) return this.getSettings()

    const result = queryOne<SettingsRow>(
      `UPDATE settings SET ${fields.join(', ')} WHERE id = $${idx++} RETURNING *`,
      [...values, existing.id]
    )
    return result
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    return queryOne<UserPreferencesRow>(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    )
  }

  async upsertUserPreferences(userId: string, data: Partial<UserPreferencesRow>): Promise<UserPreferencesRow> {
    const existing = await this.getUserPreferences(userId)
    
    if (existing) {
      const fields: string[] = []
      const values: any[] = []
      let idx = 1

      if (data.theme !== undefined) { fields.push(`theme = $${idx++}`); values.push(data.theme) }
      if (data.notificacoes_email !== undefined) { fields.push(`notificacoes_email = $${idx++}`); values.push(data.notificacoes_email) }

      if (fields.length > 0) {
        values.push(userId)
        const result = await queryOne<UserPreferencesRow>(
          `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
          values
        )
        return result as UserPreferencesRow
      }
      return existing
    }

    const result = await queryOne<UserPreferencesRow>(
      `INSERT INTO user_preferences (user_id, theme, notificacoes_email) VALUES ($1, $2, $3) RETURNING *`,
      [userId, data.theme || 'dark', data.notificacoes_email || false]
    )
    return result as UserPreferencesRow
  }
}