import cron from 'node-cron'
import { query } from '../config/database'
import { NotificationRepository } from '../modules/notifications/notification.repository'

const notificationRepo = new NotificationRepository()

interface DeadlineWithUser {
  id: string
  descricao: string | null
  data_vencimento: string
  responsavel_id: string
  processo_numero: string
  dias_restantes: number
}

/**
 * Job diário (08h): verifica prazos e gera notificações automaticamente
 *
 * Regras:
 * 1. Prazos vencendo em 1, 3 e 7 dias → notificação tipo 'prazo_proximo'
 * 2. Prazos vencidos (data < hoje) e não concluídos → notificação tipo 'prazo_vencido' + atualiza status para 'atrasado'
 * 3. Deduplicação: não cria se já existir notificação com mesmo deadline_id + user_id + tipo
 */
async function processDeadlineNotifications() {
  console.log('[JOB] Iniciando verificação de prazos...', new Date().toISOString())

  try {
    // 1. Prazos vencendo em 1, 3 e 7 dias (com responsável atribuído)
    const upcomingDeadlines = await query<DeadlineWithUser>(
      `SELECT d.id, d.descricao, d.data_vencimento, d.responsavel_id,
              p.numero AS processo_numero,
              (d.data_vencimento - CURRENT_DATE) AS dias_restantes
       FROM deadlines d
       JOIN processes p ON d.process_id = p.id
       WHERE d.status = 'pendente'
         AND d.responsavel_id IS NOT NULL
         AND (d.data_vencimento - CURRENT_DATE) IN (1, 3, 7)`
    )

    for (const deadline of upcomingDeadlines) {
      await notificationRepo.createIfNotExists({
        deadline_id: deadline.id,
        user_id: deadline.responsavel_id,
        tipo: 'prazo_proximo',
        mensagem: `Prazo "${deadline.descricao || 'Sem descrição'}" do processo ${deadline.processo_numero} vence em ${deadline.dias_restantes} dia(s).`,
      })
    }

    console.log(`[JOB] ${upcomingDeadlines.length} prazos próximos processados.`)

    // 2. Prazos vencidos
    const overdueDeadlines = await query<DeadlineWithUser>(
      `SELECT d.id, d.descricao, d.data_vencimento, d.responsavel_id,
              p.numero AS processo_numero,
              (d.data_vencimento - CURRENT_DATE) AS dias_restantes
       FROM deadlines d
       JOIN processes p ON d.process_id = p.id
       WHERE d.data_vencimento < CURRENT_DATE
         AND d.status != 'concluido'
         AND d.responsavel_id IS NOT NULL`
    )

    for (const deadline of overdueDeadlines) {
      // Create overdue notification
      await notificationRepo.createIfNotExists({
        deadline_id: deadline.id,
        user_id: deadline.responsavel_id,
        tipo: 'prazo_vencido',
        mensagem: `Prazo "${deadline.descricao || 'Sem descrição'}" do processo ${deadline.processo_numero} está VENCIDO desde ${deadline.data_vencimento}.`,
      })
    }

    // Update status of overdue deadlines to 'atrasado'
    await query(
      `UPDATE deadlines SET status = 'atrasado'
       WHERE data_vencimento < CURRENT_DATE
         AND status = 'pendente'`
    )

    console.log(`[JOB] ${overdueDeadlines.length} prazos vencidos processados.`)
    console.log('[JOB] Verificação de prazos concluída.', new Date().toISOString())
  } catch (error) {
    console.error('[JOB] Erro na verificação de prazos:', error)
  }
}

export function startDeadlineNotificationJob() {
  // Run every day at 08:00
  cron.schedule('0 8 * * *', processDeadlineNotifications, {
    timezone: 'America/Sao_Paulo',
  })

  console.log('[JOB] Job de notificações de prazos agendado para 08:00 diariamente.')
}

// Export for manual trigger (useful for testing)
export { processDeadlineNotifications }
