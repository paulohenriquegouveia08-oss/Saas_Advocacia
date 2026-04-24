-- ============================================
-- RPC: Criar Usuário Cliente
-- Executar no Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_create_client_user(
  p_email text,
  p_name text,
  p_org_id uuid,
  p_client_id uuid
)
RETURNS json AS $$
DECLARE
  v_is_user_admin boolean;
  v_new_user_id uuid;
  v_temp_password text;
BEGIN
  -- Validar se quem chama é admin (opcional)
  SELECT COALESCE(
    (SELECT r."isAdmin" FROM public."User" u
     JOIN public."Role" r ON r."id" = u."roleId"
     WHERE u."id" = auth.uid()),
    false
  ) INTO v_is_user_admin;

  -- Para segurança simples, validamos se o usuário logado pertence à organização
  IF NOT EXISTS (SELECT 1 FROM public."User" WHERE id = auth.uid() AND "organizationId" = p_org_id) THEN
    RAISE EXCEPTION 'Acesso negado: organização inválida.';
  END IF;

  -- A senha temporária será a padrão 123456 como no front, mas segura via trigger ou update
  v_temp_password := '123456';
  
  -- Verificar se já existe um usuário com esse e-mail no auth.users
  SELECT id INTO v_new_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_new_user_id IS NULL THEN
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
  END IF;

  -- Atualizar ou inserir na tabela User com firstAccess = true e clientId preenchido
  INSERT INTO public."User" (id, email, name, "roleId", "organizationId", "clientId", "firstAccess")
  VALUES (v_new_user_id, p_email, p_name, NULL, p_org_id, p_client_id, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "clientId" = EXCLUDED."clientId",
    "organizationId" = EXCLUDED."organizationId",
    "firstAccess" = true;

  RETURN json_build_object('success', true, 'userId', v_new_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_client_user TO authenticated;
