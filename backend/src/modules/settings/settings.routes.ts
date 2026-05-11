import { FastifyInstance } from 'fastify'
import { SettingsController } from './settings.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new SettingsController()

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // Settings do escritório - apenas admin_global
  app.get('/settings', { preHandler: [requirePermission('settings:read')] }, controller.getSettings)
  app.put('/settings', { preHandler: [requirePermission('settings:update')] }, controller.updateSettings)

  // Preferências do usuário - qualquer usuário autenticado
  app.get('/settings/preferences', controller.getUserPreferences)
  app.put('/settings/preferences', controller.updateUserPreferences)
}