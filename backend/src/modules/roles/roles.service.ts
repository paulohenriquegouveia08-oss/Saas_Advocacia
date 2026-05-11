import { query, queryOne } from '../../config/database'
import { ApiError } from '../../utils/api-error'
import type { CreateRoleData, UpdateRoleData } from './roles.schema'

export class RolesService {
  async listRoles() {
    const roles = await query(`
      SELECT 
        r.id, 
        r.nome, 
        r.descricao, 
        r.created_at,
        COUNT(DISTINCT ur.user_id) as users_count,
        array_remove(array_agg(DISTINCT p.chave), NULL) as permissions
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id
      ORDER BY r.nome ASC
    `)
    
    return roles.map(r => ({
      ...r,
      users_count: parseInt(r.users_count || '0', 10),
      permissions: r.permissions || []
    }))
  }

  async getPermissions() {
    const permissions = await query(`
      SELECT id, nome, chave, grupo
      FROM permissions
      ORDER BY grupo ASC, nome ASC
    `)
    return permissions
  }

  async createRole(data: CreateRoleData) {
    // 1. Inserir a role
    const role = await queryOne<{ id: string }>(
      'INSERT INTO roles (nome, descricao) VALUES ($1, $2) RETURNING id',
      [data.nome, data.descricao || null]
    )

    if (!role) throw ApiError.internal('Erro ao criar cargo')

    // 2. Vincular permissões
    if (data.permissions && data.permissions.length > 0) {
      const placeholders = data.permissions.map((_, i) => `($1, (SELECT id FROM permissions WHERE chave = $${i + 2}))`).join(', ')
      await query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
        [role.id, ...data.permissions]
      )
    }

    return role
  }

  async updateRole(id: string, data: UpdateRoleData) {
    const current = await queryOne('SELECT id FROM roles WHERE id = $1', [id])
    if (!current) throw ApiError.notFound('Cargo não encontrado')

    if (data.nome || data.descricao !== undefined) {
      const updates = []
      const values = []
      let idx = 1

      if (data.nome) {
        updates.push(`nome = $${idx++}`)
        values.push(data.nome)
      }
      if (data.descricao !== undefined) {
        updates.push(`descricao = $${idx++}`)
        values.push(data.descricao || null)
      }

      values.push(id)
      await query(
        `UPDATE roles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`,
        values
      )
    }

    if (data.permissions) {
      // Deletar as antigas e inserir as novas
      await query('DELETE FROM role_permissions WHERE role_id = $1', [id])
      
      if (data.permissions.length > 0) {
        const placeholders = data.permissions.map((_, i) => `($1, (SELECT id FROM permissions WHERE chave = $${i + 2}))`).join(', ')
        await query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
          [id, ...data.permissions]
        )
      }
    }
  }

  async deleteRole(id: string) {
    const role = await queryOne('SELECT id, nome FROM roles WHERE id = $1', [id])
    if (!role) throw ApiError.notFound('Cargo não encontrado')

    if (['admin_global', 'funcionario', 'cliente'].includes(role.nome)) {
      throw ApiError.badRequest('Não é possível excluir os cargos padrões do sistema')
    }

    const usersCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1', [id])
    if (parseInt(usersCount?.count || '0', 10) > 0) {
      throw ApiError.badRequest('Não é possível excluir um cargo que possui usuários vinculados')
    }

    await query('DELETE FROM roles WHERE id = $1', [id])
  }
}
