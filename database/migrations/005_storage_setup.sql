-- Criar bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client_documents', 'client_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Ativar RLS no storage.objects (se já não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Todos podem ler objetos do bucket "client_documents"
-- (Pois o bucket é público, mas se não fosse, seria restrito)
-- Como o bucket é "public = true", o acesso de leitura é aberto por padrão pelo Supabase API,
-- mas podemos adicionar a política por garantia:
CREATE POLICY "Admins e Funcionários podem ler documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'client_documents');

-- Política de INSERT: Apenas admins e funcionários
CREATE POLICY "Admins e Funcionários podem inserir documentos no storage" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client_documents'
    AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin_global', 'funcionario')
    )
  );

-- Política de DELETE: Apenas admins e funcionários
CREATE POLICY "Admins e Funcionários podem deletar documentos do storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client_documents'
    AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin_global', 'funcionario')
    )
  );
