-- ============================================
-- MIGRATION: Primeiro Acesso e Correção de RLS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar coluna firstAccess
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "firstAccess" BOOLEAN DEFAULT false;

-- 2. RPC: get_my_profile (Ignora RLS problemático para o próprio usuário)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json AS $$
DECLARE
  v_user json;
  v_role json;
  v_org json;
  v_uid uuid := auth.uid();
BEGIN
  -- Buscar usuário
  SELECT row_to_json(u) INTO v_user
  FROM public."User" u WHERE u.id = v_uid;

  IF v_user IS NOT NULL THEN
    -- Buscar Role (se houver)
    SELECT row_to_json(r) INTO v_role
    FROM public."Role" r WHERE r.id = (v_user->>'roleId')::uuid;
    
    -- Buscar Org (se houver)
    SELECT row_to_json(o) INTO v_org
    FROM public."Organization" o WHERE o.id = (v_user->>'organizationId')::uuid;

    -- Combinar os dados em um único JSON (simulando os joins)
    v_user := v_user::jsonb || 
              jsonb_build_object('role', v_role) || 
              jsonb_build_object('organization', v_org);
  END IF;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir acesso
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;


-- 3. RPC: admin_create_user (Permite o Admin criar um usuário no auth.users)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_name text,
  p_role_id uuid,
  p_org_id uuid
)
RETURNS json AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_new_user_id uuid := gen_random_uuid();
  v_temp_password text := '123456'; -- Senha temporária, será trocada no primeiro acesso
BEGIN
  -- Validar se quem chama é admin
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = v_admin_id),
    false
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários.';
  END IF;

  -- Inserir no auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(v_temp_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_name),
    now(),
    now()
  );

  -- NOTA: O trigger "handle_new_user" pode rodar e criar o public.User automaticamente.
  -- Precisamos atualizar a linha criada pelo trigger, ou inserir se o trigger falhar.
  
  -- Atualizar ou inserir na tabela User
  INSERT INTO public."User" (id, email, name, "roleId", "organizationId", "firstAccess")
  VALUES (v_new_user_id, p_email, p_name, p_role_id, p_org_id, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "roleId" = EXCLUDED."roleId",
    "organizationId" = EXCLUDED."organizationId",
    "firstAccess" = true;

  RETURN json_build_object('success', true, 'userId', v_new_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;


-- 4. RPC: check_first_access (Acessível sem login)
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


-- 5. RPC: setup_first_access (Acessível sem login, atualiza a senha de forma segura)
CREATE OR REPLACE FUNCTION public.setup_first_access(p_email text, p_new_password text)
RETURNS json AS $$
DECLARE
  v_user record;
BEGIN
  -- Validar se o usuário está em firstAccess
  SELECT id, "firstAccess" INTO v_user FROM public."User" WHERE email = p_email LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF NOT v_user."firstAccess" THEN
    RAISE EXCEPTION 'Usuário já realizou o primeiro acesso.';
  END IF;

  -- Atualizar senha no auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user.id;

  -- Remover flag de primeiro acesso
  UPDATE public."User"
  SET "firstAccess" = false
  WHERE id = v_user.id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.setup_first_access TO anon, authenticated;

