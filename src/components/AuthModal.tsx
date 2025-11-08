import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface AuthModalProps {
  onAuthSuccess: () => void;
  onSkip?: () => void;
}

export function AuthModal({ onAuthSuccess, onSkip }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      onAuthSuccess();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setMessage('Conta criada! Verifique seu email para confirmar (ou faça login se já confirmou).');
        // Auto login if email confirmation is disabled
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = isMobile && window.innerHeight < window.innerWidth;

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    fontFamily: "'Pixelify Sans', monospace",
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: '4px solid #fff',
    padding: isMobile ? '24px' : '32px',
    minWidth: isMobile ? '300px' : '400px',
    maxWidth: '90%',
    boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
    color: '#fff',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '24px' : '32px',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center',
    textShadow: '2px 2px 0px #333',
    color: '#fff',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px' : '14px',
    marginBottom: '16px',
    backgroundColor: '#222',
    border: '3px solid #666',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '14px' : '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const inputFocusStyle: React.CSSProperties = {
    ...inputStyle,
    border: '3px solid #4ade80',
  };

  const buttonStyle = (hovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: isMobile ? '14px' : '16px',
    marginBottom: '12px',
    backgroundColor: hovered ? '#333' : '#222',
    border: '3px solid #fff',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    opacity: loading ? 0.6 : 1,
    boxShadow: hovered ? 'inset 0 0 0 2px #fff, 4px 4px 0px #333' : '4px 4px 0px #333',
    transition: 'none',
  });

  const linkStyle: React.CSSProperties = {
    color: '#4ade80',
    cursor: 'pointer',
    textDecoration: 'underline',
    textAlign: 'center',
    display: 'block',
    marginTop: '12px',
    fontSize: isMobile ? '14px' : '16px',
  };

  const errorStyle: React.CSSProperties = {
    color: '#ff4444',
    fontSize: isMobile ? '12px' : '14px',
    marginBottom: '12px',
    textAlign: 'center',
  };

  const messageStyle: React.CSSProperties = {
    color: '#4ade80',
    fontSize: isMobile ? '12px' : '14px',
    marginBottom: '12px',
    textAlign: 'center',
  };

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h2 style={titleStyle}>
          {isSignUp ? 'Criar Conta' : 'Fazer Login'}
        </h2>

        {error && <div style={errorStyle}>{error}</div>}
        {message && <div style={messageStyle}>{message}</div>}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Nome de usuário (opcional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            minLength={6}
            disabled={loading}
          />
          <button 
            type="submit" 
            style={buttonStyle(buttonHovered)} 
            disabled={loading}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
          >
            {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div
          style={linkStyle}
          onClick={() => {
            if (!loading) {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }
          }}
        >
          {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
        </div>

        {onSkip && (
          <div
            style={{ ...linkStyle, color: '#666', marginTop: '20px' }}
            onClick={() => {
              if (!loading) onSkip();
            }}
          >
            Pular (sem salvar progresso)
          </div>
        )}
      </div>
    </div>
  );
}

