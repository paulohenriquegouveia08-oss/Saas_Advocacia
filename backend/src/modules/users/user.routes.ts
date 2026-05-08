import { FastifyInstance } from 'fastify'
import { UserController } from './user.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

const controller = new UserController()

export async function userRoutes(app: FastifyInstance) {
  // All user routes require authentication
  app.addHook('onRequest', authMiddleware)

  app.get('/users', { preHandler: [requirePermission('users:read')] }, controller.list)
  app.get<{ Params: { id: string } }>('/users/:id', { preHandler: [requirePermission('users:read')] }, controller.getById)
  app.post('/users', { preHandler: [requirePermission('users:create')] }, controller.create)
  app.put<{ Params: { id: string } }>('/users/:id', { preHandler: [requirePermission('users:update')] }, controller.update)
  app.delete<{ Params: { id: string } }>('/users/:id', { preHandler: [requirePermission('users:delete')] }, controller.delete)
}
