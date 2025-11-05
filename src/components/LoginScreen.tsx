import { useState } from 'react';
import { userManager } from '../game/core/userManager';

interface LoginScreenProps {
  onLoginComplete: () => void;
}

export function LoginScreen({ onLoginComplete }: LoginScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      setIsLoading(true);
      userManager.setUserName(playerName.trim());
      setTimeout(() => {
        onLoginComplete();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const user = userManager.getCurrentUser();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      fontFamily: "'Pixelify Sans', monospace",
    }}>
      <div style={{
        backgroundColor: 'rgba(20, 20, 40, 0.9)',
        border: '3px solid #00ffff',
        borderRadius: '8px',
        padding: '40px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
      }}>
        {/* Title */}
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#00ffff',
          textShadow: '2px 2px 0px #000',
          letterSpacing: '2px',
        }}>
          🎮 BOSS STRIKE
        </div>

        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '30px',
          textShadow: '1px 1px 0px #000',
        }}>
          Player Login
        </div>

        {/* Current User Display */}
        {user && (
          <div style={{
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#0f0',
            textShadow: '1px 1px 0px #000',
          }}>
            Current: <strong>{user.name}</strong>
            <br />
            Games: {user.stats.gamesPlayed} | Max Level: {user.stats.maxLevel}
          </div>
        )}

        {/* Input */}
        <input
          type="text"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder="Enter your player name"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: error ? '10px' : '20px',
            border: '2px solid #00ffff',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            fontFamily: "'Pixelify Sans', monospace",
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none',
            textShadow: '1px 1px 0px #000',
            textAlign: 'center',
          }}
          disabled={isLoading}
          autoFocus
        />

        {/* Error */}
        {error && (
          <div style={{
            color: '#ff4444',
            fontSize: '12px',
            marginBottom: '20px',
            textShadow: '1px 1px 0px #000',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 0, 0, 0.3)',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading || !playerName.trim()}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '10px',
            backgroundColor: '#4ade80',
            color: '#000',
            border: '2px solid #22c55e',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: "'Pixelify Sans', monospace",
            cursor: isLoading || !playerName.trim() ? 'not-allowed' : 'pointer',
            textShadow: '1px 1px 0px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            opacity: isLoading || !playerName.trim() ? 0.6 : 1,
          }}
          onMouseDown={(e) => {
            if (!isLoading && playerName.trim()) {
              e.currentTarget.style.transform = 'translateY(2px)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isLoading ? '⏳ Loading...' : '▶️ PLAY'}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            userManager.resetUser();
            setPlayerName('');
            setError('');
          }}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #444',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: "'Pixelify Sans', monospace",
            cursor: isLoading ? 'not-allowed' : 'pointer',
            textShadow: '1px 1px 0px #000',
            transition: 'all 0.2s ease',
          }}
        >
          🔄 New Player
        </button>

        {/* Stats Info */}
        {user && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            borderTop: '1px solid rgba(100, 255, 100, 0.2)',
            fontSize: '11px',
            color: '#666',
            textShadow: '1px 1px 0px #000',
          }}>
            <div>Score: {user.stats.totalScore}</div>
            <div>Longest: {Math.floor(user.stats.longestGame)}s</div>
            <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
              ID: {user.id.substring(0, 8)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

