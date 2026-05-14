'use client'

import { useState, useEffect } from 'react'
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
import { Pencil, Trash2, Search } from 'lucide-react'
import type { Process, CreateProcessData, ProcessStatus } from '@/types/process'

const TIPOS_ACAO = [
  'Ação Civil',
  'Ação de Execução',
  'Ação de Investigação de Paternidade',
  'Ação de Obrigação de Fazer',
  'Ação de Repetição de Indébito',
  'Ação de Rescisão',
  'Ação Popular',
  'Ação Trabalhista',
  'Ação Tributária',
  'Embargos à Execução',
  'Habeas Corpus',
  'Mandado de Segurança',
  'Procedimento Comum',
  'Procedimento Especial',
  'Recurso',
  'Outro',
]

const TRIBUNAIS = [
  'STF - Supremo Tribunal Federal',
  'STJ - Superior Tribunal de Justiça',
  'TJSP - TJ de São Paulo',
  'TJRJ - TJ do Rio de Janeiro',
  'TJMG - TJ de Minas Gerais',
  'TJRS - TJ do Rio Grande do Sul',
  'TJPR - TJ do Paraná',
  'TJSC - TJ de Santa Catarina',
  'TJBA - TJ da Bahia',
  'TJGO - TJ de Goiás',
  'TJPE - TJ de Pernambuco',
  'TJCE - TJ do Ceará',
  'TJPA - TJ do Pará',
  'TJMA - TJ do Maranhão',
  'TJPI - TJ do Piauí',
  'TRT-SP - TRT de São Paulo',
  'TRT-RJ - TRT do Rio de Janeiro',
  'TRT-MG - TRT de Minas Gerais',
  'TRF1 - TRF da 1ª Região',
  'TRF2 - TRF da 2ª Região',
  'TRF3 - TRF da 3ª Região',
  'TRF4 - TRF da 4ª Região',
  'TRF5 - TRF da 5ª Região',
  'Outro',
]

export default function ProcessosPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProcessData>({ client_id: '', numero: '' })

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ data: { id: string; nome: string }[], total: number }>('/clients'),
  })

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['processes', statusFilter, debouncedSearch],
    queryFn: () => api.get<{ data: Process[], total: number }>('/processes', {
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
      page: 1,
      limit: 20,
    }),
    staleTime: 0,
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

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por número, tribunal, tipo, cliente..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-xl border border-zinc-800 bg-[#121212] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {(['', 'ativo', 'suspenso', 'encerrado'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === s
                ? 'bg-gold-600/20 text-gold-400 border border-gold-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processes.map((proc) => (
            <div key={proc.id} className="relative flex flex-col rounded-2xl border border-zinc-800/80 bg-[#121212] p-6 hover:border-gold-500/50 transition-colors duration-300 shadow-sm group">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Número do Processo</span>
                  <span className="text-sm font-mono font-medium text-zinc-100 truncate">{proc.numero}</span>
                </div>
                <StatusBadge status={proc.status} />
              </div>
              
              <div className="flex flex-col gap-4 mb-6 flex-1">
                <div>
                  <span className="block text-xs font-medium text-zinc-500 mb-1">Cliente</span>
                  <span className="text-sm font-medium text-zinc-200">{proc.cliente_nome || '—'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-zinc-500 mb-1">Ação / Tribunal</span>
                  <span className="text-sm text-zinc-400 leading-snug">{proc.tipo_acao || '—'}<br/>{proc.tribunal || '—'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-auto">
                <span className="text-xs text-zinc-500 font-medium">
                  Criado em {formatDate(proc.created_at)}
                </span>
                <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(proc)} className="p-2 rounded-lg text-zinc-400 hover:bg-[#1A1A1A] hover:text-gold-400 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(proc.id)} className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProcess ? 'Editar Processo' : 'Novo Processo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="numero" label="Número do Processo *" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Cliente *</label>
            <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} required className="w-full h-11 rounded-xl border border-zinc-800 bg-[#121212] px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300">
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-300">Tipo de Ação</label>
            <select
              value={formData.tipo_acao || ''}
              onChange={(e) => setFormData({ ...formData, tipo_acao: e.target.value })}
              className="w-full h-11 rounded-xl border border-zinc-800 bg-[#121212] px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300"
            >
              <option value="">Selecione o tipo de ação</option>
              {TIPOS_ACAO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-300">Tribunal</label>
            <select
              value={formData.tribunal || ''}
              onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })}
              className="w-full h-11 rounded-xl border border-zinc-800 bg-[#121212] px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300"
            >
              <option value="">Selecione o tribunal</option>
              {TRIBUNAIS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input id="parte_contraria" label="Parte Contrária" value={formData.parte_contraria || ''} onChange={(e) => setFormData({ ...formData, parte_contraria: e.target.value })} />
          {editingProcess && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">Status</label>
              <select
                value={formData.status || 'ativo'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProcessStatus })}
                className="w-full h-11 rounded-xl border border-zinc-800 bg-[#121212] px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300"
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
