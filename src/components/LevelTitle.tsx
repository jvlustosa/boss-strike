import React from 'react';
import type { GameState } from '../game/core/types';
import { isDesktop } from '../game/core/environmentDetector';

interface LevelTitleProps {
  gameState: GameState;
}

export function LevelTitle({ gameState }: LevelTitleProps) {
  const levelText = `Nível ${gameState.level}: ${gameState.levelConfig.name}`;
  const desktop = isDesktop();

  return (
    <div style={{
      position: 'fixed',
      top: desktop ? '20px' : '20px',
      left: desktop ? '20px' : '20px',
      color: '#fff',
      fontFamily: "'Pixelify Sans', monospace",
      fontSize: desktop ? '16px' : '14px',
      fontWeight: 'bold',
      textShadow: '2px 2px 0px #000',
      letterSpacing: desktop ? '2px' : '1px',
      zIndex: 1000,
      imageRendering: 'pixelated' as any,
      backgroundColor: desktop ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
      padding: desktop ? '8px 12px' : '0',
      borderRadius: desktop ? '4px' : '0',
      border: desktop ? '2px solid #fff' : 'none',
      whiteSpace: 'nowrap',
    }}>
      {levelText}
    </div>
  );
}
