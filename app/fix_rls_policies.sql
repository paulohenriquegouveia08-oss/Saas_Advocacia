-- ============================================
-- FIX: Funções auxiliares de RLS + Recriar políticas da tabela Client
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que a função get_user_org_id exista
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT "organizationId" FROM public."User" WHERE "id" = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Garantir que a função is_user_admin exista
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Recriar as políticas da tabela Client (dropar as existentes primeiro para evitar conflitos)
DROP POLICY IF EXISTS "Org members can view clients" ON public."Client";
DROP POLICY IF EXISTS "Org members can insert clients" ON public."Client";
DROP POLICY IF EXISTS "Org members can update clients" ON public."Client";
DROP POLICY IF EXISTS "Org members can delete clients" ON public."Client";

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

-- 4. Recriar as políticas do FinancialTransaction e Deadline também (mesma causa)
DROP POLICY IF EXISTS "Org members can view transactions" ON public."FinancialTransaction";
DROP POLICY IF EXISTS "Org members can insert transactions" ON public."FinancialTransaction";
DROP POLICY IF EXISTS "Org members can update transactions" ON public."FinancialTransaction";
DROP POLICY IF EXISTS "Org members can delete transactions" ON public."FinancialTransaction";

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

-- Deadline
DROP POLICY IF EXISTS "Org members can view deadlines" ON public."Deadline";
DROP POLICY IF EXISTS "Org members can insert deadlines" ON public."Deadline";
DROP POLICY IF EXISTS "Org members can update deadlines" ON public."Deadline";
DROP POLICY IF EXISTS "Org members can delete deadlines" ON public."Deadline";

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
