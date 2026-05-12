-- =============================================
-- SaaS Jurídico — Schema Inicial
-- =============================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin_global', 'funcionario', 'cliente');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE process_status AS ENUM ('ativo', 'suspenso', 'encerrado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deadline_status AS ENUM ('pendente', 'atrasado', 'concluido');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_type AS ENUM ('entrada', 'saida');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('prazo_proximo', 'prazo_vencido', 'geral');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROCESSES
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  numero TEXT UNIQUE NOT NULL,
  tribunal TEXT,
  tipo_acao TEXT,
  parte_contraria TEXT,
  status process_status DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW()
);

-- MOVEMENTS
CREATE TABLE IF NOT EXISTS process_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  tipo TEXT,
  descricao TEXT,
  data TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DEADLINES
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  descricao TEXT,
  data_inicio DATE,
  data_vencimento DATE NOT NULL,
  status deadline_status DEFAULT 'pendente',
  responsavel_id UUID REFERENCES users(id),
  dias_restantes INT GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (data_vencimento - CURRENT_DATE))::INT
  ) STORED
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID REFERENCES deadlines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo notification_type NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FINANCIAL
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo financial_type,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  categoria TEXT,
  status TEXT,
  data DATE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

-- ROLES (Cargos)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  chave TEXT NOT NULL,
  grupo TEXT NOT NULL
);

-- USER_ROLES (Vínculo usuário - cargo)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ROLE_PERMISSIONS (Vínculo cargo - permissão)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Insert default permissions (apenas se a tabela estiver vazia)
INSERT INTO permissions (nome, chave, grupo) 
SELECT * FROM (VALUES
  ('Criar usuários', 'users:create', 'Usuários'),
  ('Listar usuários', 'users:read', 'Usuários'),
  ('Editar usuários', 'users:update', 'Usuários'),
  ('Excluir usuários', 'users:delete', 'Usuários'),
  ('Criar clientes', 'clients:create', 'Clientes'),
  ('Listar clientes', 'clients:read', 'Clientes'),
  ('Editar clientes', 'clients:update', 'Clientes'),
  ('Excluir clientes', 'clients:delete', 'Clientes'),
  ('Criar processos', 'processes:create', 'Processos'),
  ('Listar processos', 'processes:read', 'Processos'),
  ('Editar processos', 'processes:update', 'Processos'),
  ('Excluir processos', 'processes:delete', 'Processos'),
  ('Criar movimentos', 'movements:create', 'Movimentos'),
  ('Listar movimentos', 'movements:read', 'Movimentos'),
  ('Criar prazos', 'deadlines:create', 'Prazos'),
  ('Listar prazos', 'deadlines:read', 'Prazos'),
  ('Editar prazos', 'deadlines:update', 'Prazos'),
  ('Excluir prazos', 'deadlines:delete', 'Prazos'),
  ('Concluir prazos', 'deadlines:complete', 'Prazos'),
  ('Listar notificações', 'notifications:read', 'Notificações'),
  ('Atualizar notificações', 'notifications:update', 'Notificações'),
  ('Criar transação', 'financial:create', 'Financeiro'),
  ('Listar transações', 'financial:read', 'Financeiro'),
  ('Editar transação', 'financial:update', 'Financeiro'),
  ('Excluir transação', 'financial:delete', 'Financeiro'),
  ('Ver configurações', 'settings:read', 'Configurações'),
  ('Editar configurações', 'settings:update', 'Configurações')
) AS data(nome, chave, grupo)
WHERE NOT EXISTS (SELECT 1 FROM permissions LIMIT 1);

-- Insert default roles (apenas se a tabela estiver vazia)
INSERT INTO roles (nome, descricao) 
SELECT * FROM (VALUES
  ('admin_global', 'Acesso total ao sistema'),
  ('funcionario', 'Acesso limitado sem gerenciamento de usuários'),
  ('cliente', 'Acesso apenas para visualizar seus processos e prazos')
) AS data(nome, descricao)
WHERE NOT EXISTS (SELECT 1 FROM roles LIMIT 1);

-- Vincular todas permissões ao admin_global (apenas se não houver vínculo)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'admin_global'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Vincular permissões de funcionário
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'funcionario' 
AND p.chave IN (
  'clients:create', 'clients:read', 'clients:update',
  'processes:create', 'processes:read', 'processes:update',
  'movements:create', 'movements:read',
  'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:complete',
  'notifications:read', 'notifications:update',
  'financial:create', 'financial:read', 'financial:update'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Vincular permissões de cliente
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'cliente' 
AND p.chave IN (
  'processes:read', 'deadlines:read', 'notifications:read'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_deadlines_vencimento ON deadlines (data_vencimento ASC);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON deadlines (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, lida);
CREATE INDEX IF NOT EXISTS idx_processes_client ON processes (client_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes (status);
CREATE INDEX IF NOT EXISTS idx_financial_client ON financial_transactions (client_id);
CREATE INDEX IF NOT EXISTS idx_financial_tipo ON financial_transactions (tipo);
