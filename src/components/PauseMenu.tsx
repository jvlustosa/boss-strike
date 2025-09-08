interface PauseMenuProps {
  onContinue: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onContinue, onMainMenu }: PauseMenuProps) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily: "'Pixelify Sans', monospace",
    padding: isMobile ? '20px' : '0',
  };

  const menuStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: '3px solid #fff',
    padding: '30px',
    textAlign: 'center',
    minWidth: '200px',
    imageRendering: 'pixelated' as any,
  };

  const titleStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '30px',
    letterSpacing: '2px',
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#222',
    border: '2px solid #fff',
    padding: '12px 24px',
    margin: '10px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    imageRendering: 'pixelated' as any,
    transition: 'none',
    outline: 'none',
    minWidth: '120px',
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#444',
  };

  return (
    <div style={overlayStyle}>
      <div style={menuStyle}>
        <div style={titleStyle}>PAUSADO</div>
        
        <button
          style={buttonStyle}
          onClick={onContinue}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          Continuar
        </button>
        
        <br />
        
        <button
          style={buttonStyle}
          onClick={onMainMenu}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          Menu Principal
        </button>
        
        <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <a 
            href="https://github.com/jvlustosa/boss-strike" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#666',
              fontFamily: "'Pixelify Sans', monospace",
              fontWeight: '400',
              imageRendering: 'pixelated' as any,
              textDecoration: 'none',
              letterSpacing: '1px',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
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
