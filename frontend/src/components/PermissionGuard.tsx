'use client'

import { useUser, type Permission } from '@/hooks/useUser'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function PermissionGuard({ permission, children, fallback, redirectTo }: PermissionGuardProps) {
  const { user, isLoading, hasPermission } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isLoading) return
    
    setChecked(true)
    
    if (!hasPermission(permission)) {
      if (redirectTo) {
        router.push(redirectTo)
      }
    }
  }, [isLoading, hasPermission, permission, router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (!checked) return null

  if (!hasPermission(permission)) {
    if (fallback) return fallback
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-zinc-400">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return <>{children}</>
}