'use client'

import { Bell, LogOut, User, Briefcase } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

interface Settings {
  escritorio_nome: string | null
  escritorio_cnpj: string | null
}

export function Topbar() {
  const router = useRouter()
  const { user } = useUser()

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60000,
  })

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get<Settings>('/settings'),
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const count = unreadCount?.count ?? 0

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#0B0B0B]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Escritório info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/20">
            <Briefcase className="h-4 w-4 text-gold-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-100">
              {settings?.escritorio_nome || 'Meu Escritório'}
              {user?.nome && (
                <span className="text-zinc-500 font-normal"> — {user.nome}</span>
              )}
            </span>
            {settings?.escritorio_cnpj && (
              <span className="text-xs text-zinc-500 font-mono">
                {settings.escritorio_cnpj}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => router.push('/dashboard/notificacoes')}
            className="relative p-2.5 rounded-xl text-zinc-400 hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
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

          {/* User menu - Settings */}
          <button
            onClick={() => router.push('/dashboard/configuracoes')}
            className="p-2.5 rounded-xl text-zinc-400 hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
            title="Configurações"
          >
            <User className="h-5 w-5" />
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
