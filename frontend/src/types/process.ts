export type ProcessStatus = 'ativo' | 'suspenso' | 'encerrado'

export interface Process {
  id: string
  client_id: string
  numero: string
  tribunal: string | null
  tipo_acao: string | null
  parte_contraria: string | null
  status: ProcessStatus
  created_at: string
  cliente_nome?: string
}

export interface Movement {
  id: string
  process_id: string
  tipo: string | null
  descricao: string | null
  data: string | null
  created_at: string
}

export interface CreateProcessData {
  client_id: string
  numero: string
  tribunal?: string
  tipo_acao?: string
  parte_contraria?: string
  status?: ProcessStatus
}

export interface UpdateProcessData extends Partial<CreateProcessData> {}

export interface CreateMovementData {
  tipo?: string
  descricao?: string
  data?: string
}

export interface ProcessQuery {
  status?: ProcessStatus
  page?: number
  limit?: number
}
