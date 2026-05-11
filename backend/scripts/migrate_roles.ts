import { pool } from '../src/config/database';

const permissions = [
  // Usuários
  { chave: 'users:read', nome: 'Visualizar usuários', grupo: 'Usuários' },
  { chave: 'users:create', nome: 'Criar usuários', grupo: 'Usuários' },
  { chave: 'users:update', nome: 'Editar usuários', grupo: 'Usuários' },
  { chave: 'users:delete', nome: 'Excluir usuários', grupo: 'Usuários' },
  
  // Clientes
  { chave: 'clients:read', nome: 'Visualizar clientes', grupo: 'Clientes' },
  { chave: 'clients:create', nome: 'Criar clientes', grupo: 'Clientes' },
  { chave: 'clients:update', nome: 'Editar clientes', grupo: 'Clientes' },
  { chave: 'clients:delete', nome: 'Excluir clientes', grupo: 'Clientes' },
  
  // Processos
  { chave: 'processes:read', nome: 'Visualizar processos', grupo: 'Processos' },
  { chave: 'processes:create', nome: 'Criar processos', grupo: 'Processos' },
  { chave: 'processes:update', nome: 'Editar processos', grupo: 'Processos' },
  { chave: 'processes:delete', nome: 'Excluir processos', grupo: 'Processos' },
  
  // Prazos
  { chave: 'deadlines:read', nome: 'Visualizar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:create', nome: 'Criar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:update', nome: 'Editar prazos', grupo: 'Prazos' },
  { chave: 'deadlines:delete', nome: 'Excluir prazos', grupo: 'Prazos' },
  { chave: 'deadlines:complete', nome: 'Concluir prazos', grupo: 'Prazos' },
  
  // Financeiro
  { chave: 'financial:read', nome: 'Visualizar financeiro', grupo: 'Financeiro' },
  { chave: 'financial:create', nome: 'Criar transações', grupo: 'Financeiro' },
  { chave: 'financial:update', nome: 'Editar transações', grupo: 'Financeiro' },
  { chave: 'financial:delete', nome: 'Excluir transações', grupo: 'Financeiro' },
  
  // Diário de Processos
  { chave: 'movements:read', nome: 'Visualizar diário', grupo: 'Diário de Processos' },
  { chave: 'movements:create', nome: 'Criar movimentações', grupo: 'Diário de Processos' },
  { chave: 'movements:update', nome: 'Editar movimentações', grupo: 'Diário de Processos' },
  { chave: 'movements:delete', nome: 'Excluir movimentações', grupo: 'Diário de Processos' },

  // Configurações e Notificações (existentes no sistema)
  { chave: 'settings:read', nome: 'Visualizar configurações', grupo: 'Configurações' },
  { chave: 'settings:update', nome: 'Editar configurações', grupo: 'Configurações' },
  { chave: 'notifications:read', nome: 'Ler notificações', grupo: 'Notificações' },
  { chave: 'notifications:update', nome: 'Atualizar notificações', grupo: 'Notificações' },
];

const INITIAL_ROLES = {
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
    'processes:read',
    'deadlines:read',
    'notifications:read', 'notifications:update',
  ]
};

async function migrate() {
  const client = await pool.connect();
  console.log('Iniciando migração de cargos e permissões...');

  try {
    await client.query('BEGIN');

    console.log('Criando tabelas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        chave VARCHAR(255) NOT NULL UNIQUE,
        grupo VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );
    `);

    console.log('Semeando permissões...');
    for (const p of permissions) {
      await client.query(
        `INSERT INTO permissions (nome, chave, grupo) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (chave) DO NOTHING`,
        [p.nome, p.chave, p.grupo]
      );
    }

    console.log('Criando roles iniciais e vinculando permissões...');
    for (const [roleName, rolePerms] of Object.entries(INITIAL_ROLES)) {
      // Cria a role se não existir
      let roleResult = await client.query('SELECT id FROM roles WHERE nome = $1', [roleName]);
      if (roleResult.rows.length === 0) {
        roleResult = await client.query(
          'INSERT INTO roles (nome, descricao) VALUES ($1, $2) RETURNING id',
          [roleName, `Cargo padrão do sistema: ${roleName}`]
        );
      }
      const roleId = roleResult.rows[0].id;

      // Vincula as permissões
      for (const permKey of rolePerms) {
        const permResult = await client.query('SELECT id FROM permissions WHERE chave = $1', [permKey]);
        if (permResult.rows.length > 0) {
          const permId = permResult.rows[0].id;
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) 
             VALUES ($1, $2) 
             ON CONFLICT (role_id, permission_id) DO NOTHING`,
            [roleId, permId]
          );
        }
      }
    }

    console.log('Migrando usuários existentes para user_roles...');
    // Pega todos os usuários que têm uma role definida na coluna 'role' da tabela 'users'
    const usersResult = await client.query('SELECT id, role FROM users WHERE role IS NOT NULL');
    
    for (const user of usersResult.rows) {
      // Tenta achar a role correspondente (assumindo que a coluna role contém 'admin_global', 'funcionario' ou 'cliente')
      const roleResult = await client.query('SELECT id FROM roles WHERE nome = $1', [user.role]);
      
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) 
           VALUES ($1, $2) 
           ON CONFLICT (user_id, role_id) DO NOTHING`,
          [user.id, roleId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na migração:', error);
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
