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

    try {
      const { data: roleResult } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('nome', data.role)
        .limit(1)
        .single()

      if (roleResult) {
        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: signupData.user.id, role_id: roleResult.id })
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

  async delete(id: string, requesterId?: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Usuário não encontrado')

    if (id === requesterId) {
      throw ApiError.forbidden('Você não pode remover o seu próprio usuário enquanto está logado.')
    }

    // Desativa no banco de dados
    await this.repository.update(id, { ativo: false })
    
    // Tenta remover completamente do Auth do Supabase para limpar o acesso
    try {
      await supabaseAdmin.auth.admin.deleteUser(id)
      await this.repository.delete(id)
    } catch (err) {
      console.warn('Erro ao remover usuário do auth:', err)
    }

    return { message: 'Usuário removido com sucesso' }
  }
}
