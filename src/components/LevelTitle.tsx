import { useEffect, useState } from 'react';
import type { GameState } from '../game/core/types';
import { isDesktop } from '../game/core/environmentDetector';
import { PIXEL_FONT } from '../utils/fonts';

interface LevelTitleProps {
  gameState: GameState;
}

export function LevelTitle({ gameState }: LevelTitleProps) {
  const [levelText, setLevelText] = useState(`Nível ${gameState.level}: ${gameState.levelConfig.name}`);
  const desktop = isDesktop();

  // Force update when gameState changes
  useEffect(() => {
    const newLevelText = `Nível ${gameState.level}: ${gameState.levelConfig.name}`;
    setLevelText(newLevelText);
  }, [gameState.level, gameState.levelConfig.name]);

  return (
    <div
      style={{
        color: '#fff',
        fontFamily: PIXEL_FONT,
        fontSize: desktop ? '16px' : '14px',
        fontWeight: 'bold',
        textShadow: '2px 2px 0px #000',
        letterSpacing: desktop ? '2px' : '1px',
        backgroundColor: desktop ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        padding: desktop ? '8px 12px' : '4px 8px',
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
