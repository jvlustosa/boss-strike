import { useEffect, useState } from 'react';
import type { GameState } from '../game/core/types';
import { isDesktop, isMobile } from '../game/core/environmentDetector';
import { PIXEL_FONT } from '../utils/fonts';

interface LevelTitleProps {
  gameState: GameState;
}

export function LevelTitle({ gameState }: LevelTitleProps) {
  const [levelText, setLevelText] = useState(`Nível ${gameState.level}: ${gameState.levelConfig.name}`);
  const desktop = isDesktop();
  const mobile = isMobile();

  // Force update when gameState changes
  useEffect(() => {
    const newLevelText = `Nível ${gameState.level}: ${gameState.levelConfig.name}`;
    setLevelText(newLevelText);
  }, [gameState.level, gameState.levelConfig.name]);

  // On mobile, render as fixed position in top-left
  if (mobile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          color: '#fff',
          fontFamily: PIXEL_FONT,
          fontSize: '10px',
          fontWeight: 'bold',
          textShadow: '2px 2px 0px #000, 1px 1px 0px #333',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #555',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1000,
          textAlign: 'left',
        }}
      >
        {levelText}
      </div>
    );
  }

  return (
    <div
      style={{
        color: '#fff',
        fontFamily: PIXEL_FONT,
        fontSize: desktop ? '12px' : '10px',
        fontWeight: 'bold',
        textShadow: '2px 2px 0px #000',
        letterSpacing: desktop ? '1px' : '0.5px',
        backgroundColor: desktop ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        padding: desktop ? '6px 10px' : '3px 6px',
        borderRadius: desktop ? '4px' : '0',
        border: desktop ? '2px solid #fff' : 'none',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      {levelText}
    </div>
  );
}
