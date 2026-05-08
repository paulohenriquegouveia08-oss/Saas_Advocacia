-- =============================================
-- SaaS Jurídico — Schema Inicial
-- =============================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin_global', 'funcionario', 'cliente');
CREATE TYPE process_status AS ENUM ('ativo', 'suspenso', 'encerrado');
CREATE TYPE deadline_status AS ENUM ('pendente', 'atrasado', 'concluido');
CREATE TYPE financial_type AS ENUM ('entrada', 'saida');
CREATE TYPE notification_type AS ENUM ('prazo_proximo', 'prazo_vencido', 'geral');

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROCESSES
CREATE TABLE processes (
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
CREATE TABLE process_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  tipo TEXT,
  descricao TEXT,
  data TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DEADLINES
CREATE TABLE deadlines (
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
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID REFERENCES deadlines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo notification_type NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FINANCIAL
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo financial_type,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  categoria TEXT,
  status TEXT,
  data DATE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

-- ÍNDICES
CREATE INDEX idx_deadlines_vencimento ON deadlines (data_vencimento ASC);
CREATE INDEX idx_deadlines_status ON deadlines (status);
CREATE INDEX idx_notifications_user ON notifications (user_id, lida);
CREATE INDEX idx_processes_client ON processes (client_id);
CREATE INDEX idx_processes_status ON processes (status);
CREATE INDEX idx_financial_client ON financial_transactions (client_id);
CREATE INDEX idx_financial_tipo ON financial_transactions (tipo);
