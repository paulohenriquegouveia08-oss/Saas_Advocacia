export type NotificationType = 'prazo_proximo' | 'prazo_vencido' | 'geral'

export interface Notification {
  id: string
  deadline_id: string | null
  user_id: string
  tipo: NotificationType
  mensagem: string
  lida: boolean
  created_at: string
}

export interface NotificationQuery {
  page?: number
  limit?: number
}
