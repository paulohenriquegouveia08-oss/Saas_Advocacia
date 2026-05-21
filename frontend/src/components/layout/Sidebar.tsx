'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Scale,
  Clock,
  DollarSign,
  Bell,
  Settings,
  UserCog,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import type { Permission } from '@/hooks/useUser'

interface MenuItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  permission?: Permission
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar, permission: 'schedule:read' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, permission: 'clients:read' },
  { href: '/dashboard/processos', label: 'Processos', icon: Scale, permission: 'processes:read' },
  { href: '/dashboard/prazos', label: 'Prazos', icon: Clock, permission: 'deadlines:read' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign, permission: 'financial:read' },
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell, permission: 'notifications:read' },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, permission: 'users:read' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasPermission } = useUser()

  const visibleItems = menuItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800/80 bg-[#0B0B0B] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/80">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold-500 shadow-lg shadow-gold-500/10">
          <Briefcase className="h-5 w-5 text-black" />
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-100 tracking-tight">JurisFlow</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Gestão Jurídica</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group',
                isActive
                  ? 'bg-[#121212] text-gold-500'
                  : 'text-zinc-400 hover:bg-[#121212] hover:text-zinc-200'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-500 rounded-r-md" />
              )}
              <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-gold-500' : 'text-zinc-500 group-hover:text-zinc-300')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer - só quem tem permissão de settings */}
      {hasPermission('settings:read') && (
        <div className="border-t border-zinc-800/50 p-3">
          <Link
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all duration-200"
          >
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
        </div>
      )}
    </aside>
  )
}
