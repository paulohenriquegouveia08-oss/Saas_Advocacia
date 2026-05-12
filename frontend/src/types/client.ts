export interface Client {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  status: string | null
  created_at: string
}

export interface ClientWithProcesses extends Client {
  processos: Array<{
    id: string
    numero: string
    tipo_acao: string
    status: string
  }>
}

export interface CreateClientData {
  nome: string
  cpf?: string
  telefone?: string
  email?: string
  status?: string
}

export interface UpdateClientData {
  nome?: string
  cpf?: string
  telefone?: string
  email?: string
  status?: string
}

export interface ClientQuery {
  search?: string
  page?: number
  limit?: number
}
