import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseSupabaseError } from '../utils/supabaseErrors';

interface AuthModalProps {
  onAuthSuccess: () => void;
  onSkip?: () => void;
  showToast?: (message: string, errorCode?: string, duration?: number) => string;
  showSuccess?: (message: string, duration?: number) => string;
}

export function AuthModal({ onAuthSuccess, onSkip, showToast, showSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (user) {
      onAuthSuccess();
    }
  }, [user, onAuthSuccess]);

  const validateUsername = (username: string): string | null => {
    if (!username) return null; // Optional field
    
    // Length validation (3-30 characters)
    if (username.length < 3) {
      return 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    if (username.length > 30) {
      return 'Nome de usuário deve ter no máximo 30 caracteres';
    }
    
    // Format validation (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Nome de usuário pode conter apenas letras, números e underscore (_)';
    }
    
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate username if provided
    if (username) {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setError(usernameError);
        setLoading(false);
        return;
      }
    }

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
        const successMsg = 'Conta criada! Verifique seu email para confirmar (ou faça login se já confirmou).';
        setMessage(successMsg);
        if (showSuccess) {
          showSuccess('Conta criada com sucesso!');
        }
        // Refresh profile and auto login if email confirmation is disabled
        await refreshProfile();
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      }
    } catch (err: any) {
      const errorInfo = parseSupabaseError(err);
      setError(errorInfo.message);
      if (showToast) {
        showToast(errorInfo.message, errorInfo.code);
      }
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

      // Refresh profile after successful login
      await refreshProfile();
      
      if (showSuccess) {
        showSuccess('Login realizado com sucesso!');
      }
      onAuthSuccess();
    } catch (err: any) {
      const errorInfo = parseSupabaseError(err);
      setError(errorInfo.message);
      if (showToast) {
        showToast(errorInfo.message, errorInfo.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
            <div>
              <input
                type="text"
                placeholder="Nome de usuário (3-30 caracteres, opcional)"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow alphanumeric and underscore
                  if (value === '' || /^[a-zA-Z0-9_]*$/.test(value)) {
                    setUsername(value);
                  }
                }}
                style={inputStyle}
                disabled={loading}
                maxLength={30}
                minLength={3}
              />
              {username && username.length > 0 && username.length < 3 && (
                <div style={{ ...errorStyle, fontSize: isMobile ? '11px' : '12px', marginTop: '-12px', marginBottom: '12px' }}>
                  Mínimo 3 caracteres
                </div>
              )}
            </div>
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

