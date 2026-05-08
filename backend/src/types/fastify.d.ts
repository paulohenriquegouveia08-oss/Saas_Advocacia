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
    }
  }
}
