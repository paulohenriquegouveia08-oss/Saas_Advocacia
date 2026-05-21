'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { api } from '@/lib/api'
import { getSupabase } from '@/lib/auth'

export type UserRole = 'admin_global' | 'funcionario' | 'cliente'

export type Permission =
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'clients:create' | 'clients:read' | 'clients:update' | 'clients:delete'
  | 'processes:create' | 'processes:read' | 'processes:update' | 'processes:delete'
  | 'movements:create' | 'movements:read'
  | 'deadlines:create' | 'deadlines:read' | 'deadlines:update' | 'deadlines:delete' | 'deadlines:complete'
  | 'notifications:read' | 'notifications:update'
  | 'financial:create' | 'financial:read' | 'financial:update' | 'financial:delete'
  | 'settings:read' | 'settings:update'
  | 'schedule:create' | 'schedule:read' | 'schedule:update' | 'schedule:delete'
interface UserInfo {
  id: string
  nome: string
  email: string
  role: UserRole
  permissions: Permission[]
}

interface UserContextType {
  user: UserInfo | null
  isLoading: boolean
  hasPermission: (permission: Permission) => boolean
  isAdmin: boolean
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          setIsLoading(false)
          return
        }

        // Buscar informações do usuário via API - fonte única de verdade
        try {
          const response = await api.get<{ data: UserInfo }>('/auth/me')
          if (response?.data) {
            setUser({
              ...response.data,
              // Garantir que permissions seja sempre um array
              permissions: response.data.permissions || [],
            })
            setIsLoading(false)
            return
          }
        } catch (e) {
          console.warn('API /auth/me falhou:', e)
        }

        // Fallback mínimo: apenas identifica o usuário, SEM conceder permissões
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser?.id) {
            setUser({
              id: authUser.id,
              nome: authUser.email?.split('@')[0] || 'Usuário',
              email: authUser.email || '',
              role: 'funcionario',
              permissions: [], // Sem permissões - segurança primeiro
            })
          }
        } catch (e) {
          console.warn('Fallback falhou:', e)
        }
      } catch (err) {
        console.warn('Erro ao buscar usuário:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return user.permissions?.includes(permission) ?? false
  }

  const isAdmin = user?.role === 'admin_global'

  return (
    <UserContext.Provider value={{ user, isLoading, hasPermission, isAdmin }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}