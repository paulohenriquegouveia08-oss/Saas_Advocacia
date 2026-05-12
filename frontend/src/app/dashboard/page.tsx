'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Scale,
  Clock,
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
} from 'lucide-react'
import { UrgenciaBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import type { Deadline } from '@/types/deadline'

interface DashboardStats {
  processos_ativos: number
  prazos_hoje: number
  prazos_criticos: number
  notificacoes_nao_lidas: number
  prazos_urgentes: Deadline[]
}

interface FinancialSummary {
  total_entradas: number
  total_saidas: number
  saldo: number
}

const statCards = [
  { key: 'processos_ativos', label: 'Processos Ativos', icon: Scale, color: 'from-gold-500 to-blue-600', shadow: 'shadow-gold-500/20' },
  { key: 'prazos_hoje', label: 'Prazos Hoje', icon: Clock, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  { key: 'prazos_criticos', label: 'Prazos Críticos', icon: AlertTriangle, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
  { key: 'notificacoes_nao_lidas', label: 'Notificações', icon: Bell, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
] as const

export default function DashboardPage() {
  const { isAdmin, hasPermission } = useUser()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })

  // Dados exclusivos de admin
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: { id: string }[], total: number }>('/users'),
    enabled: hasPermission('users:read'),
  })

  const { data: financialSummary } = useQuery({
    queryKey: ['financial', 'summary'],
    queryFn: () => api.get<FinancialSummary>('/financial/summary'),
    enabled: hasPermission('financial:read'),
  })

  const totalUsers = usersData?.data?.length ?? usersData?.total ?? 0

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
            className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] p-5 transition-all duration-300 hover:border-gold-500/30 hover:shadow-lg group"
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

      {/* Admin Exclusive: Users + Financial Summary */}
      {(hasPermission('users:read') || hasPermission('financial:read')) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {hasPermission('users:read') && (
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] p-5 transition-all duration-300 hover:border-gold-500/30 hover:shadow-lg group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Usuários</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalUsers}</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-black" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-500 to-gold-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}

          {hasPermission('financial:read') && (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Entradas</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">
                      {formatCurrency(financialSummary?.total_entradas ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] p-5 transition-all duration-300 hover:border-red-500/30 hover:shadow-lg group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Saídas</p>
                    <p className="text-2xl font-bold text-red-400 mt-2">
                      {formatCurrency(financialSummary?.total_saidas ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 group-hover:scale-110 transition-transform duration-300">
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Financial Balance Card - Admin */}
      {hasPermission('financial:read') && (
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121212] p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saldo do Escritório</p>
              <p className={`text-3xl font-bold ${(financialSummary?.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(financialSummary?.saldo ?? 0)}
              </p>
            </div>
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${(financialSummary?.saldo ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <DollarSign className={`h-7 w-7 ${(financialSummary?.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Urgent Deadlines */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121212] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/60 bg-[#1A1A1A]">
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
                <tr className="border-b border-zinc-800/60 bg-[#1A1A1A]">
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
