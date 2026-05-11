import { FastifyReply, FastifyRequest } from 'fastify'
import { RolesService } from './roles.service'
import { createRoleSchema, updateRoleSchema } from './roles.schema'

const rolesService = new RolesService()

export class RolesController {
  async listRoles(request: FastifyRequest, reply: FastifyReply) {
    const roles = await rolesService.listRoles()
    return reply.send({ data: roles })
  }

  async getPermissions(request: FastifyRequest, reply: FastifyReply) {
    const permissions = await rolesService.getPermissions()
    return reply.send({ data: permissions })
  }

  async createRole(request: FastifyRequest, reply: FastifyReply) {
    const data = createRoleSchema.parse(request.body)
    const role = await rolesService.createRole(data)
    return reply.status(201).send({ data: role })
  }

  async updateRole(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = updateRoleSchema.parse(request.body)
    await rolesService.updateRole(request.params.id, data)
    return reply.send({ success: true })
  }

  async deleteRole(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await rolesService.deleteRole(request.params.id)
    return reply.send({ success: true })
  }
}
