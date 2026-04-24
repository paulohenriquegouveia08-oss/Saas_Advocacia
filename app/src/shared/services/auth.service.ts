// ============================================
// Juris Gestão — Auth Service
// Comunicação direta com Supabase Auth
// ============================================

import { supabase } from './supabase';

export const authService = {
  /** Login com email e senha */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /** Logout */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  },

  /** Recuperação de senha */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  /** Atualizar senha (após redirecionamento do link de reset) */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  /** Sessão atual */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error: error.message };
    return { data: data.session, error: null };
  },

  /** Buscar perfil do usuário na tabela pública */
  async getProfile(userId: string) {
    // Tenta primeiro usar a nova RPC que contorna problemas de RLS no frontend
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile');
    
    if (rpcData && !rpcError) {
      return { data: rpcData, error: null };
    }

    // Fallback original
    const { data, error } = await supabase
      .from('User')
      .select('*, role:Role(*), organization:Organization(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('getProfile ERROR:', JSON.stringify(error));
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  },
};
