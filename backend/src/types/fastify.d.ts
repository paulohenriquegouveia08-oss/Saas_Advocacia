import { UserRole, Permission } from '../config/permissions'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      nome: string
      email: string
      role: UserRole
      ativo: boolean
      permissions: Permission[]
      role_id?: string
      role_name?: string
    }
  }
}
