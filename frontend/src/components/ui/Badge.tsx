import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantClasses = {
  default: 'bg-zinc-700/80 text-zinc-300 border-zinc-600',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Urgency badge for deadlines
import type { Urgencia } from '@/types/deadline'

const urgenciaConfig: Record<Urgencia, { label: string; variant: BadgeProps['variant'] }> = {
  vencido: { label: 'Vencido', variant: 'danger' },
  vence_hoje: { label: 'Vence Hoje', variant: 'warning' },
  critico: { label: 'Crítico', variant: 'danger' },
  urgente: { label: 'Urgente', variant: 'warning' },
  proximo: { label: 'Próximo', variant: 'info' },
  normal: { label: 'Normal', variant: 'default' },
}

export function UrgenciaBadge({ urgencia }: { urgencia: Urgencia }) {
  const config = urgenciaConfig[urgencia]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

// Status badge for processes
import type { ProcessStatus } from '@/types/process'

const processStatusConfig: Record<ProcessStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ativo: { label: 'Ativo', variant: 'success' },
  suspenso: { label: 'Suspenso', variant: 'warning' },
  encerrado: { label: 'Encerrado', variant: 'default' },
}

export function StatusBadge({ status }: { status: ProcessStatus }) {
  const config = processStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
