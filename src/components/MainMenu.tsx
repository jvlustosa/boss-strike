import { useState, useEffect } from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import { hasProgress, getLastLevel, getNextLevel, getVictoryCount } from '../game/core/progressCache';

interface MainMenuProps {
  onStartGame: (level?: number) => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [continueHovered, setContinueHovered] = useState(false);
  const [victoryCount, setVictoryCount] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [lastLevel, setLastLevel] = useState(1);
  const [nextLevel, setNextLevel] = useState(1);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Load progress and victory count
  useEffect(() => {
    setVictoryCount(getVictoryCount());
    setCanContinue(hasProgress());
    setLastLevel(getLastLevel());
    setNextLevel(getNextLevel());
  }, []);

  const getButtonStyle = (hovered: boolean): React.CSSProperties => ({
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: hovered ? '#444' : '#222',
    border: isMobile ? '3px solid #fff' : '4px solid #fff',
    padding: isMobile ? '14px 28px' : '16px 32px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: isMobile ? '2px' : '3px',
    imageRendering: 'pixelated' as any,
    boxShadow: hovered 
      ? 'inset 0 0 0 3px #fff, 0 0 0 3px #fff, 4px 4px 0px #333' 
      : 'inset 0 0 0 3px #fff, 4px 4px 0px #333',
    transition: 'none',
    outline: 'none',
    minWidth: isMobile ? '120px' : '140px',
    textShadow: '1px 1px 0px #333',
    marginBottom: isMobile ? '12px' : '16px',
  });

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    imageRendering: 'pixelated' as any,
    position: 'relative',
    zIndex: 1,
    padding: isMobile ? '20px' : '0',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '32px' : '48px',
    fontWeight: '700',
    marginBottom: isMobile ? '20px' : '30px',
    textAlign: 'center',
    letterSpacing: isMobile ? '4px' : '8px',
    textShadow: '4px 4px 0px #333, 8px 8px 0px #666',
    imageRendering: 'pixelated' as any,
    color: '#fff',
    lineHeight: '1.2',
  };

  const creditStyle: React.CSSProperties = {
    fontSize: isMobile ? '14px' : '16px',
    marginBottom: isMobile ? '30px' : '40px',
    textAlign: 'center',
    letterSpacing: isMobile ? '2px' : '3px',
    color: '#aaa',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '400',
    imageRendering: 'pixelated' as any,
    textShadow: '1px 1px 0px #333',
  };

  const trophyStyle: React.CSSProperties = {
    fontSize: isMobile ? '16px' : '18px',
    marginBottom: isMobile ? '25px' : '30px',
    textAlign: 'center',
    color: '#ffd700',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '600',
    imageRendering: 'pixelated' as any,
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
        <h1 style={titleStyle}>Boss Strike</h1>
        
        <div style={subtitleStyle}>Retro Boss Battle</div>
        
        <div style={creditStyle}>by Duspace</div>
        
        <div style={trophyStyle}>
          🏆 {victoryCount} Vitórias
        </div>
        
        {canContinue && (
          <button
            style={getButtonStyle(continueHovered)}
            onMouseEnter={() => setContinueHovered(true)}
            onMouseLeave={() => setContinueHovered(false)}
            onClick={() => onStartGame(nextLevel)}
          >
            CONTINUAR (FASE {nextLevel})
          </button>
        )}
        
        <button
          style={getButtonStyle(isHovered)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onStartGame(1)}
        >
          {canContinue ? 'RECOMEÇAR' : 'JOGAR'}
        </button>
      </div>
    </>
  );
}
