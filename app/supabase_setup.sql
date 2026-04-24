-- ============================================
-- JURIS GESTÃO — SETUP COMPLETO DO BANCO
-- Inclui: Tabelas + RLS (Row Level Security)
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. Apagar tudo para recomeçar limpo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public."ActivityLog" CASCADE;
DROP TABLE IF EXISTS public."File" CASCADE;
DROP TABLE IF EXISTS public."Deadline" CASCADE;
DROP TABLE IF EXISTS public."FinancialTransaction" CASCADE;
DROP TABLE IF EXISTS public."Client" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Role" CASCADE;
DROP TABLE IF EXISTS public."Organization" CASCADE;

DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "TransactionStatus" CASCADE;
DROP TYPE IF EXISTS "DeadlinePriority" CASCADE;
DROP TYPE IF EXISTS "DeadlineStatus" CASCADE;

-- 2. Criação dos ENUMs
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "DeadlinePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- 3. Tabela de Organizações (Escritórios)
CREATE TABLE public."Organization" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cnpj" TEXT UNIQUE,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Tabela de Cargos e Permissões Dinâmicas (RBAC)
CREATE TABLE public."Role" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "isAdmin" BOOLEAN DEFAULT false NOT NULL,
  "permissions" JSONB DEFAULT '{}'::jsonb NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE,
  UNIQUE("name", "organizationId")
);

-- 5. Tabela "User" (Extensão do auth.users do Supabase)
CREATE TABLE public."User" (
  "id" UUID PRIMARY KEY REFERENCES auth.users("id") ON DELETE CASCADE,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "roleId" UUID REFERENCES public."Role"("id"),
  "organizationId" UUID REFERENCES public."Organization"("id") ON DELETE CASCADE
);

-- 6. Tabelas de Domínio do SaaS
CREATE TABLE public."Client" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "cpf" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "birthDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE,
  UNIQUE("cpf", "organizationId")
);

CREATE TABLE public."FinancialTransaction" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "type" "TransactionType" NOT NULL,
  "status" "TransactionStatus" DEFAULT 'PENDING' NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "clientId" UUID REFERENCES public."Client"("id") ON DELETE SET NULL,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE,
  "createdById" UUID NOT NULL REFERENCES public."User"("id")
);

CREATE TABLE public."Deadline" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "title" TEXT NOT NULL,
  "processNumber" TEXT,
  "description" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "priority" "DeadlinePriority" DEFAULT 'MEDIUM' NOT NULL,
  "status" "DeadlineStatus" DEFAULT 'PENDING' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "clientId" UUID REFERENCES public."Client"("id") ON DELETE SET NULL,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE,
  "createdById" UUID NOT NULL REFERENCES public."User"("id")
);

CREATE TABLE public."File" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "originalName" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "clientId" UUID REFERENCES public."Client"("id") ON DELETE SET NULL,
  "deadlineId" UUID REFERENCES public."Deadline"("id") ON DELETE SET NULL,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE,
  "uploadedById" UUID NOT NULL REFERENCES public."User"("id")
);

CREATE TABLE public."ActivityLog" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" UUID,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "userId" UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES public."Organization"("id") ON DELETE CASCADE
);

-- 7. Trigger para Auto-sincronizar novos auth.users → tabela User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('saas_files', 'saas_files', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- Defesa Inviolável: isolamento por organization_id
-- ============================================

-- Função auxiliar: retorna o organization_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT "organizationId" FROM public."User" WHERE "id" = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função auxiliar: verifica se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- Organization ----
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
  ON public."Organization" FOR SELECT
  USING ("id" = public.get_user_org_id());

-- ---- Role ----
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles of their org"
  ON public."Role" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Admins can manage roles"
  ON public."Role" FOR ALL
  USING ("organizationId" = public.get_user_org_id() AND public.is_user_admin())
  WITH CHECK ("organizationId" = public.get_user_org_id() AND public.is_user_admin());

-- ---- User ----
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view themselves"
  ON public."User" FOR SELECT
  USING ("id" = auth.uid());

CREATE POLICY "Users can view org members"
  ON public."User" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Admins can manage org users"
  ON public."User" FOR UPDATE
  USING ("organizationId" = public.get_user_org_id() AND public.is_user_admin())
  WITH CHECK ("organizationId" = public.get_user_org_id() AND public.is_user_admin());

-- Permitir insert via trigger (sem auth context)
CREATE POLICY "Allow trigger insert"
  ON public."User" FOR INSERT
  WITH CHECK (true);

-- ---- Client ----
ALTER TABLE public."Client" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view clients"
  ON public."Client" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can insert clients"
  ON public."Client" FOR INSERT
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can update clients"
  ON public."Client" FOR UPDATE
  USING ("organizationId" = public.get_user_org_id())
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can delete clients"
  ON public."Client" FOR DELETE
  USING ("organizationId" = public.get_user_org_id());

-- ---- FinancialTransaction ----
ALTER TABLE public."FinancialTransaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view transactions"
  ON public."FinancialTransaction" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can insert transactions"
  ON public."FinancialTransaction" FOR INSERT
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can update transactions"
  ON public."FinancialTransaction" FOR UPDATE
  USING ("organizationId" = public.get_user_org_id())
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can delete transactions"
  ON public."FinancialTransaction" FOR DELETE
  USING ("organizationId" = public.get_user_org_id());

-- ---- Deadline ----
ALTER TABLE public."Deadline" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view deadlines"
  ON public."Deadline" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can insert deadlines"
  ON public."Deadline" FOR INSERT
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can update deadlines"
  ON public."Deadline" FOR UPDATE
  USING ("organizationId" = public.get_user_org_id())
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can delete deadlines"
  ON public."Deadline" FOR DELETE
  USING ("organizationId" = public.get_user_org_id());

-- ---- File ----
ALTER TABLE public."File" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view files"
  ON public."File" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can insert files"
  ON public."File" FOR INSERT
  WITH CHECK ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can delete files"
  ON public."File" FOR DELETE
  USING ("organizationId" = public.get_user_org_id());

-- ---- ActivityLog ----
ALTER TABLE public."ActivityLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view logs"
  ON public."ActivityLog" FOR SELECT
  USING ("organizationId" = public.get_user_org_id());

CREATE POLICY "Org members can insert logs"
  ON public."ActivityLog" FOR INSERT
  WITH CHECK ("organizationId" = public.get_user_org_id());

-- ---- Storage Policies ----
CREATE POLICY "Org members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'saas_files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Org members can view their files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'saas_files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Org members can delete their files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'saas_files'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- 10. SEED INICIAL — Escritório + Cargos Padrão
-- ============================================

-- Criar escritório padrão
INSERT INTO public."Organization" ("id", "name", "cnpj", "email")
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Escritório Principal',
  NULL,
  NULL
) ON CONFLICT DO NOTHING;

-- Criar cargos padrão
INSERT INTO public."Role" ("name", "isAdmin", "permissions", "organizationId")
VALUES
  ('Admin Global', true, '{"canAccessFinanceiro": true, "canAccessClientes": true, "canAccessPrazos": true, "canEditDelete": true, "canManageUsers": true}'::jsonb, 'a0000000-0000-0000-0000-000000000001'),
  ('Advogado', false, '{"canAccessFinanceiro": true, "canAccessClientes": true, "canAccessPrazos": true, "canEditDelete": true, "canManageUsers": false}'::jsonb, 'a0000000-0000-0000-0000-000000000001'),
  ('Assistente', false, '{"canAccessFinanceiro": false, "canAccessClientes": true, "canAccessPrazos": true, "canEditDelete": false, "canManageUsers": false}'::jsonb, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================
-- FIM DO SETUP
-- Próximo passo: Criar o primeiro usuário admin
-- no painel Authentication do Supabase, e depois
-- atribuir a organizationId e roleId via SQL:
--
-- UPDATE public."User"
-- SET "organizationId" = 'a0000000-0000-0000-0000-000000000001',
--     "roleId" = (SELECT "id" FROM public."Role" WHERE "name" = 'Admin Global' AND "organizationId" = 'a0000000-0000-0000-0000-000000000001')
-- WHERE "email" = 'seu-email@exemplo.com';
-- ============================================
