import { FastifyInstance } from 'fastify'
import { RolesController } from './roles.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { requirePermission } from '../../middlewares/permission.middleware'

export async function rolesRoutes(app: FastifyInstance) {
  const controller = new RolesController()

  // Todas as rotas de cargos requerem estar autenticado e ter permissão de admin_global
  // Como admin_global não tem uma "permissão" específica configurada só para cargos ainda,
  // ou podemos usar requirePermission('settings:read') / requirePermission('users:read').
  // A regra de negócio diz: Apenas admin_global acessa essa página.
  // Vamos criar um hook customizado para admin_global.
  
  app.addHook('preHandler', authMiddleware)
  app.addHook('preHandler', async (req, rep) => {
    if (req.user?.role_name !== 'admin_global' && req.user?.role !== 'admin_global') {
      return rep.status(403).send({ message: 'Apenas admin global pode acessar.' })
    }
  })

  app.get('/', controller.listRoles)
  app.get('/permissions', controller.getPermissions)
  app.post('/', controller.createRole)
  app.put('/:id', controller.updateRole)
  app.delete('/:id', controller.deleteRole)
}
