import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { PlayroomSessionScreen } from './components/PlayroomSessionScreen';
import { updateUrlLevel } from './game/core/urlParams';
import { saveProgress } from './game/core/progressCache';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showPlayroomSession, setShowPlayroomSession] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const handleStartGame = (level?: number) => {
    if (level) {
      updateUrlLevel(level);
    }
    setIsMultiplayer(false);
    // For single player, only show Playroom on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setShowPlayroomSession(true);
    } else {
      // Desktop single player - start game directly
      setGameStarted(true);
      setIsPaused(false);
    }
  };

  const handleStartMultiplayer = (level?: number) => {
    if (level) {
      updateUrlLevel(level);
    }
    setIsMultiplayer(true);
    // For multiplayer, always show Playroom session first
    setShowPlayroomSession(true);
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
  };

  const handleGameStateChange = (state: any) => {
    console.log('App: Game state changed to level', state.level, 'with config:', state.levelConfig?.name);
    setGameState(state);
    
    // Salvar progresso automaticamente quando o jogador avança de fase
    if (state.status === 'won' && state.victoryTimer > 0) {
      saveProgress(state);
    }
  };

  const handleSessionReady = () => {
    setShowPlayroomSession(false);
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

  if (!gameStarted) {
    return (
      <>
        <MainMenu onStartGame={handleStartGame} onStartMultiplayer={handleStartMultiplayer} />
        {showPlayroomSession && (
          <PlayroomSessionScreen onSessionReady={handleSessionReady} isMultiplayer={isMultiplayer} />
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
