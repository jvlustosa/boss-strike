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

  const getButtonStyle = (hovered: boolean, isSecondary: boolean = false): React.CSSProperties => ({
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: '600',
    color: isSecondary ? '#ccc' : '#fff',
    backgroundColor: hovered ? (isSecondary ? '#333' : '#444') : (isSecondary ? '#111' : '#222'),
    border: isMobile ? `3px solid ${isSecondary ? '#666' : '#fff'}` : `4px solid ${isSecondary ? '#666' : '#fff'}`,
    padding: isMobile ? '14px 28px' : '16px 32px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: isMobile ? '2px' : '3px',
    imageRendering: 'pixelated' as any,
    boxShadow: hovered 
      ? `inset 0 0 0 3px ${isSecondary ? '#666' : '#fff'}, 0 0 0 3px ${isSecondary ? '#666' : '#fff'}, 4px 4px 0px #333` 
      : `inset 0 0 0 3px ${isSecondary ? '#666' : '#fff'}, 4px 4px 0px #333`,
    transition: 'none',
    outline: 'none',
    minWidth: isMobile ? '200px' : '220px',
    textShadow: '1px 1px 0px #333',
    marginBottom: isMobile ? '25px' : '30px',
    display: 'block',
    margin: '0 auto',
    marginBottom: isMobile ? '25px' : '30px',
  });

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    maxHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontFamily: "'Pixelify Sans', monospace",
    imageRendering: 'pixelated' as any,
    position: 'relative',
    zIndex: 1,
    padding: isMobile ? '15px 20px' : '20px 0',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '32px' : '48px',
    fontWeight: '700',
    marginBottom: isMobile ? '12px' : '18px',
    textAlign: 'center',
    letterSpacing: isMobile ? '4px' : '8px',
    textShadow: '4px 4px 0px #333, 8px 8px 0px #666',
    imageRendering: 'pixelated' as any,
    color: '#fff',
    lineHeight: '1.1',
  };

  const creditStyle: React.CSSProperties = {
    fontSize: isMobile ? '13px' : '15px',
    marginBottom: isMobile ? '25px' : '35px',
    textAlign: 'center',
    letterSpacing: isMobile ? '2px' : '3px',
    color: '#aaa',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '400',
    imageRendering: 'pixelated' as any,
    textShadow: '1px 1px 0px #333',
  };

  const trophyStyle: React.CSSProperties = {
    fontSize: isMobile ? '15px' : '17px',
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
    fontSize: isMobile ? '11px' : '13px',
    marginBottom: isMobile ? '20px' : '25px',
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
        <div style={{ textAlign: 'center' }}>
          <h1 style={titleStyle}>
            Boss <span style={{ color: '#4ade80' }}>Strike</span>
          </h1>
          <div style={subtitleStyle}>Retro Boss Battle</div>
          <div style={creditStyle}>by Duspace</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isMobile ? '18px' : '22px' }}>
          <div style={trophyStyle}>
            🏆 {victoryCount} Vitórias
          </div>
          
          {canContinue && (
            <button
              style={getButtonStyle(continueHovered, false)}
              onMouseEnter={() => setContinueHovered(true)}
              onMouseLeave={() => setContinueHovered(false)}
              onClick={() => onStartGame(nextLevel)}
            >
              CONTINUAR (FASE {nextLevel})
            </button>
          )}
          
          <button
            style={getButtonStyle(isHovered, canContinue)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onStartGame(1)}
          >
            {canContinue ? 'RECOMEÇAR' : 'JOGAR'}
          </button>
        </div>
        
        <div style={{ marginTop: isMobile ? '5px' : '8px' }}>
          <a 
            href="https://github.com/jvlustosa/boss-strike" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              fontSize: isMobile ? '12px' : '14px',
              textAlign: 'center',
              color: '#666',
              fontFamily: "'Pixelify Sans', monospace",
              fontWeight: '400',
              imageRendering: 'pixelated' as any,
              textShadow: '1px 1px 0px #333',
              textDecoration: 'none',
              letterSpacing: '1px',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
