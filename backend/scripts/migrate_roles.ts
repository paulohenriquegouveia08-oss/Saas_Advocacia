import { supabaseAdmin } from '../src/config/supabase';

const permissions = [
  { chave: 'users:read', nome: 'Visualizar usuários', grupo: 'Usuários' },
  { chave: 'users:create', nome: 'Criar usuários', grupo: 'Usuários' },
  { chave: 'users:update', nome: 'Editar usuários', grupo: 'Usuários' },
  { chave: 'users:delete', nome: 'Excluir usuários', grupo: 'Usuários' },
  { chave: 'clients:read', nome: 'Visualizar clientes', grupo: 'Clientes' },
  { chave: 'clients:create', nome: 'Criar clientes', grupo: 'Clientes' },
  { chave: 'clients:update', nome: 'Editar clientes', grupo: 'Clientes' },
  { chave: 'clients:delete', nome: 'Excluir clientes', grupo: 'Clientes' },
  { chave: 'processes:read', nome: 'Visualizar processos', grupo: 'Processos' },
  { chave: 'processes:create', nome: 'Criar processos', grupo: 'Processos' },
  { chave: 'processes:update', nome: 'Editar processos', grupo: 'Processos' },
  { chave: 'processes:delete', nome: 'Excluir processos', grupo: 'Processos' },
  { chave: 'deadlines:read', nome: 'Visualizar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:create', nome: 'Criar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:update', nome: 'Editar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:delete', nome: 'Excluir prazos', grupo: 'Prazos' },
  { chave: 'deadlines:complete', nome: 'Concluir prazos', grupo: 'Prazos' },
  { chave: 'financial:read', nome: 'Visualizar financeiro', grupo: 'Financeiro' },
  { chave: 'financial:create', nome: 'Criar transações', grupo: 'Financeiro' },
  { chave: 'financial:update', nome: 'Editar transações', grupo: 'Financeiro' },
  { chave: 'financial:delete', nome: 'Excluir transações', grupo: 'Financeiro' },
  { chave: 'movements:read', nome: 'Visualizar diário', grupo: 'Diário de Processos' },
  { chave: 'movements:create', nome: 'Criar movimentações', grupo: 'Diário de Processos' },
  { chave: 'movements:update', nome: 'Editar movimentações', grupo: 'Diário de Processos' },
  { chave: 'movements:delete', nome: 'Excluir movimentações', grupo: 'Diário de Processos' },
  { chave: 'settings:read', nome: 'Visualizar configurações', grupo: 'Configurações' },
  { chave: 'settings:update', nome: 'Editar configurações', grupo: 'Configurações' },
  { chave: 'notifications:read', nome: 'Ler notificações', grupo: 'Notificações' },
  { chave: 'notifications:update', nome: 'Atualizar notificações', grupo: 'Notificações' },
];

const INITIAL_ROLES: Record<string, string[]> = {
  admin_global: permissions.map(p => p.chave),
  funcionario: [
    'clients:create', 'clients:read', 'clients:update',
    'processes:create', 'processes:read', 'processes:update',
    'movements:create', 'movements:read',
    'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:complete',
    'notifications:read', 'notifications:update',
    'financial:create', 'financial:read', 'financial:update',
  ],
  cliente: [
    'processes:read', 'deadlines:read',
    'notifications:read', 'notifications:update',
  ],
};

async function migrate() {
  console.log('Iniciando migração de cargos e permissões...');
  console.log('Nota: As tabelas devem ser criadas via Supabase SQL Editor antes de rodar este script.');

  try {
    console.log('Semeando permissões...');
    for (const p of permissions) {
      await supabaseAdmin
        .from('permissions')
        .upsert({ nome: p.nome, chave: p.chave, grupo: p.grupo }, { onConflict: 'chave' })
    }

    console.log('Criando roles iniciais e vinculando permissões...');
    for (const [roleName, rolePerms] of Object.entries(INITIAL_ROLES)) {
      const { data: existingRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('nome', roleName)
        .single()

      let roleId: string
      if (!existingRole) {
        const { data: newRole } = await supabaseAdmin
          .from('roles')
          .insert({ nome: roleName, descricao: `Cargo padrão do sistema: ${roleName}` })
          .select('id')
          .single()
        if (!newRole) { console.error(`Erro ao criar role ${roleName}`); continue }
        roleId = newRole.id
      } else {
        roleId = existingRole.id
      }

      const { data: existingPerms } = await supabaseAdmin
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId)

      const existingPermIds = new Set(existingPerms?.map(p => p.permission_id) || [])

      const { data: allPerms } = await supabaseAdmin
        .from('permissions')
        .select('id, chave')
        .in('chave', rolePerms)

      for (const perm of allPerms || []) {
        if (!existingPermIds.has(perm.id)) {
          await supabaseAdmin
            .from('role_permissions')
            .insert({ role_id: roleId, permission_id: perm.id })
        }
      }
    }

    console.log('Migrando usuários existentes para user_roles...');
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .not('role', 'is', null)

    if (users) {
      const { data: roles } = await supabaseAdmin.from('roles').select('id, nome')
      const roleMap: Record<string, string> = {}
      for (const r of roles || []) roleMap[r.nome] = r.id

      const { data: existingLinks } = await supabaseAdmin.from('user_roles').select('user_id, role_id')
      const existingLinkSet = new Set(existingLinks?.map(l => `${l.user_id}:${l.role_id}`) || [])

      for (const user of users) {
        const roleId = roleMap[user.role]
        if (roleId && !existingLinkSet.has(`${user.id}:${roleId}`)) {
          await supabaseAdmin.from('user_roles').insert({ user_id: user.id, role_id: roleId })
        }
      }
    }

    console.log('Migração concluída com sucesso!')
  } catch (error) {
    console.error('Erro na migração:', error)
  }
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
