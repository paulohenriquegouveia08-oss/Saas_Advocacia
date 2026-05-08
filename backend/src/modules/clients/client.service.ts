import { ClientRepository } from './client.repository'
import { CreateClientInput, UpdateClientInput, ClientQueryInput } from './client.schema'
import { ApiError } from '../../utils/api-error'

export class ClientService {
  private repository = new ClientRepository()

  async list(params: ClientQueryInput) {
    return this.repository.findAll(params)
  }

  async getById(id: string) {
    const client = await this.repository.findById(id)
    if (!client) throw ApiError.notFound('Cliente não encontrado')
    return client
  }

  async create(data: CreateClientInput) {
    return this.repository.create(data)
  }

  async update(id: string, data: UpdateClientInput) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Cliente não encontrado')
    return this.repository.update(id, data)
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Cliente não encontrado')
    const deleted = await this.repository.delete(id)
    if (!deleted) throw ApiError.internal('Erro ao excluir cliente')
    return { message: 'Cliente excluído com sucesso' }
  }
}
