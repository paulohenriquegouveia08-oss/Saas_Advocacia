import { query, queryOne, queryCount } from '../../config/database'

export interface NotificationRow {
  id: string
  deadline_id: string | null
  user_id: string
  tipo: string
  mensagem: string
  lida: boolean
  created_at: Date
}

export class NotificationRepository {
  async findByUser(userId: string, params: { page: number; limit: number }): Promise<{ data: NotificationRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit

    const total = await queryCount(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    )

    const data = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY lida ASC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, params.limit, offset]
    )

    return { data, total }
  }

  async markAsRead(id: string, userId: string): Promise<NotificationRow | null> {
    return queryOne<NotificationRow>(
      `UPDATE notifications SET lida = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    )
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications SET lida = true
       WHERE user_id = $1 AND lida = false
       RETURNING id`,
      [userId]
    )
    return result.length
  }

  async getUnreadCount(userId: string): Promise<number> {
    return queryCount(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND lida = false',
      [userId]
    )
  }

  async markReadByDeadline(deadlineId: string): Promise<void> {
    await query(
      'UPDATE notifications SET lida = true WHERE deadline_id = $1',
      [deadlineId]
    )
  }

  /**
   * Cria notificação apenas se não existir uma com mesmo deadline_id + user_id + tipo
   * (deduplicação para evitar notificações duplicadas)
   */
  async createIfNotExists(data: {
    deadline_id: string
    user_id: string
    tipo: string
    mensagem: string
  }): Promise<NotificationRow | null> {
    // Check for existing
    const existing = await queryOne<NotificationRow>(
      `SELECT * FROM notifications
       WHERE deadline_id = $1 AND user_id = $2 AND tipo = $3`,
      [data.deadline_id, data.user_id, data.tipo]
    )

    if (existing) return null // Already exists, skip

    return queryOne<NotificationRow>(
      `INSERT INTO notifications (deadline_id, user_id, tipo, mensagem)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.deadline_id, data.user_id, data.tipo, data.mensagem]
    )
  }

  async create(data: {
    deadline_id?: string | null
    user_id: string
    tipo: string
    mensagem: string
  }): Promise<NotificationRow> {
    const result = await queryOne<NotificationRow>(
      `INSERT INTO notifications (deadline_id, user_id, tipo, mensagem)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.deadline_id || null, data.user_id, data.tipo, data.mensagem]
    )
    return result!
  }
}
