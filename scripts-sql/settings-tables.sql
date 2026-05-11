-- Tabela de configurações do escritório (apenas 1 registro)
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

-- Inserir registro padrão se não existir
INSERT INTO settings (id, escritorio_nome, escritorio_cnpj, escritorio_telefone, escritorio_email, escritorio_endereco)
SELECT uuid_generate_v4(), 'Meu Escritório', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    notificacoes_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscar preferências por usuário
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para settings
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para user_preferences
DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();