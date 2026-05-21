'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { getSupabase } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Building2, User, Users, Settings as SettingsIcon, Loader2, Save, Shield } from 'lucide-react'
import { cn, formatCNPJ } from '@/lib/utils'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Tab = 'perfil' | 'escritorio' | 'cargos'

interface Settings {
  escritorio_nome?: string | null
  escritorio_cnpj?: string | null
  escritorio_telefone?: string | null
  escritorio_email?: string | null
  escritorio_endereco?: string | null
  escritorio_logo?: string | null
  notificar_prazo_vencido?: boolean
  notificar_prazo_proximo?: boolean
  dias_antecedencia?: number
}

interface UserData {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string | null
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient()
  const { user: currentUser, isLoading: userLoading, isAdmin } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    telefone: '',
    novaSenha: '',
    confirmarSenha: '',
  })

  const [escritorioForm, setEscritorioForm] = useState<Settings>({
    escritorio_nome: '',
    escritorio_cnpj: '',
    escritorio_telefone: '',
    escritorio_email: '',
    escritorio_endereco: '',
  })

  const { data: currentUserData, isLoading: loadingUserData } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      if (!currentUser?.id) return null
      return api.get<{ data: UserData }>('/users/' + currentUser.id)
    },
    enabled: !!currentUser?.id,
  })

  const loadingUser = loadingUserData || userLoading || !currentUser?.id

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Settings>('/settings'),
  })

  useEffect(() => {
    if (currentUserData?.data) {
      setPerfilForm(p => ({
        ...p,
        nome: currentUserData.data.nome || '',
        telefone: currentUserData.data.telefone || '',
      }))
    } else if (currentUser?.nome && !currentUserData?.data) {
      setPerfilForm(p => ({
        ...p,
        nome: currentUser.nome,
        telefone: '',
      }))
    }
  }, [currentUserData, currentUser])

  useEffect(() => {
    if (settings) {
      setEscritorioForm(s => ({
        ...s,
        ...settings,
        escritorio_cnpj: settings.escritorio_cnpj ? formatCNPJ(settings.escritorio_cnpj) : ''
      }))
    }
  }, [settings])


  const updatePerfil = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase()
      
      if (!currentUser) throw new Error('Usuário não encontrado')
      
      if (perfilForm.novaSenha && perfilForm.novaSenha !== perfilForm.confirmarSenha) {
        throw new Error('As senhas não conferem')
      }

      if (perfilForm.novaSenha) {
        const { error } = await supabase.auth.updateUser({
          password: perfilForm.novaSenha,
        })
        if (error) throw new Error(error.message)
      }

      await api.put('/users/' + currentUser.id, {
        nome: perfilForm.nome,
        telefone: perfilForm.telefone || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] })
      toast.success('Perfil atualizado!')
      setPerfilForm(p => ({ ...p, novaSenha: '', confirmarSenha: '' }))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateEscritorio = useMutation({
    mutationFn: (data: Partial<Settings>) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Configurações salvas!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const tabs = [
    { id: 'perfil' as Tab, label: 'Meu Perfil', icon: User },
    { id: 'escritorio' as Tab, label: 'Dados do Escritório', icon: Building2, adminOnly: true },
    { id: 'cargos' as Tab, label: 'Cargos e Permissões', icon: Shield, adminOnly: true, href: '/dashboard/configuracoes/cargos' },
  ]

  const filteredTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  if (loadingUser) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Configurações" description="Gerencie suas preferências e dados do sistema" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configurações" description="Gerencie suas preferências e dados do sistema" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2">
            {filteredTabs.map((tab) => (
              tab.href ? (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                    'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                    activeTab === tab.id
                      ? 'bg-gold-600/20 text-gold-400 border border-gold-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'perfil' && (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-6">Meu Perfil</h2>
              
              <div className="space-y-4 max-w-md">
                <Input
                  id="nome"
                  label="Nome Completo"
                  value={perfilForm.nome}
                  onChange={e => setPerfilForm(p => ({ ...p, nome: e.target.value }))}
                />
                
                <Input
                  id="email"
                  label="Email"
                  value={currentUser?.email || currentUserData?.data?.email || ''}
                  disabled
                  className="opacity-60"
                />

                <Input
                  id="telefone"
                  label="Telefone"
                  value={perfilForm.telefone}
                  onChange={e => setPerfilForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />

                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-300 mb-4">Alterar Senha</h3>
                  <div className="space-y-4">
                    <Input
                      id="novaSenha"
                      label="Nova Senha"
                      type="password"
                      value={perfilForm.novaSenha}
                      onChange={e => setPerfilForm(p => ({ ...p, novaSenha: e.target.value }))}
                    />
                    <Input
                      id="confirmarSenha"
                      label="Confirmar Senha"
                      type="password"
                      value={perfilForm.confirmarSenha}
                      onChange={e => setPerfilForm(p => ({ ...p, confirmarSenha: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => updatePerfil.mutate()} 
                    isLoading={updatePerfil.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escritorio' && (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-6">Dados do Escritório</h2>
              
              {loadingSettings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                </div>
              ) : (
                <div className="space-y-4 max-w-md">
                  <Input
                    id="escritorio_nome"
                    label="Nome do Escritório"
                    value={escritorioForm.escritorio_nome || ''}
                    onChange={e => setEscritorioForm(p => ({ ...p, escritorio_nome: e.target.value }))}
                  />
                  
                  <Input
                    id="escritorio_cnpj"
                    label="CNPJ"
                    value={escritorioForm.escritorio_cnpj || ''}
                    onChange={e => {
                      const value = e.target.value
                      const cleanValue = value.replace(/\D/g, '').slice(0, 14)
                      let masked = cleanValue
                      if (cleanValue.length > 2) {
                        masked = cleanValue.replace(/^(\d{2})/, '$1.')
                      }
                      if (cleanValue.length > 5) {
                        masked = cleanValue.replace(/^(\d{2})(\d{3})/, '$1.$2.')
                      }
                      if (cleanValue.length > 8) {
                        masked = cleanValue.replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3/')
                      }
                      if (cleanValue.length > 12) {
                        masked = cleanValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4-')
                      }
                      setEscritorioForm(p => ({ ...p, escritorio_cnpj: masked }))
                    }}
                    placeholder="00.000.000/0001-00"
                  />
                  
                  <Input
                    id="escritorio_telefone"
                    label="Telefone"
                    value={escritorioForm.escritorio_telefone || ''}
                    onChange={e => setEscritorioForm(p => ({ ...p, escritorio_telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                  
                  <Input
                    id="escritorio_email"
                    label="Email"
                    type="email"
                    value={escritorioForm.escritorio_email || ''}
                    onChange={e => setEscritorioForm(p => ({ ...p, escritorio_email: e.target.value }))}
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-300">Endereço</label>
                    <textarea
                      value={escritorioForm.escritorio_endereco || ''}
                      onChange={e => setEscritorioForm(p => ({ ...p, escritorio_endereco: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                      placeholder="Endereço completo do escritório"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={() => updateEscritorio.mutate(escritorioForm)} 
                      isLoading={updateEscritorio.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}