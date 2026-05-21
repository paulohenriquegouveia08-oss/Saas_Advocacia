import 'fastify'
import { FastifyRequest, FastifyReply } from 'fastify'
import { supabaseAdmin } from '../config/supabase'
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

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('id, nome, email, role, ativo')
    .eq('id', authUser.id)
    .single()

  if (!dbUser) {
    throw ApiError.forbidden('Usuário não encontrado no sistema')
  }

  if (!dbUser.ativo) {
    throw ApiError.forbidden('Usuário desativado')
  }

  let permissions: string[] = []
  let userRoleId: string | null = null
  let userRoleName: string = dbUser.role

  try {
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(nome)')
      .eq('user_id', dbUser.id)
      .limit(1)
      .single()

    if (roleData) {
      userRoleId = roleData.role_id
      userRoleName = (roleData as any).roles?.nome || dbUser.role

      const { data: perms } = await supabaseAdmin
        .from('role_permissions')
        .select('permissions(chave)')
        .eq('role_id', roleData.role_id)

      permissions = (perms || [])
        .map((p: any) => p.permissions?.chave)
        .filter(Boolean)
    }
  } catch (err) {
    console.warn('Erro ao buscar permissões do cargo:', err)
  }

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
