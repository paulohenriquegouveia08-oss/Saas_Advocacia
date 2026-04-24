// ============================================
// Juris Gestão — Auth Context (tipos e contexto)
// ============================================

import { createContext } from 'react';
import type { AuthState } from '../types';

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
