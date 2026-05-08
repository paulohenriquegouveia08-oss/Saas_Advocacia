import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from './user.service'
import { createUserSchema, updateUserSchema } from './user.schema'

const service = new UserService()

export class UserController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const users = await service.list()
    return reply.send(users)
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await service.getById(request.params.id)
    return reply.send(user)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createUserSchema.parse(request.body)
    const user = await service.create(data)
    return reply.status(201).send(user)
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateUserSchema.parse(request.body)
    const user = await service.update(request.params.id, data)
    return reply.send(user)
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await service.delete(request.params.id)
    return reply.send(result)
  }
}
