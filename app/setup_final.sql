-- ============================================
-- MIGRATION FINAL v2: RPCs corrigidas (SEM inserir em auth.users)
-- Execute este script no SQL Editor do Supabase
-- APÓS rodar o fix_auth_schema.sql
-- ============================================

-- 1. RPC para listar usuários (ignora RLS)
CREATE OR REPLACE FUNCTION public.admin_list_users(p_org_id uuid)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
  v_users json;
BEGIN
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.name,
      'active', u.active,
      'firstAccess', u."firstAccess",
      'roleId', u."roleId",
      'organizationId', u."organizationId",
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt",
      'role', CASE WHEN r.id IS NOT NULL THEN
        json_build_object('id', r.id, 'name', r.name, 'isAdmin', r."isAdmin", 'permissions', r.permissions)
      ELSE NULL END
    ) ORDER BY u."createdAt" DESC
  ) INTO v_users
  FROM public."User" u
  LEFT JOIN public."Role" r ON r.id = u."roleId"
  WHERE u."organizationId" = p_org_id;

  RETURN COALESCE(v_users, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_list_users TO authenticated;


-- 2. RPC: Registrar usuário no public.User (SOMENTE tabela pública, sem tocar no auth)
-- O auth.users será criado via API Admin do Supabase (frontend com service_role)
CREATE OR REPLACE FUNCTION public.admin_register_user(
  p_auth_user_id uuid,
  p_email text,
  p_name text,
  p_role_id uuid,
  p_org_id uuid
)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
BEGIN
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários.';
  END IF;

  INSERT INTO public."User" (id, email, name, "roleId", "organizationId", "firstAccess")
  VALUES (p_auth_user_id, p_email, p_name, p_role_id, p_org_id, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "roleId" = EXCLUDED."roleId",
    "organizationId" = EXCLUDED."organizationId",
    "firstAccess" = true;

  RETURN json_build_object('success', true, 'userId', p_auth_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_register_user TO authenticated;


-- 3. Marcar primeiro acesso como concluído
CREATE OR REPLACE FUNCTION public.complete_first_access()
RETURNS json AS $$
BEGIN
  UPDATE public."User"
  SET "firstAccess" = false
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_first_access TO authenticated;


-- 4. Verificar se é primeiro acesso (acessível sem login)
CREATE OR REPLACE FUNCTION public.check_first_access(p_email text)
RETURNS json AS $$
DECLARE
  v_user record;
BEGIN
  SELECT id, "firstAccess" INTO v_user FROM public."User" WHERE email = p_email LIMIT 1;
  IF FOUND THEN
    RETURN json_build_object('exists', true, 'firstAccess', v_user."firstAccess");
  ELSE
    RETURN json_build_object('exists', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_first_access TO anon, authenticated;
