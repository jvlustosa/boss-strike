interface PauseButtonProps {
  onPause: () => void;
}

export function PauseButton({ onPause }: PauseButtonProps) {
  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '40px',
    height: '40px',
    backgroundColor: '#222',
    border: '2px solid #fff',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    zIndex: 1000,
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
