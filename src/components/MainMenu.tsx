import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from './AnimatedBackground';
import { hasProgress, getNextLevel, getVictoryCount } from '../game/core/progressCache';
import { getLevelFromUrl } from '../game/core/urlParams';
import { PIXEL_FONT } from '../utils/fonts';

interface MainMenuProps {
  onStartGame: (level?: number, clearTrophies?: boolean) => void;
  onShowProfile?: () => void;
  user?: any;
}

export function MainMenu({ onStartGame, onShowProfile, user }: MainMenuProps) {
  const navigate = useNavigate();
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [phasesHovered, setPhasesHovered] = useState(false);
  const [victoryCount, setVictoryCount] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [nextLevel, setNextLevel] = useState(1);
  const [profileHovered, setProfileHovered] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = isMobile && window.innerHeight < window.innerWidth;


  // Load progress and victory count
  useEffect(() => {
    const loadData = async () => {
      const [victoryCount, progressLevel, hasProgressData] = await Promise.all([
        getVictoryCount(),
        getNextLevel(),
        hasProgress(),
      ]);
      
      setVictoryCount(victoryCount);
      const urlLevel = getLevelFromUrl();
      const finalLevel = urlLevel && urlLevel > 1 ? urlLevel : progressLevel;
      setNextLevel(finalLevel);
      setCanContinue(hasProgressData || !!urlLevel);
    };
    
    loadData();
  }, []);

  const hasVictories = victoryCount > 0;
  const showContinueButton = canContinue && nextLevel > 1;

  const getButtonStyle = (hovered: boolean, isSecondary: boolean = false, isContinue: boolean = false): React.CSSProperties => {
    const greenColor = '#4ade80';
    const greenHover = '#22c55e';
    const greenDark = '#16a34a';
    
    if (isContinue) {
      return {
        fontFamily: PIXEL_FONT,
        fontSize: isLandscape ? '10px' : (isMobile ? '15px' : '16px'),
        fontWeight: '700',
        color: '#000',
        backgroundColor: hovered ? greenHover : greenColor,
        border: isLandscape ? `2px solid ${greenDark}` : (isMobile ? `3px solid ${greenDark}` : `4px solid ${greenDark}`),
        padding: isLandscape ? '4px 8px' : (isMobile ? '12px 24px' : '14px 28px'),
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: isLandscape ? '0.5px' : (isMobile ? '2px' : '2px'),
        imageRendering: 'pixelated' as any,
        boxShadow: hovered 
          ? `inset 0 0 0 ${isLandscape ? '2px' : '3px'} ${greenDark}, 0 0 0 ${isLandscape ? '2px' : '3px'} ${greenDark}, 0 0 ${isLandscape ? '8px' : '12px'} ${greenColor}80, ${isLandscape ? '2px' : '3px'} ${isLandscape ? '2px' : '3px'} 0px #333` 
          : `inset 0 0 0 ${isLandscape ? '2px' : '3px'} ${greenDark}, 0 0 ${isLandscape ? '8px' : '12px'} ${greenColor}80, ${isLandscape ? '2px' : '3px'} ${isLandscape ? '2px' : '3px'} 0px #333`,
        transition: 'none',
        outline: 'none',
        width: isLandscape ? '140px' : (isMobile ? '280px' : '320px'),
        textShadow: '1px 1px 0px rgba(0, 0, 0, 0.3)',
        display: 'block',
        margin: `0 auto ${isLandscape ? '6px' : (isMobile ? '20px' : '24px')} auto`,
      };
    }
    
    return {
    fontFamily: PIXEL_FONT,
    fontSize: isLandscape ? '10px' : (isMobile ? '15px' : '16px'),
    fontWeight: '600',
    color: isSecondary ? '#ccc' : '#fff',
    backgroundColor: hovered ? (isSecondary ? '#333' : '#444') : (isSecondary ? '#111' : '#222'),
    border: isLandscape ? `2px solid ${isSecondary ? '#666' : '#fff'}` : (isMobile ? `3px solid ${isSecondary ? '#666' : '#fff'}` : `4px solid ${isSecondary ? '#666' : '#fff'}`),
    padding: isLandscape ? '4px 8px' : (isMobile ? '12px 24px' : '14px 28px'),
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: isLandscape ? '0.5px' : (isMobile ? '2px' : '2px'),
    imageRendering: 'pixelated' as any,
    boxShadow: hovered 
      ? `inset 0 0 0 ${isLandscape ? '2px' : '3px'} ${isSecondary ? '#666' : '#fff'}, 0 0 0 ${isLandscape ? '2px' : '3px'} ${isSecondary ? '#666' : '#fff'}, ${isLandscape ? '2px' : '3px'} ${isLandscape ? '2px' : '3px'} 0px #333` 
      : `inset 0 0 0 ${isLandscape ? '2px' : '3px'} ${isSecondary ? '#666' : '#fff'}, ${isLandscape ? '2px' : '3px'} ${isLandscape ? '2px' : '3px'} 0px #333`,
    transition: 'none',
    outline: 'none',
      width: isLandscape ? '140px' : (isMobile ? '280px' : '320px'),
    textShadow: '1px 1px 0px #333',
    display: 'block',
    margin: `0 auto ${isLandscape ? '6px' : (isMobile ? '20px' : '24px')} auto`,
    };
  };

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
    fontFamily: PIXEL_FONT,
    imageRendering: 'pixelated' as any,
    position: 'relative',
    zIndex: 1,
    padding: isLandscape ? '4px 12px' : (isMobile ? '15px 20px' : '20px 0'),
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isLandscape ? '16px' : (isMobile ? '26px' : '36px'),
    fontWeight: '700',
    marginBottom: isLandscape ? '4px' : (isMobile ? '12px' : '18px'),
    textAlign: 'center',
    letterSpacing: isLandscape ? '1px' : (isMobile ? '3px' : '6px'),
    textShadow: isLandscape ? '2px 2px 0px #333, 4px 4px 0px #666' : '3px 3px 0px #333, 6px 6px 0px #666',
    imageRendering: 'pixelated' as any,
    color: '#fff',
    lineHeight: '1.1',
  };

  const creditStyle: React.CSSProperties = {
    fontSize: isLandscape ? '9px' : (isMobile ? '13px' : '15px'),
    marginBottom: isLandscape ? '6px' : (isMobile ? '25px' : '35px'),
    textAlign: 'center',
    letterSpacing: isMobile ? '2px' : '3px',
    color: '#aaa',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '400',
    imageRendering: 'pixelated' as any,
    textShadow: '1px 1px 0px #333',
  };

  const trophyStyle: React.CSSProperties = {
    fontSize: isLandscape ? '10px' : (isMobile ? '15px' : '17px'),
    marginBottom: isLandscape ? '6px' : (isMobile ? '25px' : '30px'),
    textAlign: 'center',
    color: '#ffd700',
    fontFamily: "'Pixelify Sans', monospace",
    fontWeight: '600',
    imageRendering: 'pixelated' as any,
    textShadow: '2px 2px 0px #333',
    letterSpacing: '1px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: isLandscape ? '8px' : (isMobile ? '11px' : '13px'),
    marginBottom: isLandscape ? '4px' : (isMobile ? '20px' : '25px'),
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
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isLandscape ? '2px' : (isMobile ? '18px' : '22px') }}>
          <div style={trophyStyle}>
            🏆 {victoryCount} Vitórias
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: isLandscape ? '6px' : '16px',
            justifyContent: 'center'
          }}>
            <button
              style={{
                ...getButtonStyle(primaryHovered, false, showContinueButton),
                margin: 0,
              }}
              onMouseEnter={() => setPrimaryHovered(true)}
              onMouseLeave={() => setPrimaryHovered(false)}
              onClick={() => {
                if (showContinueButton) {
                  onStartGame(nextLevel);
                } else {
                  navigate('/play');
                }
              }}
            >
              {showContinueButton ? (
                <>
                  CONTINUAR → <span style={{ fontSize: isLandscape ? '8px' : (isMobile ? '12px' : '13px') }}>(FASE {nextLevel})</span>
                </>
              ) : 'JOGAR'}
            </button>

              <button
                style={{
                ...getButtonStyle(phasesHovered, true),
                  margin: 0,
                }}
              onMouseEnter={() => setPhasesHovered(true)}
              onMouseLeave={() => setPhasesHovered(false)}
              onClick={() => navigate('/fases')}
              >
              VER FASES
              </button>
          </div>
        </div>
        
        <div style={{ 
          marginTop: isLandscape ? '2px' : (isMobile ? '5px' : '8px'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isLandscape ? '4px' : (isMobile ? '10px' : '12px')
        }}>
          {user && onShowProfile && (
            <button
              style={{
                ...getButtonStyle(profileHovered, true),
                fontSize: isLandscape ? '10px' : (isMobile ? '14px' : '16px'),
                padding: isLandscape ? '4px 8px' : (isMobile ? '10px 20px' : '12px 24px'),
                marginBottom: 0,
                width: isLandscape ? '140px' : (isMobile ? '280px' : '320px'),
              }}
              onMouseEnter={() => setProfileHovered(true)}
              onMouseLeave={() => setProfileHovered(false)}
              onClick={onShowProfile}
            >
              👤 Meu Perfil
            </button>
          )}
          <a 
            href="https://github.com/jvlustosa/boss-strike" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              fontSize: isLandscape ? '10px' : (isMobile ? '12px' : '14px'),
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
              gap: isLandscape ? '4px' : '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            <svg width={isLandscape ? "12" : "16"} height={isLandscape ? "12" : "16"} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
