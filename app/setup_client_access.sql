-- ============================================
-- FEATURE: Acesso do Cliente
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar campo clientId na tabela User
ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS "clientId" UUID REFERENCES public."Client"("id") ON DELETE SET NULL;

-- 2. RPC para registrar o acesso do cliente
-- Esta RPC recebe o ID de autenticação (criado pela API do Supabase no front),
-- o email, o nome, o ID da organização e o ID do cliente recém criado.
CREATE OR REPLACE FUNCTION public.admin_register_client_access(
  p_auth_user_id uuid,
  p_email text,
  p_name text,
  p_org_id uuid,
  p_client_id uuid
)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
BEGIN
  -- Validar se quem chama é admin da organização (opcional, ou se é apenas autenticado da org)
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  -- Aqui podemos permitir que qualquer usuário autenticado que pode criar clientes crie acesso.
  -- Para segurança simples, validamos se o usuário logado pertence à organização.
  IF NOT EXISTS (SELECT 1 FROM public."User" WHERE id = auth.uid() AND "organizationId" = p_org_id) THEN
    RAISE EXCEPTION 'Acesso negado: organização inválida.';
  END IF;

  -- Insere o usuário com roleId = NULL e clientId preenchido, marcando como firstAccess
  INSERT INTO public."User" (id, email, name, "roleId", "organizationId", "clientId", "firstAccess")
  VALUES (p_auth_user_id, p_email, p_name, NULL, p_org_id, p_client_id, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "clientId" = EXCLUDED."clientId",
    "organizationId" = EXCLUDED."organizationId",
    "firstAccess" = true;

  RETURN json_build_object('success', true, 'userId', p_auth_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_register_client_access TO authenticated;
