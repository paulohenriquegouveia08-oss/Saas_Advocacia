import { FinancialRepository } from './financial.repository'
import { CreateFinancialInput, UpdateFinancialInput, FinancialQueryInput } from './financial.schema'
import { ApiError } from '../../utils/api-error'

export class FinancialService {
  private repository = new FinancialRepository()

  async list(params: FinancialQueryInput) {
    return this.repository.findAll(params)
  }

  async getById(id: string) {
    const transaction = await this.repository.findById(id)
    if (!transaction) throw ApiError.notFound('Transação não encontrada')
    return transaction
  }

  async getSummary() {
    return this.repository.getSummary()
  }

  async create(data: CreateFinancialInput) {
    return this.repository.create(data)
  }

  async update(id: string, data: UpdateFinancialInput) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Transação não encontrada')
    return this.repository.update(id, data)
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Transação não encontrada')
    const deleted = await this.repository.delete(id)
    if (!deleted) throw ApiError.internal('Erro ao excluir transação')
    return { message: 'Transação excluída com sucesso' }
  }
}
