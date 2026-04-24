// ============================================
// Juris Gestão — Forgot Password Page
// ============================================

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/shared/services/auth.service';
import { Scale, Mail, ArrowLeft, Send } from 'lucide-react';
import './auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.resetPassword(email);
    if (result.error) {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
      </div>

      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <Scale size={32} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Recuperar Senha</h1>
          <p className="auth-subtitle">
            {sent
              ? 'Verifique sua caixa de entrada'
              : 'Informe seu e-mail para receber o link de redefinição'}
          </p>
        </div>

        {sent ? (
          <div className="auth-success-msg animate-fade-in">
            <Send size={40} className="auth-success-icon" />
            <p>
              Enviamos um link de recuperação para <strong>{email}</strong>.
              Verifique também a pasta de spam.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg auth-submit" id="back-to-login-link">
              <ArrowLeft size={18} />
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} id="forgot-password-form">
            {error && (
              <div className="auth-error animate-fade-in">{error}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">E-mail cadastrado</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="reset-email"
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

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
              id="reset-submit-btn"
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>
                  Enviar Link
                  <Send size={18} />
                </>
              )}
            </button>

            <Link to="/login" className="auth-back-link" id="forgot-back-to-login">
              <ArrowLeft size={16} />
              Voltar ao Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
