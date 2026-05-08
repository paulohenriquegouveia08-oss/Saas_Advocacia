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
import { UrgenciaBadge, Badge } from '@/components/ui/Badge'
import { Pencil, Trash2, CheckCircle } from 'lucide-react'
import type { Deadline, CreateDeadlineData, DeadlineStatus } from '@/types/deadline'

export default function PrazosPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Deadline | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateDeadlineData>({ process_id: '', data_vencimento: '' })

  const { data: processesData } = useQuery({
    queryKey: ['processes'],
    queryFn: () => api.get<{ data: { id: string; numero: string }[], total: number }>('/processes'),
  })

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['deadlines', statusFilter],
    queryFn: () => api.get<{ data: Deadline[], total: number }>('/deadlines', { status: statusFilter || undefined }),
  })
  const data = response?.data || []

  const create = useMutation({ mutationFn: (d: CreateDeadlineData) => api.post('/deadlines', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['deadlines'] }); toast.success('Prazo criado!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const update = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<CreateDeadlineData> }) => api.put(`/deadlines/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['deadlines'] }); toast.success('Prazo atualizado!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const complete = useMutation({ mutationFn: (id: string) => api.patch(`/deadlines/${id}/complete`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['deadlines'] }); toast.success('Prazo concluído!') }, onError: (e: Error) => toast.error(e.message) })
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/deadlines/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['deadlines'] }); toast.success('Excluído!'); setDeleteId(null) }, onError: (e: Error) => toast.error(e.message) })

  function open(d?: Deadline) { setEditing(d || null); setForm(d ? { process_id: d.process_id, descricao: d.descricao || '', data_vencimento: d.data_vencimento, responsavel_id: d.responsavel_id || '' } : { process_id: '', data_vencimento: '' }); setIsModalOpen(true) }
  function close() { setIsModalOpen(false); setEditing(null) }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      update.mutate({ id: editing.id, d: form })
    } else {
      create.mutate(form)
    }
  }

  const processes = processesData?.data || []
  const sv: Record<DeadlineStatus, 'info' | 'danger' | 'success'> = { pendente: 'info', atrasado: 'danger', concluido: 'success' }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Prazos" description="Controle de prazos processuais" action={{ label: 'Novo Prazo', onClick: () => open() }} />
      <div className="flex gap-2 mb-6">
        {(['', 'pendente', 'atrasado', 'concluido'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
            {s === '' ? 'Todos' : s === 'concluido' ? 'Concluído' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {isLoading ? <TableSkeleton rows={5} cols={6} /> : isError ? <ErrorState onRetry={refetch} /> : !data?.length ? <EmptyState message="Nenhum prazo encontrado." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800/50 bg-slate-900/80">
              {['Processo','Descrição','Vencimento','Dias','Urgência','Status',''].map(h => <th key={h} className={`${h===''?'text-right':'text-left'} px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider`}>{h || 'Ações'}</th>)}
            </tr></thead>
            <tbody>{data.map((d) => (
              <tr key={d.id} className={`border-b border-slate-800/30 table-row-hover ${d.urgencia === 'vencido' || d.urgencia === 'vence_hoje' ? 'bg-red-500/[0.03]' : ''}`}>
                <td className="px-6 py-3.5 text-sm font-mono text-slate-300">{d.processo_numero || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-slate-300 max-w-xs truncate">{d.descricao || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-slate-400">{formatDate(d.data_vencimento)}</td>
                <td className="px-6 py-3.5 text-sm text-slate-400">{d.dias_restantes !== null ? `${d.dias_restantes}d` : '—'}</td>
                <td className="px-6 py-3.5">{d.urgencia ? <UrgenciaBadge urgencia={d.urgencia} /> : '—'}</td>
                <td className="px-6 py-3.5"><Badge variant={sv[d.status]}>{d.status === 'concluido' ? 'Concluído' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}</Badge></td>
                <td className="px-6 py-3.5 text-right"><div className="flex items-center justify-end gap-1">
                  {d.status !== 'concluido' && <button onClick={() => complete.mutate(d.id)} className="p-2 rounded-lg text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors" title="Concluir"><CheckCircle className="h-4 w-4" /></button>}
                  <button onClick={() => open(d)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteId(d.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={close} title={editing ? 'Editar Prazo' : 'Novo Prazo'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Processo *</label>
            <select value={form.process_id} onChange={e => setForm({ ...form, process_id: e.target.value })} required className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione um processo</option>
              {processes.map(p => <option key={p.id} value={p.id}>{p.numero}</option>)}
            </select>
          </div>
          <Input id="descricao" label="Descrição" value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          <Input id="data_vencimento" label="Data Vencimento *" type="date" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && del.mutate(deleteId)} title="Excluir Prazo" message="Tem certeza?" isLoading={del.isPending} />
    </div>
  )
}
