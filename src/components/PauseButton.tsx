interface PauseButtonProps {
  onPause: () => void;
}

export function PauseButton({ onPause }: PauseButtonProps) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: isMobile ? '70px' : '70px', // Below UserHeader
    right: isMobile ? '15px' : '10px',
    width: isMobile ? '50px' : '40px',
    height: isMobile ? '50px' : '40px',
    backgroundColor: '#222',
    border: '2px solid #fff',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '20px' : '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    imageRendering: 'pixelated' as any,
    zIndex: 999, // Below UserHeader (1000)
    touchAction: 'none',
  };

  return (
    <button
      style={buttonStyle}
      onClick={onPause}
      title="Pausar jogo"
    >
      ⏸
    </button>
  );
}
