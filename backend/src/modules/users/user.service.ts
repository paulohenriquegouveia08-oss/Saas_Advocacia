import { UserRepository } from './user.repository'
import { CreateUserInput, UpdateUserInput } from './user.schema'
import { supabaseAdmin } from '../../config/supabase'
import { ApiError } from '../../utils/api-error'

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
    // Check if email already exists
    const existing = await this.repository.findByEmail(data.email)
    if (existing) throw ApiError.conflict('Email já cadastrado')

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw ApiError.internal(`Erro ao criar usuário no auth: ${authError?.message}`)
    }

    // Create user in our database
    const user = await this.repository.create({
      id: authData.user.id,
      nome: data.nome,
      email: data.email,
      role: data.role,
    })

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

    // Deactivate instead of hard delete
    await this.repository.update(id, { ativo: false })

    return { message: 'Usuário desativado com sucesso' }
  }
}
