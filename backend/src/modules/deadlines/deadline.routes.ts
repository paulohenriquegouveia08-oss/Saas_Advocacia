import { FastifyInstance } from 'fastify'
import { DeadlineController } from './deadline.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new DeadlineController()

export async function deadlineRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/deadlines', { preHandler: [requirePermission('deadlines:read')] }, controller.list)
  app.get('/deadlines/urgent', { preHandler: [requirePermission('deadlines:read')] }, controller.topUrgent)
  app.get<{ Params: { id: string } }>('/deadlines/:id', { preHandler: [requirePermission('deadlines:read')] }, controller.getById)
  app.post('/deadlines', { preHandler: [requirePermission('deadlines:create')] }, controller.create)
  app.put<{ Params: { id: string } }>('/deadlines/:id', { preHandler: [requirePermission('deadlines:update')] }, controller.update)
  app.patch<{ Params: { id: string } }>('/deadlines/:id/complete', { preHandler: [requirePermission('deadlines:complete')] }, controller.complete)
  app.delete<{ Params: { id: string } }>('/deadlines/:id', { preHandler: [requirePermission('deadlines:delete')] }, controller.delete)
}
