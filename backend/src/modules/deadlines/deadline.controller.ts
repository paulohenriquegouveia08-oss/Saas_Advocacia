import { FastifyRequest, FastifyReply } from 'fastify'
import { DeadlineService } from './deadline.service'
import { createDeadlineSchema, updateDeadlineSchema, deadlineQuerySchema } from './deadline.schema'

const service = new DeadlineService()

export class DeadlineController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const params = deadlineQuerySchema.parse(request.query)
    const result = await service.list(params)
    return reply.send(result)
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deadline = await service.getById(request.params.id)
    return reply.send(deadline)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createDeadlineSchema.parse(request.body)
    const deadline = await service.create(data)
    return reply.status(201).send(deadline)
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateDeadlineSchema.parse(request.body)
    const deadline = await service.update(request.params.id, data)
    return reply.send(deadline)
  }

  async complete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deadline = await service.complete(request.params.id)
    return reply.send(deadline)
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await service.delete(request.params.id)
    return reply.send(result)
  }

  async topUrgent(request: FastifyRequest, reply: FastifyReply) {
    const deadlines = await service.getTopUrgent(5)
    return reply.send(deadlines)
  }
}
