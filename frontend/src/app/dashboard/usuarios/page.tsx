'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { getSupabase } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Trash2, Plus, Shield, ShieldCheck, User as UserIcon } from 'lucide-react'
import type { User, CreateUserData, UserRole } from '@/types/user'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const ROLES: { value: UserRole; label: string; icon: any; description: string }[] = [
  { value: 'admin_global', label: 'Administrador Global', icon: ShieldCheck, description: 'Acesso total ao sistema' },
  { value: 'funcionario', label: 'Funcionário', icon: Shield, description: 'Acesso limitado sem gerenciamento de usuários' },
]

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)

  const [formData, setFormData] = useState<CreateUserData>({
    nome: '',
    email: '',
    role: 'funcionario',
    senha: '',
  })

  const isAdmin = currentUserRole === 'admin_global'

  // Debug - показываем кнопку siempre для pruebas
  const showButton = true

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: User[] }>('/users'),
  })
  const users = response?.data || []

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário criado com sucesso!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => api.put('/users/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário atualizado!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete('/users/' + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário desativado!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openCreate() {
    setEditingUser(null)
    setFormData({ nome: '', email: '', role: 'funcionario', senha: '' })
    setIsModalOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      role: user.role,
      senha: '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData({ nome: '', email: '', role: 'funcionario', senha: '' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: { nome: formData.nome, role: formData.role },
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin_global') {
      return <Badge variant="warning">Admin Global</Badge>
    }
    return <Badge variant="info">Funcionário</Badge>
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Usuários" 
        description="Gerencie usuários do sistema" 
        action={showButton ? { label: 'Novo Usuário', onClick: openCreate } : undefined} 
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !users.length ? (
        <EmptyState message="Nenhum usuário encontrado." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cargo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Criado em</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/30 table-row-hover">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800">
                          <UserIcon className="h-4 w-4 text-zinc-400" />
                        </div>
                        <span className="text-sm text-zinc-200">{user.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{user.email}</td>
                    <td className="px-6 py-3.5">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={user.ativo ? 'success' : 'danger'}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-500">
                      {user.created_at ? formatDate(user.created_at) : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {showButton && user.role !== 'admin_global' && (
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openEdit(user)} 
                            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-gold-400 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(user.id)} 
                            className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nome"
            label="Nome Completo *"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Input
            id="email"
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser}
          />

          {!editingUser && (
            <Input
              id="senha"
              label="Senha *"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              required
              minLength={6}
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-300">Cargo *</label>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.role === role.value
                      ? 'bg-gold-600/10 border-gold-500/50'
                      : 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="sr-only"
                    disabled={editingUser && role.value === 'admin_global'}
                  />
                  <role.icon className={`h-5 w-5 ${formData.role === role.value ? 'text-gold-500' : 'text-zinc-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{role.label}</p>
                    <p className="text-xs text-zinc-500">{role.description}</p>
                  </div>
                  {formData.role === role.value && (
                    <div className="w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-black" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              {editingUser ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Desativar Usuário"
        message="Tem certeza que deseja desativar este usuário? Ele não poderá mais acessar o sistema."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}