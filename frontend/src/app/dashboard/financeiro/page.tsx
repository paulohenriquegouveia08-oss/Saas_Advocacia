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
import { Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { Financial, FinancialSummary, CreateFinancialData, FinancialType } from '@/types/financial'

export default function FinanceiroPage() {
  const qc = useQueryClient()
  const [tipoFilter, setTipoFilter] = useState<FinancialType | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [editing, setEditing] = useState<Financial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateFinancialData>({ tipo: 'entrada', valor: 0 })
  const [valorInput, setValorInput] = useState<string>('')

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

  function open(f?: Financial) { 
    setEditing(f || null); 
    setForm(f ? { tipo: f.tipo, descricao: f.descricao || '', valor: f.valor, categoria: f.categoria || '', data: f.data || '', client_id: f.client_id || null } : { tipo: 'entrada', valor: 0, client_id: null }); 
    setValorInput(f ? String(f.valor) : '');
    setStep(f ? 'form' : 'type');
    setIsModalOpen(true); 
  }
  function close() { setIsModalOpen(false); setEditing(null); setStep('type'); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? update.mutate({ id: editing.id, d: form }) : create.mutate(form) }

  const summaryCards = [
    { label: 'Entradas', value: summary?.total_entradas ?? 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Saídas', value: summary?.total_saidas ?? 0, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Saldo', value: summary?.saldo ?? 0, icon: DollarSign, color: (summary?.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400', bg: (summary?.saldo ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Financeiro" description="Controle de entradas e saídas" action={{ label: 'Nova Transação', onClick: () => open() }} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-800/80 bg-[#121212] p-5 flex items-center gap-4 shadow-sm">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['', 'entrada', 'saida'] as const).map((t) => (
          <button key={t} onClick={() => setTipoFilter(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tipoFilter === t ? 'bg-gold-500/10 text-gold-500 border border-gold-500/30' : 'bg-[#121212] text-zinc-400 border border-zinc-800 hover:bg-[#1A1A1A]'}`}>
            {t === '' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={5} cols={5} /> : isError ? <ErrorState onRetry={refetch} /> : !data?.length ? <EmptyState message="Nenhuma transação encontrada." /> : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121212] shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800/60 bg-[#1A1A1A]">
              {['Tipo','Descrição','Categoria','Data','Valor',''].map(h => <th key={h} className={`${h===''?'text-right':'text-left'} px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider`}>{h || 'Ações'}</th>)}
            </tr></thead>
            <tbody>{data.map((f) => (
              <tr key={f.id} className="border-b border-zinc-800/30 table-row-hover">
                <td className="px-6 py-3.5"><Badge variant={f.tipo === 'entrada' ? 'success' : 'danger'}>{f.tipo === 'entrada' ? '+ Entrada' : '- Saída'}</Badge></td>
                <td className="px-6 py-3.5 text-sm text-zinc-300">{f.descricao || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-zinc-400">{f.categoria || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-zinc-400">{formatDate(f.data)}</td>
                <td className={`px-6 py-3.5 text-sm font-semibold ${f.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(f.valor)}</td>
                <td className="px-6 py-3.5 text-right"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => open(f)} className="p-2 rounded-lg text-zinc-400 hover:bg-[#1A1A1A] hover:text-gold-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteId(f.id)} className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={close} title={editing ? 'Editar Transação' : 'Nova Transação'}>
        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <button onClick={() => { setForm({ ...form, tipo: 'entrada', categoria: '' }); setStep('form') }} className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-[#121212] rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="font-semibold text-zinc-100">Entrada</span>
            </button>
            <button onClick={() => { setForm({ ...form, tipo: 'saida', categoria: '' }); setStep('form') }} className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-[#121212] rounded-2xl hover:bg-red-500/10 hover:border-red-500/50 transition-all group">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowDownRight className="h-6 w-6 text-red-400" />
              </div>
              <span className="font-semibold text-zinc-100">Saída</span>
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input id="valor" label="Valor *" type="number" step="0.01" value={valorInput} onChange={e => { setValorInput(e.target.value); setForm({ ...form, valor: parseFloat(e.target.value) || 0 }) }} required />
            <Input id="descricao" label="Descrição" value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">Categoria</label>
              <select value={form.categoria || ''} onChange={e => setForm({ ...form, categoria: e.target.value })} className="w-full h-11 rounded-xl border border-zinc-800 bg-[#121212] px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300">
                <option value="">Selecione uma categoria...</option>
                {(form.tipo === 'entrada' ? ['Honorários', 'Consultoria', 'Acordos', 'Reembolso de Custas', 'Outros'] : ['Custas Judiciais', 'Salários', 'Impostos', 'Aluguel', 'Material de Escritório', 'Marketing', 'OAB', 'Software', 'Custos Escritório', 'Outros']).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input id="data" label="Data" type="date" value={form.data || ''} onChange={e => setForm({ ...form, data: e.target.value })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
              <Button type="submit" isLoading={create.isPending || update.isPending}>{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && del.mutate(deleteId)} title="Excluir Transação" message="Tem certeza?" isLoading={del.isPending} />
    </div>
  )
}
