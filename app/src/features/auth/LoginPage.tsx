// ============================================
// Juris Gestão — Login Page
// ============================================

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import './auth.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Perfil já carregado dentro do signIn — navegar
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative Background */}
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-circle auth-bg-circle-3" />
      </div>

      <div className="auth-container animate-fade-in">
        {/* Logo & Branding */}
        <div className="auth-header">
          <div className="auth-logo">
            <Scale size={32} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Juris Gestão</h1>
          <p className="auth-subtitle">Sistema de Gestão para Advocacia</p>
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          {error && (
            <div className="auth-error animate-fade-in" id="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail</label>
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

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
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
                aria-label="Alternar visibilidade da senha"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-actions-row">
            <Link to="/forgot-password" className="auth-link" id="forgot-password-link">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                Entrar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Acesso restrito a usuários autorizados.
        </p>
      </div>
    </div>
  );
}
