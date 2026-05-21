import cron from 'node-cron'
import { supabaseAdmin } from '../config/supabase'
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

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function processDeadlineNotifications() {
  console.log('[JOB] Iniciando verificação de prazos...', new Date().toISOString())

  try {
    const { data: deadlines } = await supabaseAdmin
      .from('deadlines')
      .select('id, descricao, data_vencimento, responsavel_id, processes(numero)')
      .eq('status', 'pendente')
      .not('responsavel_id', 'is', null)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingDeadlines: DeadlineWithUser[] = []
    const overdueDeadlines: DeadlineWithUser[] = []

    for (const d of deadlines || []) {
      const dias = daysUntil(d.data_vencimento)
      const entry = {
        id: d.id,
        descricao: d.descricao,
        data_vencimento: d.data_vencimento,
        responsavel_id: d.responsavel_id,
        processo_numero: (d as any).processes?.numero || '',
        dias_restantes: dias,
      }

      if ([1, 3, 7].includes(dias)) {
        upcomingDeadlines.push(entry)
      }

      if (dias < 0) {
        overdueDeadlines.push(entry)
      }
    }

    for (const deadline of upcomingDeadlines) {
      await notificationRepo.createIfNotExists({
        deadline_id: deadline.id,
        user_id: deadline.responsavel_id,
        tipo: 'prazo_proximo',
        mensagem: `Prazo "${deadline.descricao || 'Sem descrição'}" do processo ${deadline.processo_numero} vence em ${deadline.dias_restantes} dia(s).`,
      })
    }

    console.log(`[JOB] ${upcomingDeadlines.length} prazos próximos processados.`)

    for (const deadline of overdueDeadlines) {
      await notificationRepo.createIfNotExists({
        deadline_id: deadline.id,
        user_id: deadline.responsavel_id,
        tipo: 'prazo_vencido',
        mensagem: `Prazo "${deadline.descricao || 'Sem descrição'}" do processo ${deadline.processo_numero} está VENCIDO desde ${deadline.data_vencimento}.`,
      })
    }

    // Update status of overdue deadlines
    const overdueIds = overdueDeadlines.map(d => d.id)
    if (overdueIds.length > 0) {
      await supabaseAdmin
        .from('deadlines')
        .update({ status: 'atrasado' })
        .in('id', overdueIds)
        .eq('status', 'pendente')
    }

    console.log(`[JOB] ${overdueDeadlines.length} prazos vencidos processados.`)
    console.log('[JOB] Verificação de prazos concluída.', new Date().toISOString())
  } catch (error) {
    console.error('[JOB] Erro na verificação de prazos:', error)
  }
}

export function startDeadlineNotificationJob() {
  cron.schedule('0 8 * * *', processDeadlineNotifications, {
    timezone: 'America/Sao_Paulo',
  })

  console.log('[JOB] Job de notificações de prazos agendado para 08:00 diariamente.')
}

export { processDeadlineNotifications }
