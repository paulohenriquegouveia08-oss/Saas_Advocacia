// Script para executar migrações faltantes via Supabase JS client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://137.131.233.254:8010',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzk4MDU3NzMsImV4cCI6MjA5NTE2NTc3M30.m-pf_0NRkzlJwjXZKRzlyyRZ_Jgqo3ujubhs8IA0ViI',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  console.log('=== Executando migrações faltantes na VPS ===\n')

  // 1. Adicionar coluna telefone (via SQL direto não é possível com JS client)
  // Vamos usar rpc para executar SQL raw
  
  // Primeiro, criar uma função SQL temporária para executar DDL
  const sqlStatements = [
    // Adicionar coluna telefone
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT`,
    
    // Criar tabela settings
    `CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      escritorio_nome TEXT,
      escritorio_cnpj TEXT,
      escritorio_telefone TEXT,
      escritorio_email TEXT,
      escritorio_endereco TEXT,
      escritorio_logo TEXT,
      notificar_prazo_vencido BOOLEAN DEFAULT true,
      notificar_prazo_proximo BOOLEAN DEFAULT true,
      dias_antecedencia INTEGER DEFAULT 7,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Criar tabela user_preferences
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT DEFAULT 'dark',
      notificacoes_email BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
  ]

  // Tentar via rpc execute_sql (pode não existir)
  for (const sql of sqlStatements) {
    console.log(`Executando: ${sql.substring(0, 60)}...`)
    const { error } = await supabase.rpc('execute_sql', { query: sql })
    if (error) {
      console.log(`  -> Erro (esperado se RPC não existe): ${error.message}`)
    } else {
      console.log(`  -> OK`)
    }
  }

  // 2. Inserir settings padrão via REST
  console.log('\n--- Inserindo settings padrão ---')
  const { data: existingSettings } = await supabase.from('settings').select('id').limit(1)
  if (!existingSettings || existingSettings.length === 0) {
    const { error } = await supabase.from('settings').insert({
      escritorio_nome: 'Meu Escritório',
      escritorio_cnpj: '',
      escritorio_telefone: '',
      escritorio_email: '',
      escritorio_endereco: '',
    })
    if (error) console.log(`  Erro: ${error.message}`)
    else console.log('  Settings padrão inserido!')
  } else {
    console.log('  Settings já existe')
  }

  // 3. Vincular admin ao role admin_global
  console.log('\n--- Vinculando admin ao role ---')
  const { data: users } = await supabase.from('users').select('id, role')
  const { data: roles } = await supabase.from('roles').select('id, nome')
  
  if (users && roles) {
    for (const user of users) {
      const role = roles.find(r => r.nome === user.role)
      if (role) {
        const { data: existing } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('role_id', role.id)
          .limit(1)
        
        if (!existing || existing.length === 0) {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role_id: role.id })
          if (error) console.log(`  Erro ao vincular ${user.id}: ${error.message}`)
          else console.log(`  Vinculado user ${user.id} ao role ${role.nome}`)
        } else {
          console.log(`  User ${user.id} já vinculado`)
        }
      }
    }
  }

  // 4. Corrigir nome do admin
  console.log('\n--- Corrigindo nome do admin ---')
  const { error: updateErr } = await supabase
    .from('users')
    .update({ nome: 'Admin' })
    .eq('email', 'admin@advocacia.com')
    .eq('nome', 'admin@advocacia.com')
  if (updateErr) console.log(`  Erro: ${updateErr.message}`)
  else console.log('  Nome do admin corrigido!')

  console.log('\n=== Migrações concluídas ===')
}

run().catch(console.error)
