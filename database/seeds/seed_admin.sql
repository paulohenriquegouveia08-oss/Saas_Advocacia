-- =============================================
-- Seed: Admin Global
-- Email: julianagouveiasantos26@gmail.com
-- =============================================
-- NOTA: O id deve ser o mesmo UUID gerado pelo Supabase Auth
-- ao criar o usuário. Execute primeiro a criação no Supabase Auth
-- e use o id retornado aqui.

-- Placeholder: substitua 'SUPABASE_AUTH_USER_ID' pelo UUID real
INSERT INTO users (id, nome, email, role, ativo)
VALUES (
  'SUPABASE_AUTH_USER_ID',
  'Juliana Gouveia Santos',
  'julianagouveiasantos26@gmail.com',
  'admin_global',
  true
)
ON CONFLICT (email) DO NOTHING;
