import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseButton } from './components/PauseButton';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { PlayroomSessionScreen } from './components/PlayroomSessionScreen';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { ToastContainer } from './components/ToastContainer';
import { UserHeader } from './components/UserHeader';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import { PIXEL_FONT } from './utils/fonts';
import { updateUrlLevel, getLevelFromUrl } from './game/core/urlParams';
import { saveProgress, clearProgress, clearVictories } from './game/core/progressCache';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showPlayroomSession, setShowPlayroomSession] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(false);
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
    if (targetLevel === 1 && !user && !authSkipped) {
      setShowAuthModal(true);
      return;
    }
    
    // Start game session
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
    setGameState(state);
    
    // Salvar progresso automaticamente quando o jogador avança de fase
    if (state.status === 'won' && state.victoryTimer > 0) {
      saveProgress(state).catch(console.error);
    }
  };

  const handleSessionReady = () => {
    setShowPlayroomSession(false);
    setIsPaused(false);
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setGameStarted(true);
    }, 0);
  };

  const togglePause = () => {
    if (gameStarted) {
      setIsPaused(!isPaused);
    }
  };

  // Refresh profile after auth success
  const handleAuthSuccess = async () => {
    await refreshProfile();
    setShowAuthModal(false);
    setAuthSkipped(false);
    // Small delay to ensure state is updated
    setTimeout(() => {
      setShowPlayroomSession(true);
    }, 100);
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
    setAuthSkipped(true);
    setShowAuthModal(false);
    setShowPlayroomSession(true);
  };

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: PIXEL_FONT,
      }}>
        Carregando...
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <>
        {user && (
          <UserHeader onProfileClick={() => setShowProfileModal(true)} />
        )}
        {!user && !showAuthModal && (
          <button
            type="button"
            onClick={() => {
              setAuthSkipped(false);
              setShowAuthModal(true);
            }}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 1100,
              background: '#111',
              color: '#fff',
              border: '3px solid #fff',
              padding: '10px 16px',
              fontFamily: PIXEL_FONT,
              fontSize: '12px',
              letterSpacing: '2px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '3px 3px 0px #333',
            }}
          >
            Login
          </button>
        )}
        <MainMenu 
          onStartGame={handleStartGame}
          onShowProfile={() => setShowProfileModal(true)}
          user={user}
        />
        {showAuthModal && (
          <AuthModal 
            onAuthSuccess={handleAuthSuccess}
            onSkip={handleAuthSkip}
            showToast={toast.showError}
            showSuccess={toast.showSuccess}
          />
        )}
        {showProfileModal && user && (
          <ProfilePage 
            onClose={() => setShowProfileModal(false)}
            showToast={toast.showError}
            showSuccess={toast.showSuccess}
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
      {!user && !showAuthModal && (
        <button
          type="button"
          onClick={() => {
            setAuthSkipped(false);
            setIsPaused(true);
            setShowAuthModal(true);
          }}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 1100,
            background: '#111',
            color: '#fff',
            border: '3px solid #fff',
            padding: '10px 16px',
            fontFamily: PIXEL_FONT,
            fontSize: '12px',
            letterSpacing: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '3px 3px 0px #333',
          }}
        >
          Login
        </button>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#000',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {gameState && <LevelTitle key={gameState.level} gameState={gameState} />}
          <div style={{ position: 'relative' }}>
            <GameCanvas isPaused={isPaused} onGameStateChange={handleGameStateChange} />
          </div>
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
        <ProfilePage 
          onClose={() => {
            setShowProfileModal(false);
            setIsPaused(false);
          }}
          showToast={toast.showError}
          showSuccess={toast.showSuccess}
        />
      )}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </>
  );
}
