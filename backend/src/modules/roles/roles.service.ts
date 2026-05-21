import { supabaseAdmin } from '../../config/supabase'
import { ApiError } from '../../utils/api-error'
import type { CreateRoleData, UpdateRoleData } from './roles.schema'

export class RolesService {
  async listRoles() {
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('id, nome, descricao, created_at')
      .order('nome', { ascending: true })

    if (!roles || roles.length === 0) return []

    const roleIds = roles.map(r => r.id)

    const { data: userRoleCounts } = await supabaseAdmin
      .from('user_roles')
      .select('role_id')
      .in('role_id', roleIds)

    const { data: rolePerms } = await supabaseAdmin
      .from('role_permissions')
      .select('role_id, permissions(chave)')
      .in('role_id', roleIds)

    const countMap: Record<string, number> = {}
    if (userRoleCounts) {
      for (const ur of userRoleCounts) {
        countMap[ur.role_id] = (countMap[ur.role_id] || 0) + 1
      }
    }

    const permMap: Record<string, string[]> = {}
    if (rolePerms) {
      for (const rp of rolePerms) {
        const key = rp.role_id
        if (!permMap[key]) permMap[key] = []
        const perm = (rp as any).permissions?.chave
        if (perm && !permMap[key].includes(perm)) permMap[key].push(perm)
      }
    }

    return roles.map(r => ({
      ...r,
      users_count: countMap[r.id] || 0,
      permissions: permMap[r.id] || [],
    }))
  }

  async getPermissions() {
    const { data } = await supabaseAdmin
      .from('permissions')
      .select('id, nome, chave, grupo')
      .order('grupo', { ascending: true })
      .order('nome', { ascending: true })
    return data || []
  }

  async createRole(data: CreateRoleData) {
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert({ nome: data.nome, descricao: data.descricao || null })
      .select('id')
      .single()

    if (error || !role) throw ApiError.internal('Erro ao criar cargo')

    if (data.permissions && data.permissions.length > 0) {
      const { data: perms } = await supabaseAdmin
        .from('permissions')
        .select('id, chave')
        .in('chave', data.permissions)

      if (perms) {
        const rolePerms = perms.map(p => ({ role_id: role.id, permission_id: p.id }))
        await supabaseAdmin.from('role_permissions').insert(rolePerms)
      }
    }

    return role
  }

  async updateRole(id: string, data: UpdateRoleData) {
    const { data: current } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('id', id)
      .single()

    if (!current) throw ApiError.notFound('Cargo não encontrado')

    if (data.nome || data.descricao !== undefined) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (data.nome) updateData.nome = data.nome
      if (data.descricao !== undefined) updateData.descricao = data.descricao || null

      await supabaseAdmin
        .from('roles')
        .update(updateData)
        .eq('id', id)
    }

    if (data.permissions) {
      await supabaseAdmin.from('role_permissions').delete().eq('role_id', id)

      if (data.permissions.length > 0) {
        const { data: perms } = await supabaseAdmin
          .from('permissions')
          .select('id, chave')
          .in('chave', data.permissions)

        if (perms) {
          const rolePerms = perms.map(p => ({ role_id: id, permission_id: p.id }))
          await supabaseAdmin.from('role_permissions').insert(rolePerms)
        }
      }
    }
  }

  async deleteRole(id: string) {
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (!role) throw ApiError.notFound('Cargo não encontrado')

    if (['admin_global', 'funcionario', 'cliente'].includes(role.nome)) {
      throw ApiError.badRequest('Não é possível excluir os cargos padrões do sistema')
    }

    const { count } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)

    if ((count || 0) > 0) {
      throw ApiError.badRequest('Não é possível excluir um cargo que possui usuários vinculados')
    }

    await supabaseAdmin.from('roles').delete().eq('id', id)
  }
}
