import { ProcessRepository } from './process.repository'
import { CreateProcessInput, UpdateProcessInput, ProcessQueryInput, CreateMovementInput } from './process.schema'
import { ApiError } from '../../utils/api-error'

export class ProcessService {
  private repository = new ProcessRepository()

  async list(params: ProcessQueryInput) {
    return this.repository.findAll(params)
  }

  async getById(id: string) {
    const process = await this.repository.findById(id)
    if (!process) throw ApiError.notFound('Processo não encontrado')
    return process
  }

  async create(data: CreateProcessInput) {
    // Check unique numero
    const existing = await this.repository.findByNumero(data.numero)
    if (existing) throw ApiError.conflict('Número de processo já cadastrado')
    return this.repository.create(data)
  }

  async update(id: string, data: UpdateProcessInput) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Processo não encontrado')

    if (data.numero) {
      const byNumero = await this.repository.findByNumero(data.numero)
      if (byNumero && byNumero.id !== id) throw ApiError.conflict('Número de processo já em uso')
    }

    return this.repository.update(id, data)
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Processo não encontrado')
    const deleted = await this.repository.delete(id)
    if (!deleted) throw ApiError.internal('Erro ao excluir processo')
    return { message: 'Processo excluído com sucesso' }
  }

  // Movements
  async listMovements(processId: string) {
    const process = await this.repository.findById(processId)
    if (!process) throw ApiError.notFound('Processo não encontrado')
    return this.repository.findMovements(processId)
  }

  async createMovement(processId: string, data: CreateMovementInput) {
    const process = await this.repository.findById(processId)
    if (!process) throw ApiError.notFound('Processo não encontrado')
    return this.repository.createMovement({ process_id: processId, ...data })
  }
}
