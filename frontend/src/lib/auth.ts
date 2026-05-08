import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    _supabase = createClient(url, key)
  }
  return _supabase
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)

  // Save token in cookie
  if (data.session) {
    document.cookie = `access_token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  }

  return data
}

export async function signOut() {
  try {
    const supabase = getSupabase()
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Erro ao sair:', err)
  } finally {
    document.cookie = 'access_token=; path=/; max-age=0'
  }
}

export function getSession() {
  const supabase = getSupabase()
  return supabase.auth.getSession()
}
