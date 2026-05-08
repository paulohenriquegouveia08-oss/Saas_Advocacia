import { FastifyRequest, FastifyReply } from 'fastify'
import { NotificationService } from './notification.service'
import { notificationQuerySchema } from './notification.schema'

const service = new NotificationService()

export class NotificationController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const params = notificationQuerySchema.parse(request.query)
    const result = await service.list(request.user!.id, params)
    return reply.send(result)
  }

  async markAsRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const notification = await service.markAsRead(request.params.id, request.user!.id)
    return reply.send(notification)
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const result = await service.markAllAsRead(request.user!.id)
    return reply.send(result)
  }

  async unreadCount(request: FastifyRequest, reply: FastifyReply) {
    const result = await service.getUnreadCount(request.user!.id)
    return reply.send(result)
  }
}
