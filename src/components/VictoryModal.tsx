import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PIXEL_FONT } from '../utils/fonts';
import { isMobile } from '../game/core/environmentDetector';

interface VictoryModalProps {
  visible: boolean;
  onNextPhase: () => void;
  level: number;
}

export function VictoryModal({ visible, onNextPhase, level }: VictoryModalProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobile = useMemo(() => isMobile(), []);

  // Check if this level earns a trophy (every 5 levels)
  const earnedTrophy = useMemo(() => level % 5 === 0, [level]);

  // Cleanup timeout on unmount or when visible changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily: PIXEL_FONT,
    padding: mobile ? '20px' : '0',
    pointerEvents: 'auto',
  };

  const modalStyle: React.CSSProperties = {
    background: '#111',
    border: '4px solid #fff',
    padding: mobile ? '20px' : '24px',
    textAlign: 'center',
    minWidth: mobile ? '280px' : '320px',
    maxWidth: '90%',
    imageRendering: 'pixelated' as any,
    boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    color: '#0f0',
    fontSize: mobile ? '20px' : '24px',
    fontWeight: 'bold',
    marginBottom: mobile ? '12px' : '16px',
    letterSpacing: '2px',
    textShadow: '2px 2px 0px #333',
    textTransform: 'uppercase',
  };

  const trophyContainerStyle: React.CSSProperties = {
    fontSize: mobile ? '48px' : '64px',
    marginBottom: mobile ? '12px' : '16px',
    animation: 'bounce 0.6s ease-in-out',
    filter: earnedTrophy ? 'drop-shadow(0 0 20px #ffd700)' : 'none',
  };

  const levelInfoStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: mobile ? '14px' : '16px',
    marginBottom: mobile ? '8px' : '12px',
    opacity: 0.9,
  };

  const achievementStyle: React.CSSProperties = {
    color: '#ffd700',
    fontSize: mobile ? '12px' : '14px',
    fontWeight: 'bold',
    marginBottom: mobile ? '16px' : '20px',
    letterSpacing: '1px',
    textShadow: '1px 1px 0px #333',
    animation: earnedTrophy ? 'pulse 1s ease-in-out infinite' : 'none',
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: PIXEL_FONT,
    fontSize: mobile ? '14px' : '16px',
    fontWeight: 'bold',
    color: pressed ? '#000' : (hovered ? '#4f4' : '#0f0'),
    background: pressed ? '#0f0' : (hovered ? '#333' : '#222'),
    border: pressed ? '3px solid #fff' : (hovered ? '3px solid #4f4' : '3px solid #0f0'),
    padding: mobile ? '12px 20px' : '14px 24px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    imageRendering: 'pixelated' as any,
    transition: 'all 0.1s ease',
    outline: 'none',
    width: '100%',
    textShadow: '1px 1px 0px #333',
    boxShadow: pressed
      ? '0 0 20px rgba(0, 255, 0, 0.6), 4px 4px 0px #333'
      : (hovered
        ? '0 0 15px rgba(0, 255, 0, 0.4), 6px 6px 0px #333'
        : '4px 4px 0px #333'),
    transform: pressed ? 'translateY(2px)' : (hovered ? 'translateY(-2px)' : 'translateY(0)'),
  };

  const handleClick = () => {
    setPressed(true);
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      try {
        onNextPhase();
      } catch (error) {
        // Silently handle errors in production
        if (process.env.NODE_ENV === 'development') {
          console.error('Error in onNextPhase:', error);
        }
      } finally {
        setPressed(false);
        setHovered(false);
        timeoutRef.current = null;
      }
    }, 100);
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      <div 
        style={overlayStyle} 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div 
          style={modalStyle} 
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div style={titleStyle}>VITÓRIA!</div>
          
          <div style={trophyContainerStyle}>
            {earnedTrophy ? '🏆' : '⭐'}
          </div>

          <div style={levelInfoStyle}>
            Fase {level} Completa!
          </div>

          {earnedTrophy && (
            <div style={achievementStyle}>
              🎉 TROFÉU DESBLOQUEADO! 🎉
            </div>
          )}
          
          <button
          style={buttonStyle}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPressed(true);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPressed(false);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPressed(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPressed(false);
            handleClick();
          }}
        >
          Próxima Fase
        </button>
        </div>
      </div>
    </>
  );
}

