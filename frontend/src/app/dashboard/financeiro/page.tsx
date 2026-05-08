'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import type { Financial, FinancialSummary, CreateFinancialData, FinancialType } from '@/types/financial'

export default function FinanceiroPage() {
  const qc = useQueryClient()
  const [tipoFilter, setTipoFilter] = useState<FinancialType | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Financial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateFinancialData>({ tipo: 'entrada', valor: 0 })

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['financial', tipoFilter],
    queryFn: () => api.get<{ data: Financial[], total: number }>('/financial', { tipo: tipoFilter || undefined }),
  })
  const data = response?.data || []

  const { data: summary } = useQuery({
    queryKey: ['financial', 'summary'],
    queryFn: () => api.get<FinancialSummary>('/financial/summary'),
  })

  const create = useMutation({ mutationFn: (d: CreateFinancialData) => api.post('/financial', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['financial'] }); toast.success('Transação criada!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const update = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<CreateFinancialData> }) => api.put(`/financial/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['financial'] }); toast.success('Atualizado!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/financial/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['financial'] }); toast.success('Excluído!'); setDeleteId(null) }, onError: (e: Error) => toast.error(e.message) })

  function open(f?: Financial) { setEditing(f || null); setForm(f ? { tipo: f.tipo, descricao: f.descricao || '', valor: f.valor, categoria: f.categoria || '', data: f.data || '', client_id: f.client_id || '' } : { tipo: 'entrada', valor: 0 }); setIsModalOpen(true) }
  function close() { setIsModalOpen(false); setEditing(null) }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? update.mutate({ id: editing.id, d: form }) : create.mutate(form) }

  const summaryCards = [
    { label: 'Entradas', value: summary?.entradas ?? 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Saídas', value: summary?.saidas ?? 0, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Saldo', value: summary?.saldo ?? 0, icon: DollarSign, color: (summary?.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400', bg: (summary?.saldo ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Financeiro" description="Controle de entradas e saídas" action={{ label: 'Nova Transação', onClick: () => open() }} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['', 'entrada', 'saida'] as const).map((t) => (
          <button key={t} onClick={() => setTipoFilter(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tipoFilter === t ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
            {t === '' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={5} cols={5} /> : isError ? <ErrorState onRetry={refetch} /> : !data?.length ? <EmptyState message="Nenhuma transação encontrada." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800/50 bg-slate-900/80">
              {['Tipo','Descrição','Categoria','Data','Valor',''].map(h => <th key={h} className={`${h===''?'text-right':'text-left'} px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider`}>{h || 'Ações'}</th>)}
            </tr></thead>
            <tbody>{data.map((f) => (
              <tr key={f.id} className="border-b border-slate-800/30 table-row-hover">
                <td className="px-6 py-3.5"><Badge variant={f.tipo === 'entrada' ? 'success' : 'danger'}>{f.tipo === 'entrada' ? '+ Entrada' : '- Saída'}</Badge></td>
                <td className="px-6 py-3.5 text-sm text-slate-300">{f.descricao || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-slate-400">{f.categoria || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-slate-400">{formatDate(f.data)}</td>
                <td className={`px-6 py-3.5 text-sm font-semibold ${f.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(f.valor)}</td>
                <td className="px-6 py-3.5 text-right"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => open(f)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteId(f.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={close} title={editing ? 'Editar Transação' : 'Nova Transação'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Tipo *</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as FinancialType })} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <Input id="valor" label="Valor *" type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} required />
          <Input id="descricao" label="Descrição" value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          <Input id="categoria" label="Categoria" value={form.categoria || ''} onChange={e => setForm({ ...form, categoria: e.target.value })} />
          <Input id="data" label="Data" type="date" value={form.data || ''} onChange={e => setForm({ ...form, data: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && del.mutate(deleteId)} title="Excluir Transação" message="Tem certeza?" isLoading={del.isPending} />
    </div>
  )
}
