import { useState, useEffect } from 'react';
import { AnimatedBackground } from './AnimatedBackground';

interface MainMenuProps {
  onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [victoryCount, setVictoryCount] = useState(0);

  // Load victory count from localStorage
  useEffect(() => {
    const savedVictories = localStorage.getItem('bossAttackVictories');
    if (savedVictories) {
      setVictoryCount(parseInt(savedVictories, 10));
    }
  }, []);

  const buttonStyle: React.CSSProperties = {
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: isHovered ? '#444' : '#222',
    border: '4px solid #fff',
    padding: '16px 32px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    boxShadow: isHovered 
      ? 'inset 0 0 0 3px #fff, 0 0 0 3px #fff, 4px 4px 0px #333' 
      : 'inset 0 0 0 3px #fff, 4px 4px 0px #333',
    transition: 'none', // No smooth transitions for pixelated look
    outline: 'none',
    minWidth: '140px',
    textShadow: '1px 1px 0px #333',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    position: 'relative',
    zIndex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '30px',
    textAlign: 'center',
    letterSpacing: '8px',
    textShadow: '4px 4px 0px #333, 8px 8px 0px #666',
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    color: '#fff',
    lineHeight: '1.2',
  };

  const creditStyle: React.CSSProperties = {
    fontSize: '16px',
    marginBottom: '40px',
    textAlign: 'center',
    letterSpacing: '3px',
    color: '#aaa',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '400',
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    textShadow: '1px 1px 0px #333',
  };

  const trophyStyle: React.CSSProperties = {
    fontSize: '18px',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#ffd700',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '600',
    imageRendering: 'pixelated',
    imageRendering: '-moz-crisp-edges',
    imageRendering: 'crisp-edges',
    textShadow: '2px 2px 0px #333',
    letterSpacing: '1px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    marginBottom: '50px',
    textAlign: 'center',
    color: '#666',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '400',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  };

  return (
    <>
      <AnimatedBackground />
      <div style={containerStyle}>
        <h1 style={titleStyle}>BossAttack</h1>
        
        <div style={subtitleStyle}>Retro Boss Battle</div>
        
        <div style={creditStyle}>by Duspace</div>
        
        <div style={trophyStyle}>
          🏆 {victoryCount} Vitórias
        </div>
        
        <button
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onStartGame}
        >
          JOGAR
        </button>
      </div>
    </>
  );
}
