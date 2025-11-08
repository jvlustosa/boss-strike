import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { PlayroomSessionScreen } from './components/PlayroomSessionScreen';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ToastContainer } from './components/ToastContainer';
import { UserHeader } from './components/UserHeader';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import { updateUrlLevel, getLevelFromUrl } from './game/core/urlParams';
import { saveProgress, clearProgress, clearVictories } from './game/core/progressCache';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showPlayroomSession, setShowPlayroomSession] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const toast = useToast();
  const { user, initialized, refreshProfile } = useAuth();

  const handleStartGame = async (level?: number, clearTrophies?: boolean) => {
    // Verificar se há nível na URL primeiro, senão usar o nível passado ou 1
    const urlLevel = getLevelFromUrl();
    const targetLevel = level || urlLevel || 1;
    updateUrlLevel(targetLevel);
    
    // Se recomeçando (nível 1), limpar o progresso para não mostrar botão "CONTINUAR"
    if (targetLevel === 1) {
      await clearProgress();
      
      // Se solicitado, limpar troféus também
      if (clearTrophies) {
        await clearVictories();
      }
    }
    
    // Show auth modal on first game start if not logged in
    if (targetLevel === 1 && !user) {
      setShowAuthModal(true);
      return;
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
      saveProgress(state).catch(console.error);
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

  // Refresh profile after auth success
  const handleAuthSuccess = () => {
    refreshProfile();
    setShowAuthModal(false);
    setShowPlayroomSession(true);
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

  const handleAuthSkip = () => {
    setShowAuthModal(false);
    setShowPlayroomSession(true);
  };

  if (!gameStarted) {
    return (
      <>
        {initialized && user && (
          <UserHeader onProfileClick={() => setShowProfileModal(true)} />
        )}
        {initialized && (
          <MainMenu 
            onStartGame={handleStartGame}
            onShowProfile={() => setShowProfileModal(true)}
            user={user}
          />
        )}
        {showAuthModal && (
          <AuthModal 
            onAuthSuccess={handleAuthSuccess}
            onSkip={handleAuthSkip}
            showToast={toast.showError}
            showSuccess={toast.showSuccess}
          />
        )}
        {showProfileModal && user && (
          <ProfileModal 
            onClose={() => setShowProfileModal(false)}
            userId={user.id}
            showToast={toast.showError}
          />
        )}
        {showPlayroomSession && (
          <PlayroomSessionScreen onSessionReady={handleSessionReady} />
        )}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </>
    );
  }
  
  return (
    <>
      {user && (
        <UserHeader onProfileClick={() => {
          setIsPaused(true);
          setShowProfileModal(true);
        }} />
      )}
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
      {showProfileModal && user && (
        <ProfileModal 
          onClose={() => {
            setShowProfileModal(false);
            setIsPaused(false);
          }}
          userId={user.id}
          showToast={toast.showError}
        />
      )}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </>
  );
}
