-- Adicionar coluna telefone na tabela users (se não existir)
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Criar índice para buscas por telefone (opcional)
CREATE INDEX IF NOT EXISTS idx_users_telefone ON users(telefone) WHERE telefone IS NOT NULL;