import { FastifyRequest, FastifyReply } from 'fastify'
import { ProcessService } from './process.service'
import { createProcessSchema, updateProcessSchema, processQuerySchema, createMovementSchema } from './process.schema'

const service = new ProcessService()

export class ProcessController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const params = processQuerySchema.parse(request.query)
    const result = await service.list(params)
    return reply.send(result)
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const process = await service.getById(request.params.id)
    return reply.send(process)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createProcessSchema.parse(request.body)
    const process = await service.create(data)
    return reply.status(201).send(process)
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateProcessSchema.parse(request.body)
    const process = await service.update(request.params.id, data)
    return reply.send(process)
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await service.delete(request.params.id)
    return reply.send(result)
  }

  async listMovements(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const movements = await service.listMovements(request.params.id)
    return reply.send(movements)
  }

  async createMovement(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = createMovementSchema.parse(request.body)
    const movement = await service.createMovement(request.params.id, data)
    return reply.status(201).send(movement)
  }
}
