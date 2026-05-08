import { FastifyRequest, FastifyReply } from 'fastify'
import { ClientService } from './client.service'
import { createClientSchema, updateClientSchema, clientQuerySchema } from './client.schema'

const service = new ClientService()

export class ClientController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const params = clientQuerySchema.parse(request.query)
    const result = await service.list(params)
    return reply.send(result)
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const client = await service.getById(request.params.id)
    return reply.send(client)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createClientSchema.parse(request.body)
    const client = await service.create(data)
    return reply.status(201).send(client)
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateClientSchema.parse(request.body)
    const client = await service.update(request.params.id, data)
    return reply.send(client)
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await service.delete(request.params.id)
    return reply.send(result)
  }
}
