'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notification'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

const tipoBadge: Record<string, { label: string; variant: 'warning' | 'danger' | 'info' }> = {
  prazo_proximo: { label: 'Prazo Próximo', variant: 'warning' },
  prazo_vencido: { label: 'Prazo Vencido', variant: 'danger' },
  geral: { label: 'Geral', variant: 'info' },
}

export default function NotificacoesPage() {
  const qc = useQueryClient()

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ data: Notification[], total: number }>('/notifications'),
  })
  const data = response?.data || []

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }) },
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }); toast.success('Todas marcadas como lidas!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const unread = data?.filter((n) => !n.lida).length ?? 0

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notificações</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Todas as notificações lidas'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAll.mutate()} isLoading={markAll.isPending}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={3} /> : isError ? <ErrorState onRetry={refetch} /> : !data?.length ? (
        <EmptyState message="Nenhuma notificação." icon={<Bell className="h-8 w-8 text-zinc-500" />} />
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.lida && markRead.mutate(n.id)}
              className={cn(
                'flex items-start gap-4 px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer',
                n.lida
                  ? 'border-zinc-800/30 bg-zinc-900/30 opacity-60'
                  : 'border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700/50'
              )}
            >
              <div className={cn('mt-0.5 flex-shrink-0 w-2 h-2 rounded-full', n.lida ? 'bg-transparent' : 'bg-gold-400 animate-pulse')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={tipoBadge[n.tipo]?.variant || 'info'}>{tipoBadge[n.tipo]?.label || n.tipo}</Badge>
                  <span className="text-xs text-zinc-500">{timeAgo(n.created_at)}</span>
                </div>
                <p className={cn('text-sm', n.lida ? 'text-zinc-500' : 'text-zinc-200')}>{n.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
