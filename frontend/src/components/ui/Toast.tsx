'use client'

import { useEffect, useState } from 'react'
import { toast as toastLib, type ToastEvent, type ToastType } from '@/lib/toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-400" />,
  info: <Info className="h-5 w-5 text-sky-400" />,
}

const bgColors: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-sky-500/30 bg-sky-500/10',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([])

  useEffect(() => {
    const unsubscribe = toastLib.subscribe((t) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3000)
    })
    return () => { unsubscribe() }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-in slide-in-from-right duration-300',
            bgColors[t.type]
          )}
        >
          {icons[t.type]}
          <p className="text-sm text-zinc-200">{t.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
