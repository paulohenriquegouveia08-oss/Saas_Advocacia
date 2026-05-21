'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DayView } from './components/DayView'
import { WeekView } from './components/WeekView'
import { MonthView } from './components/MonthView'
import { EventModal } from './components/EventModal'
import { EventDetailModal } from './components/EventDetailModal'

type ViewMode = 'day' | 'week' | 'month'

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  event_type: string
  priority: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  client_id?: string
  process_id?: string
  user_id: string
  color?: string
  created_at: string
  updated_at: string
}

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ data: { id: string; nome: string }[], total: number }>('/clients'),
  })
  const clients = clientsData?.data || []

  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    if (viewMode === 'day') {
      const d = currentDate.toISOString().split('T')[0]
      return { start_date: d, end_date: d }
    }
    if (viewMode === 'week') {
      const first = new Date(currentDate)
      first.setDate(currentDate.getDate() - currentDate.getDay())
      const last = new Date(first)
      last.setDate(first.getDate() + 6)
      return { start_date: first.toISOString().split('T')[0], end_date: last.toISOString().split('T')[0] }
    }
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return { start_date: firstDay.toISOString().split('T')[0], end_date: lastDay.toISOString().split('T')[0] }
  }, [currentDate, viewMode])

  const { data: eventsData, refetch: refetchEvents } = useQuery({
    queryKey: ['schedule-events', dateRange.start_date, dateRange.end_date],
    queryFn: async () => {
      const res = await api.get<ScheduleEvent[]>('/schedule', dateRange)
      console.log('[Agenda] Events fetched:', res.length, res)
      return res
    },
  })
  const events = eventsData || []

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() + 1)
    if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7)
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const handlePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() - 1)
    if (viewMode === 'week') newDate.setDate(currentDate.getDate() - 7)
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setViewMode('day')
  }

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    refetchEvents()
  }

  const handleDetailClose = () => {
    setSelectedEvent(null)
    refetchEvents()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-gold-500" />
            Agenda
          </h2>
          <p className="text-zinc-400">Gerencie seus compromissos e audiências.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação de Datas */}
          <div className="flex items-center bg-[#121212] rounded-lg border border-zinc-800 p-1">
            <button onClick={handlePrev} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleToday} className="px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Hoje
            </button>
            <button onClick={handleNext} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Seletor de View */}
          <div className="flex items-center bg-[#121212] rounded-lg border border-zinc-800 p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'day' ? 'bg-gold-500/10 text-gold-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'week' ? 'bg-gold-500/10 text-gold-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-gold-500/10 text-gold-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Mês
            </button>
          </div>

          {/* Botão Novo Evento */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-gold-500/20"
          >
            <Plus className="h-5 w-5" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Título da Data Atual */}
      <div className="flex items-center justify-center py-2 gap-3">
        {viewMode === 'day' && (
          <button onClick={() => setViewMode('month')} className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
            ← Voltar ao mês
          </button>
        )}
        <h3 className="text-xl font-semibold text-zinc-200">
          {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {viewMode === 'week' && `Semana de ${currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
          {viewMode === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
        </h3>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0B0B0B] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
        {viewMode === 'day' && <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
        {viewMode === 'week' && <WeekView currentDate={currentDate} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} />}
        {viewMode === 'month' && <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} />}
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedDate={currentDate}
          clients={clients}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={handleDetailClose}
          onStatusChange={handleDetailClose}
          clients={clients}
        />
      )}
    </div>
  )
}
