import { FastifyRequest, FastifyReply } from 'fastify'
import { Permission, hasPermission } from '../config/permissions'
import { ApiError } from '../utils/api-error'

export function requirePermission(...permissions: Permission[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user

    if (!user) {
      throw ApiError.unauthorized('Não autenticado')
    }

    const hasAll = permissions.every((p) => hasPermission(user.role, p))

    if (!hasAll) {
      throw ApiError.forbidden(
        `Sem permissão. Requerido: ${permissions.join(', ')}`
      )
    }
  }
}
