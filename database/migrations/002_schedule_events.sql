-- Migration: 002_schedule_events
-- Adiciona tabela de eventos de agenda e permissões correspondentes

CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'media',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrar as permissões na tabela permissions
INSERT INTO permissions (nome, chave, grupo) VALUES
('Criar evento', 'schedule:create', 'Agenda'),
('Listar eventos', 'schedule:read', 'Agenda'),
('Editar evento', 'schedule:update', 'Agenda'),
('Excluir evento', 'schedule:delete', 'Agenda')
ON CONFLICT (chave) DO NOTHING;

-- Atribuir permissões ao admin_global
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'admin_global' AND p.chave LIKE 'schedule:%'
ON CONFLICT DO NOTHING;

-- Atribuir permissões ao funcionario
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'funcionario' AND p.chave IN ('schedule:create', 'schedule:read', 'schedule:update')
ON CONFLICT DO NOTHING;
