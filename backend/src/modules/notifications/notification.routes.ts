import { FastifyInstance } from 'fastify'
import { NotificationController } from './notification.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new NotificationController()

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/notifications', { preHandler: [requirePermission('notifications:read')] }, controller.list)
  app.get('/notifications/unread-count', { preHandler: [requirePermission('notifications:read')] }, controller.unreadCount)
  app.patch<{ Params: { id: string } }>('/notifications/:id/read', { preHandler: [requirePermission('notifications:update')] }, controller.markAsRead)
  app.patch('/notifications/read-all', { preHandler: [requirePermission('notifications:update')] }, controller.markAllAsRead)
}
