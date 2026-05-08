import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
}

export function EmptyState({ message = 'Nenhum registro encontrado.', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-800 p-4 mb-4">
        {icon || <Inbox className="h-8 w-8 text-slate-500" />}
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}
