import { UserRepository } from './user.repository'
import { CreateUserInput, UpdateUserInput } from './user.schema'
import { supabaseAdmin } from '../../config/supabase'
import { ApiError } from '../../utils/api-error'
import { query } from '../../config/database'

export class UserService {
  private repository = new UserRepository()

  async list() {
    return this.repository.findAll()
  }

  async getById(id: string) {
    const user = await this.repository.findById(id)
    if (!user) throw ApiError.notFound('Usuário não encontrado')
    return user
  }

  async create(data: CreateUserInput) {
    const existing = await this.repository.findByEmail(data.email)
    if (existing) throw ApiError.conflict('Email já cadastrado')

    const { data: signupData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome, role: data.role }
    })

    if (signupError) {
      if (signupError.message.includes('already been registered') || 
          signupError.message.includes('already exists') ||
          signupError.message.includes('Invalid')) {
        throw ApiError.conflict('Email já está em uso. Utilize outro email.')
      }
      throw ApiError.internal(`Erro ao criar usuário: ${signupError.message}`)
    }

    if (!signupData.user) {
      throw ApiError.internal('Erro ao criar usuário: usuário não foi criado')
    }

    const user = await this.repository.create({
      id: signupData.user.id,
      nome: data.nome,
      email: data.email,
      role: data.role,
    })

    // Vincular automaticamente ao cargo baseado no role
    try {
      const roleResult = await query<{ id: string }>(
        'SELECT id FROM roles WHERE nome = $1 LIMIT 1',
        [data.role]
      )
      
      if (roleResult.length > 0) {
        await query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [signupData.user.id, roleResult[0].id]
        )
      }
    } catch (err) {
      console.warn('Erro ao vincular usuário ao cargo:', err)
    }

    return user
  }

  async update(id: string, data: UpdateUserInput) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Usuário não encontrado')

    const updated = await this.repository.update(id, data)
    return updated
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Usuário não encontrado')

    if (existing.role === 'admin_global') {
      throw ApiError.forbidden('Não é possível desativar o administrador global')
    }

    // Deactivate instead of hard delete
    await this.repository.update(id, { ativo: false })

    return { message: 'Usuário desativado com sucesso' }
  }
}
