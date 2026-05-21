import type { FastifyRequest, FastifyReply } from 'fastify'
import { ScheduleService } from './schedule.service'
import { createScheduleSchema, updateScheduleSchema, queryScheduleSchema } from './schedule.schema'

export class ScheduleController {
  private service = new ScheduleService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createScheduleSchema.parse(request.body)
      const userId = request.user!.id
      const event = await this.service.create(data, userId)
      return reply.status(201).send(event)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Erro ao criar evento', details: error })
    }
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryScheduleSchema.parse(request.query)
      const userId = request.user!.id
      const role = request.user!.role
      const events = await this.service.findAll(query, userId, role)
      return reply.send(events)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Erro ao listar eventos', details: error })
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const data = updateScheduleSchema.parse(request.body)
      const event = await this.service.update(id, data)
      return reply.send(event)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Erro ao atualizar evento', details: error })
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      await this.service.delete(id)
      return reply.status(204).send()
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Erro ao excluir evento', details: error })
    }
  }
}
