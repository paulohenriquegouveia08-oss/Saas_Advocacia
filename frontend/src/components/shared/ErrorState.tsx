import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Ocorreu um erro ao carregar os dados.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-red-500/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <p className="text-zinc-400 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
