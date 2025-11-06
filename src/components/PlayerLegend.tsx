import { userManager } from '../game/core/userManager';

interface PlayerLegendProps {
  isMultiplayer?: boolean;
  remotePlayerName?: string;
  isHost?: boolean;
}

export function PlayerLegend({ 
  isMultiplayer = false, 
  remotePlayerName,
  isHost = false 
}: PlayerLegendProps) {
  const currentUser = userManager.getCurrentUser();

  if (!isMultiplayer) {
    // Single player mode
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ffff',
        borderRadius: '4px',
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: "'Pixelify Sans', monospace",
        color: '#00ffff',
        textShadow: '2px 2px 0px #000',
        zIndex: 100,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          👤 {currentUser?.name || 'Player'}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          Single Player Mode
        </div>
      </div>
    );
  }

  // Multiplayer mode
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #00ffff',
      borderRadius: '4px',
      padding: '12px 16px',
      fontSize: '12px',
      fontFamily: "'Pixelify Sans', monospace",
      zIndex: 100,
    }}>
      {/* Local Player */}
      <div style={{
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
      }}>
        <div style={{
          color: '#ffff00',
          fontWeight: 'bold',
          textShadow: '2px 2px 0px #000',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🟨</span>
          <span>{currentUser?.name || 'Player 1'}</span>
          {isHost && (
            <span style={{
              fontSize: '10px',
              backgroundColor: 'rgba(255, 200, 0, 0.3)',
              padding: '2px 6px',
              borderRadius: '2px',
              color: '#ffff00',
            }}>
              HOST
            </span>
          )}
        </div>
      </div>

      {/* Remote Player */}
      <div>
        <div style={{
          color: '#ff00ff',
          fontWeight: 'bold',
          textShadow: '2px 2px 0px #000',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🟪</span>
          <span>{remotePlayerName || 'Player 2'}</span>
          {!isHost && (
            <span style={{
              fontSize: '10px',
              backgroundColor: 'rgba(255, 0, 255, 0.3)',
              padding: '2px 6px',
              borderRadius: '2px',
              color: '#ff00ff',
            }}>
              CLIENT
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(0, 255, 255, 0.3)',
        fontSize: '10px',
        color: '#0ff',
        opacity: 0.7,
      }}>
        🎮 Multiplayer Match
      </div>
    </div>
  );
}

