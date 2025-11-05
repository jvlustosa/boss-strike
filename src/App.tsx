import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { LoginScreen } from './components/LoginScreen';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { WebSocketSessionScreen } from './components/WebSocketSessionScreen';
import { updateUrlLevel, getRoomIdFromUrl, getLevelFromUrl } from './game/core/urlParams';
import { saveProgress } from './game/core/progressCache';
import { createSessionManager } from './game/core/sessionManager';
import { userManager } from './game/core/userManager';
import type { SessionManager } from './game/core/sessionManager';

export default function App() {
  // Check multiplayer mode BEFORE any other state
  const roomId = getRoomIdFromUrl();
  const isAutoMultiplayer = !!roomId;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showSessionScreen, setShowSessionScreen] = useState(isAutoMultiplayer);
  const [isMultiplayer, setIsMultiplayer] = useState(isAutoMultiplayer);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);

  // Initialize user and session manager
  useEffect(() => {
    console.log('[App] Initializing - Room ID:', roomId, 'Auto Multiplayer:', isAutoMultiplayer);

    // Initialize user
    userManager.init();
    setIsLoggedIn(true);

    // Initialize session manager
    const manager = createSessionManager();
    setSessionManager(manager);

    // If auto-multiplayer, confirm states
    if (isAutoMultiplayer) {
      console.log('[App] Auto-multiplayer detected - showing session screen');
      setIsMultiplayer(true);
      setShowSessionScreen(true);
    }
  }, [isAutoMultiplayer, roomId]);

  const handleStartGame = (level?: number) => {
    if (level) {
      updateUrlLevel(level);
    }
    setIsMultiplayer(false);
    setGameStarted(true);
    setIsPaused(false);
  };

  const handleStartMultiplayer = (level?: number) => {
    if (level) {
      updateUrlLevel(level);
    }
    setIsMultiplayer(true);
    setShowSessionScreen(true);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleContinue = () => {
    setIsPaused(false);
  };

  const handleMainMenu = () => {
    updateUrlLevel(1);
    setGameStarted(false);
    setIsPaused(false);
    setIsMultiplayer(false);
    setShowSessionScreen(false);
    
    // Cleanup session
    if (sessionManager) {
      sessionManager.cleanup();
    }
  };

  const handleGameStateChange = (state: any) => {
    setGameState(state);

    // Auto-save progress on victory
    if (state.status === 'won' && state.victoryTimer > 0) {
      saveProgress(state);
    }
  };

  const handleSessionReady = () => {
    setShowSessionScreen(false);
    setGameStarted(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (gameStarted) {
      setIsPaused(!isPaused);
    }
  };

  // Listen for ESC key to toggle pause
  useEffect(() => {
    const handleTogglePause = () => {
      togglePause();
    };

    window.addEventListener('togglePause', handleTogglePause);
    return () => {
      window.removeEventListener('togglePause', handleTogglePause);
    };
  }, [gameStarted, isPaused]);

  if (!isLoggedIn) {
    return <LoginScreen onLoginComplete={() => setIsLoggedIn(true)} />;
  }

  // Priority: If multiplayer with room, show session screen ONLY
  if (isMultiplayer && showSessionScreen) {
    return (
      <WebSocketSessionScreen 
        onSessionReady={handleSessionReady}
        sessionManager={sessionManager}
      />
    );
  }

  if (!gameStarted) {
    return (
      <>
        <MainMenu 
          onStartGame={handleStartGame} 
          onStartMultiplayer={handleStartMultiplayer} 
        />
        {showSessionScreen && (
          <WebSocketSessionScreen 
            onSessionReady={handleSessionReady}
            sessionManager={sessionManager}
          />
        )}
      </>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
    }}>
      {gameState && <LevelTitle key={gameState.level} gameState={gameState} />}
      <div style={{ position: 'relative' }}>
        <GameCanvas 
          isPaused={isPaused} 
          onGameStateChange={handleGameStateChange} 
          isMultiplayer={isMultiplayer}
          sessionManager={sessionManager}
        />
      </div>
      {!isPaused && <PauseButton onPause={handlePause} />}
      {isPaused && (
        <PauseMenu 
          onContinue={handleContinue} 
          onMainMenu={handleMainMenu} 
        />
      )}
    </div>
  );
}
