export type FinancialType = 'entrada' | 'saida'

export interface Financial {
  id: string
  tipo: FinancialType
  descricao: string | null
  valor: number
  categoria: string | null
  status: string | null
  data: string | null
  client_id: string | null
  cliente_nome?: string
}

export interface FinancialSummary {
  total_entradas: number
  total_saidas: number
  saldo: number
}

export interface CreateFinancialData {
  tipo: FinancialType
  descricao?: string
  valor: number
  categoria?: string
  status?: string
  data?: string
  client_id?: string | null
}

export interface UpdateFinancialData {
  tipo?: FinancialType
  descricao?: string
  valor?: number
  categoria?: string
  status?: string
  data?: string
  client_id?: string | null
}

export interface FinancialQuery {
  tipo?: FinancialType
  page?: number
  limit?: number
}
