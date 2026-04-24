// ============================================
// Juris Gestão — Login Page
// ============================================

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/shared/services/supabase';
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './auth.css';

type LoginStep = 'email' | 'password' | 'create-password';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc('check_first_access', { p_email: email });
    setLoading(false);

    if (rpcError) {
      setError('Erro ao verificar e-mail. Tente novamente.');
      return;
    }

    const result = data as { exists: boolean; firstAccess?: boolean };

    if (!result || !result.exists) {
      setError('E-mail não cadastrado no sistema.');
      return;
    }

    if (result.firstAccess) {
      setStep('create-password');
    } else {
      setStep('password');
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleCreatePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // 1. Faz o login silencioso usando a senha temporária padrão '123456'
      const tempPassword = '123456';
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });

      if (signInError) throw new Error('Não foi possível iniciar o cadastro da senha. O usuário pode já ter sido ativado ou excluído.');

      // 2. Atualiza a senha usando a API oficial do Supabase (ignora bloqueios de SQL)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw new Error('Erro ao salvar a nova senha no provedor: ' + updateError.message);

      // 3. Remove a flag de primeiro acesso
      await supabase.rpc('complete_first_access');

      // Tudo certo! Redireciona para o dashboard
      toast.success('Senha criada com sucesso! Bem-vindo!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao cadastrar senha.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-circle auth-bg-circle-3" />
      </div>

      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <Scale size={32} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Juris Gestão</h1>
          <p className="auth-subtitle">Sistema de Gestão para Advocacia</p>
        </div>

        {step === 'email' && (
          <form className="auth-form animate-fade-in" onSubmit={handleEmailSubmit}>
            {error && <div className="auth-error animate-fade-in">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Digite seu E-mail</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input auth-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner spinner-sm" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="auth-form animate-fade-in" onSubmit={handlePasswordSubmit}>
            <button type="button" className="btn-ghost auth-back-btn mb-4" onClick={() => { setStep('email'); setError(''); setPassword(''); }}>
              <ArrowLeft size={16} className="mr-2" />
              <span>Voltar</span>
            </button>
            <div className="auth-user-badge mb-4">
              <Mail size={14} className="mr-2" />
              <span>{email}</span>
            </div>
            {error && <div className="auth-error animate-fade-in">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Digite sua Senha</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner spinner-sm" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'create-password' && (
          <form className="auth-form animate-fade-in" onSubmit={handleCreatePasswordSubmit}>
            <button type="button" className="btn-ghost auth-back-btn mb-4" onClick={() => { setStep('email'); setError(''); setPassword(''); setConfirmPassword(''); }}>
              <ArrowLeft size={16} className="mr-2" />
              <span>Voltar</span>
            </button>
            <div className="auth-welcome-badge mb-4 bg-amber-50 text-amber-800 p-3 rounded border border-amber-200">
              <p className="text-sm font-semibold mb-1">Primeiro Acesso!</p>
              <p className="text-xs">Crie sua senha oficial para acessar o sistema.</p>
            </div>
            {error && <div className="auth-error animate-fade-in">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="create-password">Nova Senha</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirmar Senha</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner spinner-sm" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Criar Senha e Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Acesso restrito a usuários autorizados.
        </p>
      </div>
    </div>
  );
}
