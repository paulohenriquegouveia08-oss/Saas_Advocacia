-- =============================================
-- FIX: Migrações faltantes na VPS
-- =============================================

-- 1. Adicionar coluna telefone na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT;
CREATE INDEX IF NOT EXISTS idx_users_telefone ON users(telefone) WHERE telefone IS NOT NULL;

-- 2. Criar tabela settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_nome TEXT,
    escritorio_cnpj TEXT,
    escritorio_telefone TEXT,
    escritorio_email TEXT,
    escritorio_endereco TEXT,
    escritorio_logo TEXT,
    notificar_prazo_vencido BOOLEAN DEFAULT true,
    notificar_prazo_proximo BOOLEAN DEFAULT true,
    dias_antecedencia INTEGER DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro padrão
INSERT INTO settings (id, escritorio_nome, escritorio_cnpj, escritorio_telefone, escritorio_email, escritorio_endereco)
SELECT uuid_generate_v4(), 'Meu Escritório', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- 3. Criar tabela user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    notificacoes_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 4. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 5. Vincular admin existente ao role admin_global em user_roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.role = 'admin_global' AND r.nome = 'admin_global'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- 6. Corrigir nome do admin (estava com email no campo nome)
UPDATE users SET nome = 'Admin' WHERE email = 'admin@advocacia.com' AND nome = 'admin@advocacia.com';
