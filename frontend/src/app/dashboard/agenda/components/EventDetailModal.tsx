'use client'

import { Check, X, Clock, Calendar, User, FileText, Tag, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import type { ScheduleEvent } from '../page'

interface EventDetailModalProps {
  event: ScheduleEvent
  onClose: () => void
  onStatusChange: () => void
  clients: { id: string; nome: string }[]
}

const priorityColors: Record<string, string> = {
  baixa: '#22c55e',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
}

const priorityLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

const eventTypeLabels: Record<string, string> = {
  reuniao_cliente: 'Reunião com Cliente',
  audiencia: 'Audiência',
  prazo_processual: 'Prazo Processual',
  tarefa_interna: 'Tarefa Interna',
  atendimento: 'Atendimento',
  revisao_documental: 'Revisão Documental',
  diligencia: 'Diligência',
  financeiro: 'Financeiro',
  outro: 'Outro',
}

export function EventDetailModal({ event, onClose, onStatusChange, clients }: EventDetailModalProps) {
  const handleComplete = async () => {
    try {
      await api.put(`/schedule/${event.id}`, { status: event.status === 'concluido' ? 'pendente' : 'concluido' })
      onStatusChange()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handleCancel = async () => {
    try {
      await api.put(`/schedule/${event.id}`, { status: event.status === 'cancelado' ? 'pendente' : 'cancelado' })
      onStatusChange()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/schedule/${event.id}`)
      onStatusChange()
      onClose()
    } catch (err) {
      console.error('Erro ao excluir evento:', err)
    }
  }

  const clientName = clients.find(c => c.id === event.client_id)?.nome

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: (priorityColors[event.priority] || '#D4AF37') + '20' }}
            >
              <Calendar className="w-5 h-5" style={{ color: priorityColors[event.priority] || '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{event.title}</h2>
              <div className="flex items-center gap-2">
                {event.status === 'concluido' && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Concluído
                  </span>
                )}
                {event.status === 'cancelado' && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> Cancelado
                  </span>
                )}
                {event.status === 'pendente' && (
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pendente
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {event.description && (
            <div className="text-sm text-zinc-400 bg-[#0B0B0B] rounded-xl p-4 border border-zinc-800/50">
              {event.description}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Calendar className="w-4 h-4 text-zinc-600" />
              <span>{new Date(event.start_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="w-4 h-4 text-zinc-600" />
              <span>{event.start_time} — {event.end_time}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-zinc-600" />
            <span className="text-zinc-400">{eventTypeLabels[event.event_type] || event.event_type}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" style={{ color: priorityColors[event.priority] }} />
            <span style={{ color: priorityColors[event.priority] }}>{priorityLabels[event.priority] || event.priority}</span>
          </div>

          {clientName && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <User className="w-4 h-4 text-zinc-600" />
              <span>{clientName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800/80 bg-[#0B0B0B] flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                event.status === 'concluido'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                  : 'bg-green-500 text-black hover:bg-green-400'
              }`}
            >
              <Check className="w-4 h-4" />
              {event.status === 'concluido' ? 'Concluído' : 'Marcar como Concluído'}
            </button>
            <button
              onClick={handleCancel}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                event.status === 'cancelado'
                  ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <X className="w-4 h-4" />
              {event.status === 'cancelado' ? 'Cancelado' : 'Cancelar'}
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="w-full text-center py-2 text-sm text-red-500/70 hover:text-red-400 transition-colors"
          >
            Excluir evento
          </button>
        </div>
      </div>
    </div>
  )
}
