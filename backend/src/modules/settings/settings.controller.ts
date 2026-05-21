import { FastifyRequest, FastifyReply } from 'fastify'
import { SettingsService } from './settings.service'
import { settingsSchema, userPreferencesSchema } from './settings.schema'
import { AuthUser } from '../../middlewares/auth.middleware'

const service = new SettingsService()

export class SettingsController {
  async getSettings(_request: FastifyRequest, reply: FastifyReply) {
    const settings = await service.getSettings()
    return reply.send(settings)
  }

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    const data = settingsSchema.parse(request.body)
    const settings = await service.updateSettings(data)
    return reply.send(settings)
  }

  async getUserPreferences(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as AuthUser
    const prefs = await service.getUserPreferences(user.id)
    return reply.send(prefs)
  }

  async updateUserPreferences(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as AuthUser
    const data = userPreferencesSchema.parse(request.body)
    const prefs = await service.updateUserPreferences(user.id, data)
    return reply.send(prefs)
  }
}