import { FastifyInstance } from 'fastify'
import { FinancialController } from './financial.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new FinancialController()

export async function financialRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/financial', { preHandler: [requirePermission('financial:read')] }, controller.list)
  app.get('/financial/summary', { preHandler: [requirePermission('financial:read')] }, controller.summary)
  app.get<{ Params: { id: string } }>('/financial/:id', { preHandler: [requirePermission('financial:read')] }, controller.getById)
  app.post('/financial', { preHandler: [requirePermission('financial:create')] }, controller.create)
  app.put<{ Params: { id: string } }>('/financial/:id', { preHandler: [requirePermission('financial:update')] }, controller.update)
  app.delete<{ Params: { id: string } }>('/financial/:id', { preHandler: [requirePermission('financial:delete')] }, controller.delete)
}
