import { FastifyInstance } from 'fastify'
import { ClientController } from './client.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new ClientController()

export async function clientRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/clients', { preHandler: [requirePermission('clients:read')] }, controller.list)
  app.get<{ Params: { id: string } }>('/clients/:id', { preHandler: [requirePermission('clients:read')] }, controller.getById)
  app.post('/clients', { preHandler: [requirePermission('clients:create')] }, controller.create)
  app.put<{ Params: { id: string } }>('/clients/:id', { preHandler: [requirePermission('clients:update')] }, controller.update)
  app.delete<{ Params: { id: string } }>('/clients/:id', { preHandler: [requirePermission('clients:delete')] }, controller.delete)
}
