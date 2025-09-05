import type { GameState } from '../game/core/types';

interface HUDProps {
  gameState: GameState;
  onRestart?: () => void;
}

export function HUD({ gameState, onRestart }: HUDProps) {
  if (gameState.status === 'playing') {
    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}>
        <div>HP: {gameState.boss.hp}/{gameState.boss.hpMax}</div>
        <div>Controls: A/D or ←/→ to move, SPACE to fire</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '24px',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '20px' }}>
        {gameState.status === 'won' ? '🎉 VICTORY!' : '💀 GAME OVER'}
      </div>
      {onRestart && (
        <button
          onClick={onRestart}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            fontFamily: 'monospace',
            background: '#333',
            color: '#fff',
            border: '2px solid #555',
            cursor: 'pointer',
          }}
        >
          Restart
        </button>
      )}
    </div>
  );
}
