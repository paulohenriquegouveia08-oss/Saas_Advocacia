import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middlewares/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/auth/me', async (request, reply) => {
    const user = request.user!
    
    return reply.send({
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      }
    })
  })
}