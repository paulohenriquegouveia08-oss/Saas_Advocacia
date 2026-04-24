-- ============================================
-- MIGRATION: RPC para Listar Cargos
-- Execute este script no SQL Editor do Supabase
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_list_roles(p_org_id uuid)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
  v_roles json;
BEGIN
  -- Validar se quem chama é admin
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar os cargos.';
  END IF;

  -- Buscar os cargos ignorando o RLS problemático do frontend
  SELECT json_agg(row_to_json(r) ORDER BY r.name ASC) INTO v_roles
  FROM public."Role" r
  WHERE r."organizationId" = p_org_id;

  RETURN COALESCE(v_roles, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_list_roles TO authenticated;
