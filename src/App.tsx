import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { PlayroomSessionScreen } from './components/PlayroomSessionScreen';
import { updateUrlLevel, getLevelFromUrl } from './game/core/urlParams';
import { saveProgress, clearVictories } from './game/core/progressCache';
import { createInitialState } from './game/core/state';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showPlayroomSession, setShowPlayroomSession] = useState(false);

  const handleStartGame = (level?: number, clearTrophies?: boolean) => {
    // Verificar se há nível na URL primeiro, senão usar o nível passado ou 1
    const urlLevel = getLevelFromUrl();
    const targetLevel = level || urlLevel || 1;
    updateUrlLevel(targetLevel);
    
    // Se recomeçando (nível 1), salvar o progresso como nível 1
    if (targetLevel === 1) {
      const initialState = createInitialState(1);
      saveProgress(initialState);
      
      // Se solicitado, limpar troféus também
      if (clearTrophies) {
        clearVictories();
      }
    }
    
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
        <MainMenu onStartGame={handleStartGame} />
        {showPlayroomSession && (
          <PlayroomSessionScreen onSessionReady={handleSessionReady} />
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
        <GameCanvas isPaused={isPaused} onGameStateChange={handleGameStateChange} />
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
