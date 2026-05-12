export type DeadlineStatus = 'pendente' | 'atrasado' | 'concluido'
export type Urgencia = 'vencido' | 'vence_hoje' | 'critico' | 'urgente' | 'proximo' | 'normal'

export interface Deadline {
  id: string
  process_id: string
  descricao: string | null
  data_inicio: string | null
  data_vencimento: string
  status: DeadlineStatus
  responsavel_id: string | null
  dias_restantes: number | null
  urgencia?: Urgencia
  processo_numero?: string
  cliente_nome?: string
  responsavel_nome?: string
}

export interface CreateDeadlineData {
  process_id: string
  descricao?: string
  data_inicio?: string
  data_vencimento: string
  responsavel_id?: string
}

export interface UpdateDeadlineData {
  process_id?: string
  descricao?: string
  data_inicio?: string
  data_vencimento?: string
  responsavel_id?: string
}

export interface DeadlineQuery {
  status?: DeadlineStatus
  page?: number
  limit?: number
}
