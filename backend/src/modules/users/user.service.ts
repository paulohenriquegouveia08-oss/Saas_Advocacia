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
    // Check if email already exists in our database
    const existing = await this.repository.findByEmail(data.email)
    if (existing) throw ApiError.conflict('Email já cadastrado')

    // Try public signup first (more reliable with valid credentials)
    const { data: signupData, error: signupError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        data: { nome: data.nome, role: data.role }
      }
    })

    if (signupError) {
      // If signup fails (e.g., email already in use), try to get the existing user
      if (signupError.message.includes('already been registered')) {
        throw ApiError.conflict('Email já está em uso. Utilize outro email.')
      }
      throw ApiError.internal(`Erro ao criar usuário: ${signupError.message}`)
    }

    if (!signupData.user) {
      throw ApiError.internal('Erro ao criar usuário: usuário não foi criado')
    }

    // Create user in our database
    const user = await this.repository.create({
      id: signupData.user.id,
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

    if (existing.role === 'admin_global') {
      throw ApiError.forbidden('Não é possível desativar o administrador global')
    }

    // Deactivate instead of hard delete
    await this.repository.update(id, { ativo: false })

    return { message: 'Usuário desativado com sucesso' }
  }
}
