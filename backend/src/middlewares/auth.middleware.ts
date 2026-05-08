import { FastifyRequest, FastifyReply } from 'fastify'
import { supabaseAdmin } from '../config/supabase'
import { queryOne } from '../config/database'
import { getPermissionsForRole, UserRole } from '../config/permissions'
import { ApiError } from '../utils/api-error'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token não fornecido')
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !authUser) {
    throw ApiError.unauthorized('Token inválido ou expirado')
  }

  const dbUser = await queryOne<{
    id: string
    nome: string
    email: string
    role: UserRole
    ativo: boolean
  }>(
    'SELECT id, nome, email, role, ativo FROM users WHERE id = $1',
    [authUser.id]
  )

  if (!dbUser) {
    throw ApiError.forbidden('Usuário não encontrado no sistema')
  }

  if (!dbUser.ativo) {
    throw ApiError.forbidden('Usuário desativado')
  }

  request.user = {
    ...dbUser,
    permissions: getPermissionsForRole(dbUser.role),
  }
}
