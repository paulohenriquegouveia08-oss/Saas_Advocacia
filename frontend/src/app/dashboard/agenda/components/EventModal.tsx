'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalIcon, Clock, Type, AlertCircle, FileText, User } from 'lucide-react'
import { api } from '@/lib/api'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  clients: { id: string; nome: string }[]
}

const defaultState = {
  title: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '10:00',
  clientId: '',
  eventType: 'reuniao_cliente',
  priority: 'media',
}

export function EventModal({ isOpen, onClose, selectedDate, clients }: EventModalProps) {
  const [formData, setFormData] = useState(defaultState)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const dateStr = selectedDate.toISOString().split('T')[0]
      setFormData({
        ...defaultState,
        startDate: dateStr,
        endDate: dateStr,
      })
    }
  }, [isOpen, selectedDate])

  if (!isOpen) return null

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return
    setLoading(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        event_type: formData.eventType,
        priority: formData.priority,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        client_id: formData.clientId || undefined,
        color: formData.eventType === 'audiencia' ? '#ef4444' : formData.eventType === 'prazo_processual' ? '#f59e0b' : '#D4AF37',
      }
      console.log('Enviando evento:', payload)
      await api.post('/schedule', payload)
      onClose()
    } catch (err) {
      console.error('Erro ao salvar evento:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-gradient-to-r from-[#121212] to-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <CalIcon className="w-5 h-5 text-gold-500" />
            </span>
            Novo Compromisso
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Título e Descrição */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Título do Evento</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Ex: Reunião de Alinhamento com Cliente Silva"
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Descrição (Opcional)</label>
              <textarea
                value={formData.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Detalhes adicionais sobre o compromisso..."
                className="w-full h-24 bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all shadow-inner resize-none custom-scrollbar"
              />
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          {/* Datas e Horários */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Data Inicial</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => update('startDate', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Data Final</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => update('endDate', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" /> Hora Início</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => update('startTime', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" /> Hora Fim</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => update('endTime', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          {/* Vinculações (Cliente/Processo) */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><User className="w-4 h-4 text-zinc-500" /> Vincular Cliente</label>
              <select
                value={formData.clientId}
                onChange={e => update('clientId', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 focus:outline-none focus:border-gold-500/50 transition-all appearance-none"
              >
                <option value="">Selecione um cliente (opcional)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-500" /> Vincular Processo</label>
              <select className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 focus:outline-none focus:border-gold-500/50 transition-all appearance-none">
                <option value="">Selecione um processo (opcional)</option>
              </select>
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          {/* Tipo e Prioridade */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Type className="w-4 h-4 text-zinc-500" /> Tipo de Evento</label>
              <select
                value={formData.eventType}
                onChange={e => update('eventType', e.target.value)}
                className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-all appearance-none"
              >
                <option value="reuniao_cliente">Reunião com Cliente</option>
                <option value="audiencia">Audiência</option>
                <option value="prazo_processual">Prazo Processual</option>
                <option value="tarefa_interna">Tarefa Interna</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-zinc-500" /> Prioridade</label>
              <div className="flex gap-3">
                {['baixa', 'media', 'alta', 'urgente'].map(p => (
                  <label key={p} className="flex-1 cursor-pointer">
                    <input type="radio" name="priority" value={p} className="peer sr-only" checked={formData.priority === p} onChange={() => update('priority', p)} />
                    <div className="text-center py-2.5 text-sm font-medium rounded-xl border border-zinc-800 text-zinc-500 peer-checked:border-gold-500 peer-checked:text-gold-500 peer-checked:bg-gold-500/10 hover:bg-zinc-800 transition-all capitalize shadow-sm">
                      {p}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800/80 bg-[#0B0B0B] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.title.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gold-500 text-black hover:bg-gold-400 active:scale-95 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Evento'}
          </button>
        </div>
      </div>
    </div>
  )
}
