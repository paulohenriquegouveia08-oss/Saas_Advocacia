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
    return this.repository.updateSettings(data)
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    let prefs = await this.repository.getUserPreferences(userId)
    if (!prefs) {
      prefs = await this.repository.upsertUserPreferences(userId, {})
    }
    return prefs
  }

  async updateUserPreferences(userId: string, data: UserPreferencesInput): Promise<UserPreferencesRow> {
    return this.repository.upsertUserPreferences(userId, data)
  }
}