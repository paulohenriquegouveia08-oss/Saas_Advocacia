'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Pencil, Trash2 } from 'lucide-react'
import type { Process, CreateProcessData, ProcessStatus } from '@/types/process'

export default function ProcessosPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProcessData>({ client_id: '', numero: '' })

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ data: { id: string; nome: string }[], total: number }>('/clients'),
  })

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['processes', statusFilter],
    queryFn: () => api.get<{ data: Process[], total: number }>('/processes', { status: statusFilter || undefined }),
  })
  const processes = response?.data || []

  const createMutation = useMutation({
    mutationFn: (data: CreateProcessData) => api.post('/processes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      toast.success('Processo criado com sucesso!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProcessData> }) => api.put(`/processes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      toast.success('Processo atualizado!')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/processes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      toast.success('Processo excluído!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openCreate() {
    setEditingProcess(null)
    setFormData({ client_id: '', numero: '' })
    setIsModalOpen(true)
  }

  function openEdit(process: Process) {
    setEditingProcess(process)
    setFormData({
      client_id: process.client_id,
      numero: process.numero,
      tribunal: process.tribunal || '',
      tipo_acao: process.tipo_acao || '',
      parte_contraria: process.parte_contraria || '',
      status: process.status,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingProcess(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingProcess) {
      updateMutation.mutate({ id: editingProcess.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const clients = clientsData?.data || []

  return (
    <div className="animate-fade-in">
      <PageHeader title="Processos" description="Gerencie os processos judiciais" action={{ label: 'Novo Processo', onClick: openCreate }} />

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {(['', 'ativo', 'suspenso', 'encerrado'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === s
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !processes?.length ? (
        <EmptyState message="Nenhum processo encontrado." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50 bg-slate-900/80">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Número</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo de Ação</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Tribunal</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Criado em</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((proc) => (
                  <tr key={proc.id} className="border-b border-slate-800/30 table-row-hover">
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-white">{proc.numero}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">{proc.cliente_nome || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">{proc.tipo_acao || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">{proc.tribunal || '—'}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={proc.status} /></td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{formatDate(proc.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(proc)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(proc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
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
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProcess ? 'Editar Processo' : 'Novo Processo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="numero" label="Número do Processo *" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Cliente *</label>
            <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} required className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <Input id="tipo_acao" label="Tipo de Ação" value={formData.tipo_acao || ''} onChange={(e) => setFormData({ ...formData, tipo_acao: e.target.value })} />
          <Input id="tribunal" label="Tribunal" value={formData.tribunal || ''} onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })} />
          <Input id="parte_contraria" label="Parte Contrária" value={formData.parte_contraria || ''} onChange={(e) => setFormData({ ...formData, parte_contraria: e.target.value })} />
          {editingProcess && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <select
                value={formData.status || 'ativo'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProcessStatus })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>{editingProcess ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Processo"
        message="Tem certeza que deseja excluir este processo? Prazos, movimentações e notificações serão removidos."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
