export type UserRole = 'admin_global' | 'funcionario' | 'cliente'

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  created_at: string
}

export interface CreateUserData {
  nome: string
  email: string
  role: UserRole
  senha: string
}

export interface UpdateUserData {
  nome?: string
  email?: string
  role?: UserRole
  ativo?: boolean
}
