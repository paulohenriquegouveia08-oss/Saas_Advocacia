import { NotificationRepository } from './notification.repository'
import { NotificationQueryInput } from './notification.schema'
import { ApiError } from '../../utils/api-error'

export class NotificationService {
  private repository = new NotificationRepository()

  async list(userId: string, params: NotificationQueryInput) {
    return this.repository.findByUser(userId, params)
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repository.markAsRead(id, userId)
    if (!notification) throw ApiError.notFound('Notificação não encontrada')
    return notification
  }

  async markAllAsRead(userId: string) {
    const count = await this.repository.markAllAsRead(userId)
    return { message: `${count} notificações marcadas como lidas` }
  }

  async getUnreadCount(userId: string) {
    const count = await this.repository.getUnreadCount(userId)
    return { count }
  }
}
