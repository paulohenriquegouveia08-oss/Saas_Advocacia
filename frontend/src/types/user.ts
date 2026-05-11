export type UserRole = 'admin_global' | 'funcionario'

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  created_at: string
  telefone?: string | null
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
  telefone?: string | null
}
