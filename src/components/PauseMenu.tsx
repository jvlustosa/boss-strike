import { PIXEL_FONT } from '../utils/fonts';
import { isMobile } from '../game/core/environmentDetector';

interface PauseMenuProps {
  onContinue: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onContinue, onMainMenu }: PauseMenuProps) {
  const mobile = isMobile();

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily: PIXEL_FONT,
    padding: mobile ? '20px' : '0',
  };

  const menuStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)',
    border: '4px solid #fff',
    borderRadius: '12px',
    padding: mobile ? '24px' : '32px',
    textAlign: 'center',
    minWidth: mobile ? '280px' : '320px',
    maxWidth: '90%',
    imageRendering: 'pixelated' as any,
    boxShadow: '0 0 0 4px #333, 8px 8px 0px #333, 0 0 30px rgba(0, 0, 0, 0.8)',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: mobile ? '20px' : '28px',
    fontWeight: 'bold',
    marginBottom: mobile ? '24px' : '32px',
    letterSpacing: '3px',
    textShadow: '2px 2px 0px #333, 0 0 20px rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: mobile ? '12px' : '16px',
    marginBottom: mobile ? '20px' : '24px',
  };

  const getButtonStyle = (isPrimary: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontFamily: PIXEL_FONT,
      fontSize: mobile ? '14px' : '16px',
      fontWeight: 'bold',
      color: isPrimary ? '#000' : '#fff',
      background: isPrimary
        ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
        : 'linear-gradient(135deg, #222 0%, #111 100%)',
      border: isPrimary ? '3px solid #22c55e' : '3px solid #fff',
      padding: mobile ? '12px 20px' : '14px 24px',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      imageRendering: 'pixelated' as any,
      transition: 'all 0.2s ease',
      outline: 'none',
      width: '100%',
      textShadow: isPrimary ? '1px 1px 0px #333' : '1px 1px 0px #333',
      boxShadow: isPrimary
        ? '0 0 20px rgba(74, 222, 128, 0.4), 4px 4px 0px #333'
        : 'inset 0 0 0 3px #fff, 4px 4px 0px #333',
    };
    return baseStyle;
  };

  const getButtonHoverStyle = (isPrimary: boolean = false): React.CSSProperties => {
    return {
      ...getButtonStyle(isPrimary),
      transform: 'translateY(-2px)',
      boxShadow: isPrimary
        ? '0 0 25px rgba(74, 222, 128, 0.6), 6px 6px 0px #333'
        : 'inset 0 0 0 3px #fff, 0 0 15px rgba(255, 255, 255, 0.3), 6px 6px 0px #333',
    };
  };

  const footerStyle: React.CSSProperties = {
    marginTop: mobile ? '24px' : '28px',
    borderTop: '2px solid #333',
    paddingTop: mobile ? '16px' : '20px',
  };

  const linkStyle: React.CSSProperties = {
    fontSize: mobile ? '10px' : '12px',
    color: '#666',
    fontFamily: PIXEL_FONT,
    fontWeight: '400',
    imageRendering: 'pixelated' as any,
    textDecoration: 'none',
    letterSpacing: '1px',
    transition: 'color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  return (
    <div style={overlayStyle}>
      <div style={menuStyle}>
        <div style={titleStyle}>⏸ PAUSADO</div>
        
        <div style={buttonContainerStyle}>
          <button
            style={getButtonStyle(true)}
            onClick={onContinue}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, getButtonHoverStyle(true));
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, getButtonStyle(true));
            }}
          >
            ▶ Continuar
          </button>
          
          <button
            style={getButtonStyle(false)}
            onClick={onMainMenu}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, getButtonHoverStyle(false));
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, getButtonStyle(false));
            }}
          >
            🏠 Menu Principal
          </button>
        </div>
        
        <div style={footerStyle}>
          <a 
            href="https://github.com/jvlustosa/boss-strike" 
            target="_blank" 
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
