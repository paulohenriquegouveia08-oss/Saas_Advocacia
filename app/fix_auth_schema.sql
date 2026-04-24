-- ============================================
-- CORREÇÃO DO AUTH: Limpar entradas corrompidas
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Remover identities órfãs que podem causar "Database error querying schema"
DELETE FROM auth.identities
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'julianagouveiasantos26@gmail.com'
)
AND user_id IN (
  SELECT id FROM auth.users
);

-- Remover TODOS os auth.users que NÃO são a Juliana (limpeza de zumbis criados via SQL)
DELETE FROM auth.users
WHERE email != 'julianagouveiasantos26@gmail.com';

-- Remover TODOS os public.User que NÃO são a Juliana (limpeza de zumbis)
DELETE FROM public."User"
WHERE email != 'julianagouveiasantos26@gmail.com';

-- Garantir que a Juliana tenha uma identidade válida (caso esteja faltando)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'julianagouveiasantos26@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);
