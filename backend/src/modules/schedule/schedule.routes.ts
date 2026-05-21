import type { FastifyInstance } from 'fastify'
import { ScheduleController } from './schedule.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

export async function scheduleRoutes(app: FastifyInstance) {
  const controller = new ScheduleController()

  app.addHook('preHandler', authMiddleware)

  app.get('/schedule', { preHandler: [requirePermission('schedule:read')] }, controller.findAll.bind(controller))
  app.post('/schedule', { preHandler: [requirePermission('schedule:create')] }, controller.create.bind(controller))
  app.put<{ Params: { id: string } }>('/schedule/:id', { preHandler: [requirePermission('schedule:update')] }, controller.update.bind(controller))
  app.delete<{ Params: { id: string } }>('/schedule/:id', { preHandler: [requirePermission('schedule:delete')] }, controller.delete.bind(controller))
}
