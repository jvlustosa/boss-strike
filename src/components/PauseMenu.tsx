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
      </div>
    </div>
  );
}
