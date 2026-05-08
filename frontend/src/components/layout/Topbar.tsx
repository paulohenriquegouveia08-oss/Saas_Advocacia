'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Topbar() {
  const router = useRouter()

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60000, // Every 60 seconds
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const count = unreadCount?.count ?? 0

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div />

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => router.push('/dashboard/notificacoes')}
            className="relative p-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-red-500 shadow-lg shadow-red-500/30',
                'animate-in zoom-in duration-300'
              )}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* User menu */}
          <button
            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
          >
            <User className="h-5 w-5" />
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
