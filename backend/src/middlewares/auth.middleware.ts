import 'fastify'
import { FastifyRequest, FastifyReply } from 'fastify'
import { supabaseAdmin } from '../config/supabase'
import { queryOne } from '../config/database'
import { getPermissionsForRole, UserRole, Permission } from '../config/permissions'
import { ApiError } from '../utils/api-error'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  role_id: string
  role_name: string
  permissions: Permission[]
}

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
    `SELECT id, nome, email, role, ativo FROM users WHERE id = $1`,
    [authUser.id]
  )

  if (!dbUser) {
    throw ApiError.forbidden('Usuário não encontrado no sistema')
  }

  if (!dbUser.ativo) {
    throw ApiError.forbidden('Usuário desativado')
  }

  // Buscar permissões do cargo vinculado ao usuário no banco de dados
  let permissions: string[] = []
  let userRoleId: string | null = null
  let userRoleName: string = dbUser.role
  
  try {
    const roleData = await queryOne<{ role_id: string | null; role_name: string | null }>(
      `SELECT ur.role_id, r.nome as role_name 
       FROM user_roles ur 
       JOIN roles r ON r.id = ur.role_id 
       WHERE ur.user_id = $1 LIMIT 1`,
      [dbUser.id]
    )
    
    if (roleData?.role_id) {
      userRoleId = roleData.role_id
      userRoleName = roleData.role_name || dbUser.role

      const perms = await queryOne<{ chaves: string[] }>(
        `SELECT array_agg(p.chave) as chaves 
         FROM role_permissions rp 
         JOIN permissions p ON p.id = rp.permission_id 
         WHERE rp.role_id = $1`,
        [roleData.role_id]
      )
      permissions = perms?.chaves?.filter(Boolean) || []
    }
  } catch (err) {
    console.warn('Erro ao buscar permissões do cargo:', err)
  }

  // Fallback: só usa permissões hardcoded se o usuário NÃO tiver cargo vinculado
  if (!userRoleId && permissions.length === 0) {
    console.log(`[Auth] Usuário ${dbUser.email} sem cargo vinculado. Usando permissões padrão para role: ${dbUser.role}`)
    permissions = getPermissionsForRole(dbUser.role)
  }

  request.user = {
    id: dbUser.id,
    nome: dbUser.nome,
    email: dbUser.email,
    role: dbUser.role,
    ativo: dbUser.ativo,
    role_id: userRoleId,
    role_name: userRoleName,
    permissions: permissions as Permission[],
  } as AuthUser
}
