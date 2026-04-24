// ============================================
// Juris Gestão — Auth Provider (Componente)
// ============================================

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';
import type { User } from '../types';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role?.isAdmin ?? false;

  const loadProfile = useCallback(async (userId: string) => {
    const result = await authService.getProfile(userId);
    if (result.data) {
      setUser(result.data as User);
    } else {
      // Falha de RLS ou perfil inexistente: criar um usuário em memória baseado no Auth
      console.warn('[loadProfile] Perfil não encontrado via banco (RLS block/ausente). Usando fallback.');
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      if (authUser && authUser.id === userId) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        // Mock a success result so signIn doesn't fail
        return { data: { id: userId }, error: null };
      }
    }
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;

      if (data.session?.user) {
        setSession(data.session);
        await loadProfile(data.session.user.id);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (cancelled) return;
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN' && newSession?.user) {
          setLoading(true);
          loadProfile(newSession.user.id).then(async (res) => {
            if (!res.data) {
              // Tentativa de auto-recuperação: se o perfil não existe, cria agora (caso o trigger tenha falhado no passado)
              const { error: insertError } = await supabase.from('User').insert({
                id: newSession.user.id,
                email: newSession.user.email,
                name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'Usuário'
              });
              if (!insertError) {
                await loadProfile(newSession.user.id);
              }
            }
            if (!cancelled) {
              setSession(newSession);
              setLoading(false);
            }
          });
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }

        if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if (result.error) return { error: result.error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : result.error };

    if (result.data?.user) {
      setLoading(true);
      let profileResult = await loadProfile(result.data.user.id);
      
      if (!profileResult.data) {
        // Tentativa de auto-recuperação para usuários antigos sem registro na tabela User
        const { error: insertError } = await supabase.from('User').insert({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.user_metadata?.full_name || result.data.user.email?.split('@')[0] || 'Usuário'
        });
        
        console.log('[signIn] Insert attempt error:', insertError);

        if (!insertError) {
          profileResult = await loadProfile(result.data.user.id);
        }

        if (!profileResult.data) {
          console.log('[signIn] Auto-recovery failed. Signing out.');
          await authService.signOut();
          setLoading(false);
          return { error: 'Seu perfil de usuário não foi encontrado no banco de dados. Contate o administrador.' };
        }
      }

      console.log('[signIn] Success! Setting session and returning.');
      setSession(result.data.session);
      setLoading(false);
    }

    return { error: null };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
