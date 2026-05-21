'use client'

import { Check } from 'lucide-react'
import type { ScheduleEvent } from '../page'

interface DayViewProps {
  currentDate: Date
  events: ScheduleEvent[]
  onEventClick: (event: ScheduleEvent) => void
}

const priorityColors: Record<string, string> = {
  baixa: '#22c55e',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dateStr = currentDate.toISOString().split('T')[0]

  const dayEvents = events.filter(e => {
    const start = e.start_date.split('T')[0]
    const end = e.end_date.split('T')[0]
    return dateStr >= start && dateStr <= end
  })

  const getEventPosition = (event: ScheduleEvent) => {
    const [h, m] = event.start_time.split(':').map(Number)
    const [eh, em] = event.end_time.split(':').map(Number)
    const top = h * 60 + m
    const height = Math.max((eh * 60 + em) - top, 30)
    return { top, height }
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0B0B] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="relative min-h-[1440px]">
          {hours.map(hour => (
            <div key={hour} className="absolute w-full flex border-t border-zinc-800/30" style={{ top: `${hour * 60}px`, height: '60px' }}>
              <div className="w-16 text-right pr-4 py-2 text-xs text-zinc-500 font-medium">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 border-l border-zinc-800/50 relative group hover:bg-zinc-800/10 transition-colors">
                {dayEvents.filter(e => {
                  const [h] = e.start_time.split(':').map(Number)
                  return h === hour
                }).map(event => {
                  const { top, height } = getEventPosition(event)
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10 ${
                        event.status === 'concluido' ? 'opacity-50' : ''
                      }`}
                      style={{
                        top: `${top - hour * 60}px`,
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
            </div>
          ))}
          {/* Current time indicator */}
          <div className="absolute w-full flex items-center z-10 pointer-events-none" style={{ top: `${(new Date().getHours() * 60) + new Date().getMinutes()}px` }}>
            <div className="w-16 flex justify-end pr-2">
              <span className="text-[10px] text-gold-500 font-bold bg-[#121212] px-1 rounded">AGORA</span>
            </div>
            <div className="flex-1 border-t-2 border-gold-500/70 relative">
              <div className="absolute -left-1.5 -top-[5px] w-3 h-3 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(197,168,128,0.8)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
