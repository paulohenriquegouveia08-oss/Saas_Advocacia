import { DeadlineRepository } from './deadline.repository'
import { CreateDeadlineInput, UpdateDeadlineInput, DeadlineQueryInput } from './deadline.schema'
import { NotificationRepository } from '../notifications/notification.repository'
import { ApiError } from '../../utils/api-error'

export class DeadlineService {
  private repository = new DeadlineRepository()
  private notificationRepo = new NotificationRepository()

  async list(params: DeadlineQueryInput) {
    return this.repository.findAllWithUrgency(params)
  }

  async getById(id: string) {
    const deadline = await this.repository.findById(id)
    if (!deadline) throw ApiError.notFound('Prazo não encontrado')
    return deadline
  }

  async create(data: CreateDeadlineInput) {
    const deadline = await this.repository.create(data)

    // Auto-notify responsible user
    if (data.responsavel_id) {
      await this.notificationRepo.createIfNotExists({
        deadline_id: deadline.id,
        user_id: data.responsavel_id,
        tipo: 'prazo_proximo',
        mensagem: `Novo prazo atribuído: ${data.descricao || 'Sem descrição'} — Vencimento: ${data.data_vencimento}`,
      })
    }

    return deadline
  }

  async update(id: string, data: UpdateDeadlineInput) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Prazo não encontrado')
    return this.repository.update(id, data)
  }

  async complete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Prazo não encontrado')
    if (existing.status === 'concluido') throw ApiError.badRequest('Prazo já está concluído')

    const updated = await this.repository.update(id, { status: 'concluido' })

    // Mark related notifications as read
    await this.notificationRepo.markReadByDeadline(id)

    return updated
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw ApiError.notFound('Prazo não encontrado')
    const deleted = await this.repository.delete(id)
    if (!deleted) throw ApiError.internal('Erro ao excluir prazo')
    return { message: 'Prazo excluído com sucesso' }
  }

  async getTopUrgent(limit: number = 5) {
    return this.repository.findTopUrgent(limit)
  }
}
