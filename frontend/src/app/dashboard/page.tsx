'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Scale,
  Clock,
  AlertTriangle,
  Bell,
  TrendingUp,
} from 'lucide-react'
import { UrgenciaBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { formatDate } from '@/lib/utils'
import type { Deadline } from '@/types/deadline'

interface DashboardStats {
  processos_ativos: number
  prazos_hoje: number
  prazos_criticos: number
  notificacoes_nao_lidas: number
  prazos_urgentes: Deadline[]
}

const statCards = [
  { key: 'processos_ativos', label: 'Processos Ativos', icon: Scale, color: 'from-gold-500 to-blue-600', shadow: 'shadow-gold-500/20' },
  { key: 'prazos_hoje', label: 'Prazos Hoje', icon: Clock, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  { key: 'prazos_criticos', label: 'Prazos Críticos', icon: AlertTriangle, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
  { key: 'notificacoes_nao_lidas', label: 'Notificações', icon: Bell, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
] as const

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Visão geral do escritório</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {isLoading ? (
                    <span className="inline-block w-12 h-8 bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    stats?.[card.key] ?? 0
                  )}
                </p>
              </div>
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* Gradient line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        ))}
      </div>

      {/* Urgent Deadlines */}
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
            <TrendingUp className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Prazos Urgentes</h2>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : stats?.prazos_urgentes?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Processo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vencimento</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Urgência</th>
                </tr>
              </thead>
              <tbody>
                {stats.prazos_urgentes.map((prazo) => (
                  <tr key={prazo.id} className="border-b border-zinc-800/30 table-row-hover">
                    <td className="px-6 py-3.5 text-sm text-zinc-300">{prazo.processo_numero || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-300">{prazo.descricao || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{formatDate(prazo.data_vencimento)}</td>
                    <td className="px-6 py-3.5">
                      {prazo.urgencia && <UrgenciaBadge urgencia={prazo.urgencia} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <Clock className="h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">Nenhum prazo urgente no momento</p>
          </div>
        )}
      </div>
    </div>
  )
}
