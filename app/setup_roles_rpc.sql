-- ============================================
-- MIGRATION: RPC para Gestão de Cargos
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- RPC: admin_save_role (Permite que o admin crie/edite cargos sem bloqueio de RLS)
CREATE OR REPLACE FUNCTION public.admin_save_role(
  p_role_id uuid,
  p_name text,
  p_is_admin boolean,
  p_permissions jsonb,
  p_org_id uuid
)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
  v_new_role_id uuid;
BEGIN
  -- Validar se quem chama é admin (LOGICA INLINE PARA EVITAR ERROS DE FUNÇÃO INEXISTENTE)
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem gerenciar cargos.';
  END IF;

  IF p_role_id IS NULL THEN
    -- Inserir novo cargo
    INSERT INTO public."Role" ("name", "isAdmin", "permissions", "organizationId")
    VALUES (p_name, p_is_admin, p_permissions, p_org_id)
    RETURNING id INTO v_new_role_id;
    
    RETURN json_build_object('success', true, 'roleId', v_new_role_id);
  ELSE
    -- Atualizar cargo existente
    UPDATE public."Role"
    SET "name" = p_name,
        "isAdmin" = p_is_admin,
        "permissions" = p_permissions,
        "updatedAt" = now()
    WHERE id = p_role_id AND "organizationId" = p_org_id;

    RETURN json_build_object('success', true, 'roleId', p_role_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_save_role TO authenticated;

-- RPC: admin_delete_role
CREATE OR REPLACE FUNCTION public.admin_delete_role(p_role_id uuid, p_org_id uuid)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
BEGIN
  -- Validar se quem chama é admin
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem excluir cargos.';
  END IF;

  DELETE FROM public."Role"
  WHERE id = p_role_id AND "organizationId" = p_org_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_role TO authenticated;
