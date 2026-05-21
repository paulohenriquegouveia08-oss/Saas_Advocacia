'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import type { ScheduleEvent } from '../page'

interface MonthViewProps {
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

export function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => {
      const start = e.start_date.split('T')[0]
      const end = e.end_date.split('T')[0]
      return dateStr >= start && dateStr <= end
    })
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0B0B]">
      <div className="grid grid-cols-7 border-b border-zinc-800/80 bg-[#121212]">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {daysInMonth.map((dayObj, i) => {
          const isToday = new Date().toDateString() === dayObj.date.toDateString()
          const dayEvents = getEventsForDate(dayObj.date)

          return (
            <div
              key={i}
              onClick={() => dayObj.isCurrentMonth && onDayClick(dayObj.date)}
              className={`
                border-r border-b border-zinc-800/30 p-2 transition-colors group relative
                ${!dayObj.isCurrentMonth ? 'bg-zinc-900/10' : 'hover:bg-zinc-800/20 cursor-pointer'}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                  ${isToday ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' :
                    dayObj.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600'}
                `}>
                  {dayObj.date.getDate()}
                </span>
              </div>

              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={e => { e.stopPropagation(); onEventClick(event) }}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
                      event.status === 'concluido' ? 'opacity-50 line-through' : ''
                    }`}
                    style={{ backgroundColor: priorityColors[event.priority] || '#D4AF37' }}
                    title={event.title}
                  >
                    {event.status === 'concluido' && <Check className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{event.start_time} {event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-zinc-500 px-1">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
