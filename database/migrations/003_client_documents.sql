CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS para client_documents (Opcional, mas recomendado se for ativar RLS)
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Por enquanto, admin e funcionários podem ver tudo
CREATE POLICY "Admins e Funcionários podem ver documentos" ON client_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_global', 'funcionario')
    )
  );

CREATE POLICY "Admins e Funcionários podem inserir documentos" ON client_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_global', 'funcionario')
    )
  );

CREATE POLICY "Admins e Funcionários podem excluir documentos" ON client_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_global', 'funcionario')
    )
  );
