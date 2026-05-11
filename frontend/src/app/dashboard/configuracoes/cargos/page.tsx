'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shield, Pencil, Trash2, Users } from 'lucide-react'
import type { Role, Permission, CreateRoleData } from '@/types/role'

export default function CargosPage() {
  const qc = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateRoleData>({ nome: '', descricao: '', permissions: [] })

  const { data: responseRoles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<{ data: Role[] }>('/roles'),
  })
  const roles = responseRoles?.data || []

  const { data: responsePerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get<{ data: Permission[] }>('/roles/permissions'),
  })
  const permissions = responsePerms?.data || []

  const create = useMutation({ mutationFn: (d: CreateRoleData) => api.post('/roles', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Cargo criado!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const update = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<CreateRoleData> }) => api.put(`/roles/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Cargo atualizado!'); close() }, onError: (e: Error) => toast.error(e.message) })
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/roles/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Excluído com sucesso!'); setDeleteId(null) }, onError: (e: Error) => toast.error(e.message) })

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.grupo]) acc[perm.grupo] = []
      acc[perm.grupo].push(perm)
      return acc
    }, {} as Record<string, Permission[]>)
  }, [permissions])

  function open(r?: Role) {
    setEditing(r || null)
    setForm(r ? { nome: r.nome, descricao: r.descricao || '', permissions: [...r.permissions] } : { nome: '', descricao: '', permissions: [] })
    setIsModalOpen(true)
  }

  function close() { setIsModalOpen(false); setEditing(null) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) update.mutate({ id: editing.id, d: form })
    else create.mutate(form)
  }

  function togglePermission(chave: string) {
    setForm(prev => {
      const isSelected = prev.permissions.includes(chave)
      return {
        ...prev,
        permissions: isSelected ? prev.permissions.filter(p => p !== chave) : [...prev.permissions, chave]
      }
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gerenciamento de Cargos"
        description="Defina papéis e permissões granulares para acesso ao sistema."
        action={{ label: 'Criar Cargo', onClick: () => open() }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl border border-zinc-800 bg-[#121212] animate-pulse"></div>
          ))
        ) : roles.map((role) => (
          <div key={role.id} className="relative flex flex-col rounded-2xl border border-zinc-800/80 bg-[#121212] p-6 hover:border-gold-500/50 transition-colors duration-300 shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold-500/10">
                  <Shield className="h-5 w-5 text-gold-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{role.nome}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {role.users_count} usuário{role.users_count !== 1 && 's'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mt-4 mb-6 flex-1">{role.descricao || 'Nenhuma descrição fornecida.'}</p>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-auto">
              <span className="text-xs text-gold-500/70 font-medium bg-gold-500/10 px-2 py-1 rounded-md">
                {role.permissions.length} permissões ativas
              </span>
              <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button onClick={() => open(role)} className="p-2 rounded-lg text-zinc-400 hover:bg-[#1A1A1A] hover:text-gold-400 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteId(role.id)} className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={close}
        title={editing ? 'Editar Cargo' : 'Novo Cargo'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" form="cargos-form" isLoading={create.isPending || update.isPending}>
              {editing ? 'Salvar Cargo' : 'Criar Cargo'}
            </Button>
          </div>
        }
      >
        <form id="cargos-form" onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="nome" label="Nome do Cargo *" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
            <Input id="descricao" label="Descrição" value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-medium text-zinc-100 border-b border-zinc-800 pb-2 mb-4">Permissões de Acesso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {Object.entries(groupedPermissions).map(([grupo, perms]) => (
                <div key={grupo} className="space-y-3">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{grupo}</h5>
                  <div className="space-y-2">
                    {perms.map(p => {
                      const isSelected = form.permissions.includes(p.chave)
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePermission(p.chave)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-[#121212] hover:border-gold-500/30 transition-all text-left group"
                        >
                          <span className={`text-sm ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>{p.nome}</span>
                          <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSelected ? 'bg-gold-500' : 'bg-zinc-700'}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSelected ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && del.mutate(deleteId)} title="Excluir Cargo" message="Tem certeza que deseja excluir este cargo? Ele não poderá ser excluído se existirem usuários vinculados." isLoading={del.isPending} />
    </div>
  )
}
