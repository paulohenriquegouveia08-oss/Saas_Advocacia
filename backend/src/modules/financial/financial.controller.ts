import { FastifyRequest, FastifyReply } from 'fastify'
import { FinancialService } from './financial.service'
import { createFinancialSchema, updateFinancialSchema, financialQuerySchema } from './financial.schema'

const service = new FinancialService()

export class FinancialController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const params = financialQuerySchema.parse(request.query)
    const result = await service.list(params)
    return reply.send(result)
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const transaction = await service.getById(request.params.id)
    return reply.send(transaction)
  }

  async summary(request: FastifyRequest, reply: FastifyReply) {
    const result = await service.getSummary()
    return reply.send(result)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createFinancialSchema.parse(request.body)
    const transaction = await service.create(data)
    return reply.status(201).send(transaction)
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateFinancialSchema.parse(request.body)
    const transaction = await service.update(request.params.id, data)
    return reply.send(transaction)
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await service.delete(request.params.id)
    return reply.send(result)
  }
}
