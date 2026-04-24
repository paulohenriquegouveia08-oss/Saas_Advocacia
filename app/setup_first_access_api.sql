-- ============================================
-- MIGRATION: Primeiro Acesso Simplificado (Via API)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Nova função para Criar Usuário (com senha determinística segura para o primeiro acesso)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_name text,
  p_role_id uuid,
  p_org_id uuid
)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
  v_new_user_id uuid;
  v_temp_password text;
BEGIN
  -- Validar se quem chama é admin
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  IF NOT v_is_user_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários.';
  END IF;

  -- A senha temporária será o email + uma chave fixa, o frontend fará o login silencioso
  v_temp_password := p_email || '-JurisFirstAccess2026!';
  v_new_user_id := gen_random_uuid();

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

  -- Atualizar ou inserir na tabela User com firstAccess = true
  INSERT INTO public."User" (id, email, name, "roleId", "organizationId", "firstAccess")
  VALUES (v_new_user_id, p_email, p_name, p_role_id, p_org_id, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "roleId" = EXCLUDED."roleId",
    "organizationId" = EXCLUDED."organizationId",
    "firstAccess" = true;

  RETURN json_build_object('success', true, 'userId', v_new_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;

-- 2. Função para concluir o primeiro acesso
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
