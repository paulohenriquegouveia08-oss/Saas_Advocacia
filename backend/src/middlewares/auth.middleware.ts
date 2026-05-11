import { FastifyRequest, FastifyReply } from 'fastify'
import { supabaseAdmin } from '../config/supabase'
import { queryOne } from '../config/database'
import { getPermissionsForRole, UserRole, Permission } from '../config/permissions'
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
    role_id: string
    role_name: string
  }>(
    `SELECT u.id, u.nome, u.email, u.role, u.ativo, ur.role_id, r.nome as role_name 
     FROM users u 
     LEFT JOIN user_roles ur ON ur.user_id = u.id 
     LEFT JOIN roles r ON r.id = ur.role_id 
     WHERE u.id = $1 LIMIT 1`,
    [authUser.id]
  )

  if (!dbUser) {
    throw ApiError.forbidden('Usuário não encontrado no sistema')
  }

  if (!dbUser.ativo) {
    throw ApiError.forbidden('Usuário desativado')
  }

  let permissions: string[] = []
  
  if (dbUser.role_id) {
    // Buscar permissões dinâmicas do banco de dados
    const perms = await queryOne<{ chaves: string[] }>(
      `SELECT array_agg(p.chave) as chaves 
       FROM role_permissions rp 
       JOIN permissions p ON p.id = rp.permission_id 
       WHERE rp.role_id = $1`,
      [dbUser.role_id]
    )
    permissions = perms?.chaves || []
  } else {
    // Fallback: usar config hardcoded caso não tenha migrado
    permissions = getPermissionsForRole(dbUser.role)
  }

  request.user = {
    ...dbUser,
    permissions: permissions as Permission[],
  }
}
