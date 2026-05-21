'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatCPF, formatPhone, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, Pencil, Trash2 } from 'lucide-react'
import type { Client, CreateClientData } from '@/types/client'

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateClientData>({ nome: '' })

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get<{ data: Client[], total: number }>('/clients', { search: search || undefined }),
  })
  const clients = response?.data || []

  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => api.post('/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente criado com sucesso!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientData> }) => api.put(`/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente atualizado!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente excluído!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openCreate() {
    setEditingClient(null)
    setFormData({ nome: '' })
    setIsModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setFormData({
      nome: client.nome,
      cpf: client.cpf || '',
      telefone: client.telefone || '',
      email: client.email || '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingClient(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clientes" description="Gerencie os clientes do escritório" action={{ label: 'Novo Cliente', onClick: openCreate }} />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-xl border border-zinc-800 bg-[#121212] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !clients?.length ? (
        <EmptyState message="Nenhum cliente encontrado." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-[#1A1A1A]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">CPF</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Telefone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Criado em</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-zinc-800/30 table-row-hover">
                    <td className="px-6 py-3.5 text-sm font-medium text-white">{client.nome}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{formatCPF(client.cpf)}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{formatPhone(client.telefone)}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{client.email || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-500">{formatDate(client.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(client)} className="p-2 rounded-lg text-zinc-400 hover:bg-[#1A1A1A] hover:text-gold-400 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(client.id)} className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="nome" label="Nome *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
          <Input id="cpf" label="CPF" value={formData.cpf || ''} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" />
          <Input id="telefone" label="Telefone" value={formData.telefone || ''} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
          <Input id="email" label="E-mail" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>{editingClient ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Todos os processos, prazos e transações associados serão removidos."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
