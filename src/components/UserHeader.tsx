import { useAuth } from '../contexts/AuthContext';

interface UserHeaderProps {
  onProfileClick: () => void;
}

export function UserHeader({ onProfileClick }: UserHeaderProps) {
  const { user, profile, loading } = useAuth();

  if (loading || !user || !profile) {
    return null;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    padding: isMobile ? '12px 16px' : '16px 24px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '10px' : '12px',
    fontFamily: "'Pixelify Sans', monospace",
  };

  const usernameStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: isMobile ? '13px' : '15px',
    fontWeight: '600',
    textShadow: '2px 2px 0px #333',
    imageRendering: 'pixelated' as any,
  };

  const profileButtonStyle: React.CSSProperties = {
    background: '#222',
    border: '3px solid #fff',
    borderRadius: '50%',
    width: isMobile ? '36px' : '40px',
    height: isMobile ? '36px' : '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '18px' : '20px',
    color: '#fff',
    boxShadow: '0 0 0 2px #333, 4px 4px 0px #333',
    transition: 'none',
    imageRendering: 'pixelated' as any,
  };

  const profileButtonHoverStyle: React.CSSProperties = {
    ...profileButtonStyle,
    background: '#333',
    boxShadow: 'inset 0 0 0 2px #fff, 0 0 0 2px #fff, 4px 4px 0px #333',
  };

  const [hovered, setHovered] = useState(false);

  return (
    <div style={headerStyle}>
      <span style={usernameStyle}>
        {profile.username || profile.email?.split('@')[0] || 'Usuário'}
      </span>
      <button
        style={hovered ? profileButtonHoverStyle : profileButtonStyle}
        onClick={onProfileClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Abrir perfil"
      >
        👤
      </button>
    </div>
  );
}

