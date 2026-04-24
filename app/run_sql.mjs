import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzdiajzkshoxygtcueoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGlhanprc2hveHlndGN1ZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxOTAwMSwiZXhwIjoyMDkyMzk1MDAxfQ.adZi2lbg6UCSgoNj4cC6HJGxlSJ5aA1ISEJZ3WzeZNI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Running setup...');

  const sql = `
    -- Adicionar flag de primeiro acesso
    ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "firstAccess" BOOLEAN DEFAULT false;

    -- RPC para buscar perfil de forma garantida
    CREATE OR REPLACE FUNCTION public.get_my_profile()
    RETURNS json AS $$
    DECLARE
      v_user json;
      v_role json;
      v_org json;
      v_uid uuid := auth.uid();
    BEGIN
      SELECT row_to_json(u) INTO v_user
      FROM public."User" u WHERE u.id = v_uid;

      IF v_user IS NOT NULL THEN
        -- Get role if exists
        SELECT row_to_json(r) INTO v_role
        FROM public."Role" r WHERE r.id = (v_user->>'roleId')::uuid;
        
        -- Get org if exists
        SELECT row_to_json(o) INTO v_org
        FROM public."Organization" o WHERE o.id = (v_user->>'organizationId')::uuid;

        -- Merge everything
        v_user := v_user::jsonb || 
                  jsonb_build_object('role', v_role) || 
                  jsonb_build_object('organization', v_org);
      END IF;

      RETURN v_user;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- RPC para checar status do email no primeiro acesso
    CREATE OR REPLACE FUNCTION public.check_user_status(p_email text)
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
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('Failed to run via RPC. We will use Edge Functions for this logic or REST.');
    console.error(error);
  } else {
    console.log('Success!');
  }
}

run();
