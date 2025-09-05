import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { PlayroomSessionScreen } from './components/PlayroomSessionScreen';
import { MultiplayerSessionScreen } from './components/MultiplayerSessionScreen';
import { updateUrlLevel } from './game/core/urlParams';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showPlayroomSession, setShowPlayroomSession] = useState(false);
  const [showMultiplayerSession, setShowMultiplayerSession] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const handleStartGame = () => {
    setIsMultiplayer(false);
    setShowPlayroomSession(true);
  };

  const handleStartMultiplayer = () => {
    setIsMultiplayer(true);
    setShowMultiplayerSession(true);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleContinue = () => {
    setIsPaused(false);
  };

  const handleMainMenu = () => {
    // Reset progress to level 1 when returning to main menu from pause
    updateUrlLevel(1);
    setGameStarted(false);
    setIsPaused(false);
    setIsMultiplayer(false);
    setShowMultiplayerSession(false);
  };

  const handleGameStateChange = (state: any) => {
    setGameState(state);
  };

  const handleSessionReady = () => {
    console.log('🎮 App: handleSessionReady called');
    console.log('🎮 App: Current state - showPlayroomSession:', showPlayroomSession, 'showMultiplayerSession:', showMultiplayerSession, 'gameStarted:', gameStarted);
    setShowPlayroomSession(false);
    setShowMultiplayerSession(false);
    setGameStarted(true);
    setIsPaused(false);
    console.log('🎮 App: State updated - gameStarted should be true now');
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

  console.log('🎮 App: Render - gameStarted:', gameStarted, 'showPlayroomSession:', showPlayroomSession, 'showMultiplayerSession:', showMultiplayerSession);
  
  if (!gameStarted) {
    console.log('🎮 App: Rendering MainMenu and/or SessionScreen');
    return (
      <>
        <MainMenu onStartGame={handleStartGame} onStartMultiplayer={handleStartMultiplayer} />
        {showPlayroomSession && (
          <PlayroomSessionScreen onSessionReady={handleSessionReady} />
        )}
        {showMultiplayerSession && (
          <MultiplayerSessionScreen onSessionReady={handleSessionReady} />
        )}
      </>
    );
  }

  console.log('🎮 App: Rendering GameCanvas');
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
    }}>
      <div style={{ position: 'relative' }}>
        {gameState && <LevelTitle gameState={gameState} />}
        <GameCanvas isPaused={isPaused} onGameStateChange={handleGameStateChange} isMultiplayer={isMultiplayer} />
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
