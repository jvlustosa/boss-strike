import React from 'react';
import type { GameState } from '../game/core/types';

interface LevelTitleProps {
  gameState: GameState;
}

export function LevelTitle({ gameState }: LevelTitleProps) {
  const levelText = `Nível ${gameState.level}: ${gameState.levelConfig.name}`;

  return (
    <div style={{
      position: 'absolute',
      top: '-30px',
      left: '0px',
      color: '#fff',
      fontFamily: "'Pixelify Sans', monospace",
      fontSize: '14px',
      fontWeight: 'bold',
      textShadow: '2px 2px 0px #000',
      letterSpacing: '1px',
      zIndex: 10,
      imageRendering: 'pixelated' as any,
    }}>
      {levelText}
    </div>
  );
}
