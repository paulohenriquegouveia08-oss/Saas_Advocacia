import { SettingsRepository, SettingsRow, UserPreferencesRow } from './settings.repository'
import { SettingsInput, UserPreferencesInput } from './settings.schema'
import { ApiError } from '../../utils/api-error'

export class SettingsService {
  private repository = new SettingsRepository()

  async getSettings(): Promise<SettingsRow | null> {
    let settings = await this.repository.getSettings()
    if (!settings) {
      settings = await this.repository.getOrCreateSettings()
    }
    return settings
  }

  async updateSettings(data: SettingsInput): Promise<SettingsRow | null> {
    const cleanData: Record<string, string | number | boolean | null> = {}
    if (data.escritorio_nome !== undefined) cleanData.escritorio_nome = data.escritorio_nome
    if (data.escritorio_cnpj !== undefined) cleanData.escritorio_cnpj = data.escritorio_cnpj
    if (data.escritorio_telefone !== undefined) cleanData.escritorio_telefone = data.escritorio_telefone
    if (data.escritorio_email !== undefined) cleanData.escritorio_email = data.escritorio_email
    if (data.escritorio_endereco !== undefined) cleanData.escritorio_endereco = data.escritorio_endereco
    if (data.notificar_prazo_vencido !== undefined) cleanData.notificar_prazo_vencido = data.notificar_prazo_vencido ?? false
    if (data.notificar_prazo_proximo !== undefined) cleanData.notificar_prazo_proximo = data.notificar_prazo_proximo ?? false
    if (data.dias_antecedencia !== undefined) cleanData.dias_antecedencia = data.dias_antecedencia ?? 3

    return this.repository.updateSettings(cleanData as Partial<SettingsRow>)
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    let prefs = await this.repository.getUserPreferences(userId)
    if (!prefs) {
      prefs = await this.repository.upsertUserPreferences(userId, {})
    }
    return prefs
  }

  async updateUserPreferences(userId: string, data: UserPreferencesInput): Promise<UserPreferencesRow> {
    const cleanData: { theme?: string; notificacoes_email?: boolean } = {}
    if (data.theme !== undefined) cleanData.theme = data.theme ?? 'dark'
    if (data.notificacoes_email !== undefined) cleanData.notificacoes_email = data.notificacoes_email ?? false

    return this.repository.upsertUserPreferences(userId, cleanData)
  }
}