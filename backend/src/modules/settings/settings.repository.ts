import { supabaseAdmin } from '../../config/supabase'

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
    const { data } = await supabaseAdmin
      .from('settings')
      .select('*')
      .limit(1)
      .single()
    return (data || null) as SettingsRow | null
  }

  async getOrCreateSettings(): Promise<SettingsRow> {
    let settings = await this.getSettings()
    if (!settings) {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .insert({ escritorio_nome: 'Meu Escritório' })
        .select()
        .single()
      if (error || !data) throw error
      settings = data as SettingsRow
    }
    return settings
  }

  async updateSettings(data: Partial<SettingsRow>): Promise<SettingsRow | null> {
    const existing = await this.getSettings()
    if (!existing) {
      return this.getOrCreateSettings()
    }

    const updateData: Record<string, any> = {}
    if (data.escritorio_nome !== undefined) updateData.escritorio_nome = data.escritorio_nome
    if (data.escritorio_cnpj !== undefined) updateData.escritorio_cnpj = data.escritorio_cnpj
    if (data.escritorio_telefone !== undefined) updateData.escritorio_telefone = data.escritorio_telefone
    if (data.escritorio_email !== undefined) updateData.escritorio_email = data.escritorio_email
    if (data.escritorio_endereco !== undefined) updateData.escritorio_endereco = data.escritorio_endereco
    if (data.escritorio_logo !== undefined) updateData.escritorio_logo = data.escritorio_logo
    if (data.notificar_prazo_vencido !== undefined) updateData.notificar_prazo_vencido = data.notificar_prazo_vencido
    if (data.notificar_prazo_proximo !== undefined) updateData.notificar_prazo_proximo = data.notificar_prazo_proximo
    if (data.dias_antecedencia !== undefined) updateData.dias_antecedencia = data.dias_antecedencia

    if (Object.keys(updateData).length === 0) return this.getSettings()

    const { data: result } = await supabaseAdmin
      .from('settings')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()
    return (result || null) as SettingsRow | null
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    const { data } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    return (data || null) as UserPreferencesRow | null
  }

  async upsertUserPreferences(userId: string, data: Partial<UserPreferencesRow>): Promise<UserPreferencesRow> {
    const existing = await this.getUserPreferences(userId)

    if (existing) {
      const updateData: Record<string, any> = {}
      if (data.theme !== undefined) updateData.theme = data.theme
      if (data.notificacoes_email !== undefined) updateData.notificacoes_email = data.notificacoes_email

      if (Object.keys(updateData).length > 0) {
        const { data: result } = await supabaseAdmin
          .from('user_preferences')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single()
        return (result || existing) as UserPreferencesRow
      }
      return existing
    }

    const { data: result, error } = await supabaseAdmin
      .from('user_preferences')
      .insert({
        user_id: userId,
        theme: data.theme || 'dark',
        notificacoes_email: data.notificacoes_email || false,
      })
      .select()
      .single()
    if (error || !result) throw error
    return result as UserPreferencesRow
  }
}
