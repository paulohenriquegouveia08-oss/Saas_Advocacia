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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/processos', label: 'Processos', icon: Scale },
  { href: '/dashboard/prazos', label: 'Prazos', icon: Clock },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/20">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">JurisFlow</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Gestão Jurídica</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gold-600/15 text-gold-400 shadow-sm shadow-gold-500/5'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-gold-400' : 'text-zinc-500')} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800/50 p-3">
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          Configurações
        </Link>
      </div>
    </aside>
  )
}
