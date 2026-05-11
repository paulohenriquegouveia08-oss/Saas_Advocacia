'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 sm:px-6">
      {/* Overlay: duas camadas para criar profundidade premium */}
      {/* Camada 1: blur suave que desfoca o fundo sem esconder */}
      <div
        className="fixed inset-0 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Camada 2: escurecimento translúcido sutil por cima */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className={cn(
          'relative w-full rounded-2xl border border-zinc-700/60 bg-[#0B0B0B] animate-in fade-in zoom-in-95 duration-300',
          sizes[size]
        )}
        style={{
          boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 80px -20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-gold-500/10 hover:text-gold-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - scroll interno */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-zinc-800/80 px-6 py-4 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  isLoading?: boolean
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isLoading }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-zinc-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Confirmar
        </button>
      </div>
    </Modal>
  )
}
