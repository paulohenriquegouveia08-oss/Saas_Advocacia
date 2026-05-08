import { FastifyInstance } from 'fastify'
import { ProcessController } from './process.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new ProcessController()

export async function processRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/processes', { preHandler: [requirePermission('processes:read')] }, controller.list)
  app.get<{ Params: { id: string } }>('/processes/:id', { preHandler: [requirePermission('processes:read')] }, controller.getById)
  app.post('/processes', { preHandler: [requirePermission('processes:create')] }, controller.create)
  app.put<{ Params: { id: string } }>('/processes/:id', { preHandler: [requirePermission('processes:update')] }, controller.update)
  app.delete<{ Params: { id: string } }>('/processes/:id', { preHandler: [requirePermission('processes:delete')] }, controller.delete)

  // Movements sub-resource
  app.get<{ Params: { id: string } }>('/processes/:id/movements', { preHandler: [requirePermission('movements:read')] }, controller.listMovements)
  app.post<{ Params: { id: string } }>('/processes/:id/movements', { preHandler: [requirePermission('movements:create')] }, controller.createMovement)
}
