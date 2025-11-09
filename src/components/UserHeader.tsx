import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PIXEL_FONT } from '../utils/fonts';

interface UserHeaderProps {
  onProfileClick: () => void;
  onPause?: () => void;
}

export function UserHeader({ onProfileClick, onPause }: UserHeaderProps) {
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
    gap: isMobile ? '8px' : '10px',
    fontFamily: PIXEL_FONT,
    pointerEvents: 'auto',
  };

  const usernameStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: isMobile ? '11px' : '15px',
    fontWeight: '600',
    textShadow: '2px 2px 0px #333',
    imageRendering: 'pixelated' as any,
  };

  const buttonStyle: React.CSSProperties = {
    background: '#222',
    border: '2px solid #fff',
    borderRadius: '50%',
    width: isMobile ? '32px' : '36px',
    height: isMobile ? '32px' : '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: PIXEL_FONT,
    fontSize: isMobile ? '14px' : '18px',
    color: '#fff',
    boxShadow: '0 0 0 2px #333, 4px 4px 0px #333',
    transition: 'none',
    imageRendering: 'pixelated' as any,
    touchAction: 'none',
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#333',
    boxShadow: 'inset 0 0 0 2px #fff, 0 0 0 2px #fff, 4px 4px 0px #333',
  };

  const [profileHovered, setProfileHovered] = useState(false);
  const [pauseHovered, setPauseHovered] = useState(false);

  return (
    <div style={headerStyle}>
      <span style={usernameStyle}>
        {profile.username || profile.email?.split('@')[0] || 'Usuário'}
      </span>
      <button
        style={profileHovered ? buttonHoverStyle : buttonStyle}
        onClick={onProfileClick}
        onMouseEnter={() => setProfileHovered(true)}
        onMouseLeave={() => setProfileHovered(false)}
        aria-label="Abrir perfil"
      >
        👤
      </button>
      {onPause && (
        <button
          style={pauseHovered ? buttonHoverStyle : buttonStyle}
          onClick={onPause}
          onMouseEnter={() => setPauseHovered(true)}
          onMouseLeave={() => setPauseHovered(false)}
          aria-label="Pausar jogo"
          title="Pausar jogo"
        >
          ⏸
        </button>
      )}
    </div>
  );
}

