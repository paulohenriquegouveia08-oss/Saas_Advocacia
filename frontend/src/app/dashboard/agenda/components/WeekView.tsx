'use client'

import { Check } from 'lucide-react'
import type { ScheduleEvent } from '../page'

interface WeekViewProps {
  currentDate: Date
  events: ScheduleEvent[]
  onDayClick: (date: Date) => void
  onEventClick: (event: ScheduleEvent) => void
}

const priorityColors: Record<string, string> = {
  baixa: '#22c55e',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
}

export function WeekView({ currentDate, events, onDayClick, onEventClick }: WeekViewProps) {
  const curr = new Date(currentDate)
  const first = curr.getDate() - curr.getDay()
  const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(curr.setDate(first + i)))

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => {
      const start = e.start_date.split('T')[0]
      const end = e.end_date.split('T')[0]
      return dateStr >= start && dateStr <= end
    })
  }

  const getEventPosition = (event: ScheduleEvent) => {
    const [h, m] = event.start_time.split(':').map(Number)
    const [eh, em] = event.end_time.split(':').map(Number)
    const top = h * 60 + m
    const height = Math.max((eh * 60 + em) - top, 30)
    return { top, height }
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0B0B]">
      <div className="flex border-b border-zinc-800/80 bg-[#121212]">
        <div className="w-16 border-r border-zinc-800/50 shrink-0"></div>
        {weekDays.map((day, i) => {
          const isToday = new Date().toDateString() === day.toDateString()
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className="flex-1 py-3 flex flex-col items-center justify-center border-r border-zinc-800/50 last:border-r-0 cursor-pointer hover:bg-zinc-800/10 transition-colors"
            >
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
              <span className={`mt-1.5 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${isToday ? 'bg-gold-500 text-black shadow-[0_0_12px_rgba(197,168,128,0.4)]' : 'text-zinc-300'}`}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="relative min-h-[1440px] flex">
          <div className="w-16 shrink-0 relative bg-[#0B0B0B]">
            {hours.map(hour => (
              <div key={hour} className="absolute w-full text-right pr-4 text-xs text-zinc-500 font-medium" style={{ top: `${hour * 60 - 8}px` }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="flex-1 flex relative">
            <div className="absolute inset-0 w-full pointer-events-none">
              {hours.map(hour => (
                <div key={hour} className="border-t border-zinc-800/30 w-full" style={{ height: '60px' }}></div>
              ))}
            </div>

            {weekDays.map((day, i) => {
              const dayEvents = getEventsForDate(day)
              return (
                <div key={i} className="flex-1 border-l border-zinc-800/50 relative group hover:bg-zinc-800/10 transition-colors z-0">
                  {dayEvents.map(event => {
                    const { top, height } = getEventPosition(event)
                    return (
                      <div
                        key={event.id}
                        onClick={e => { e.stopPropagation(); onEventClick(event) }}
                        className={`absolute left-0.5 right-0.5 rounded-md px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10 ${
                          event.status === 'concluido' ? 'opacity-50' : ''
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: priorityColors[event.priority] || '#D4AF37',
                        }}
                        title={`${event.title} (${event.start_time} - ${event.end_time})`}
                      >
                        <div className="flex items-center gap-1">
                          {event.status === 'concluido' && <Check className="w-3 h-3 shrink-0" />}
                          <span className="font-semibold truncate">{event.title}</span>
                        </div>
                        <div className="text-[10px] opacity-80">{event.start_time} - {event.end_time}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
