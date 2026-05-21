type ToastType = 'success' | 'error' | 'info'

interface ToastEvent {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (toast: ToastEvent) => void

const listeners: Set<ToastListener> = new Set()

function emit(type: ToastType, message: string) {
  const event: ToastEvent = {
    id: crypto.randomUUID(),
    type,
    message,
  }
  listeners.forEach((fn) => fn(event))
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
  subscribe: (fn: ToastListener) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

export type { ToastEvent, ToastType }
