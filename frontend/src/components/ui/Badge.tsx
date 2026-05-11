import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantClasses = {
  default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-gold-500/10 text-gold-400 border-gold-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border tracking-wide uppercase',
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
