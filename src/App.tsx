import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { LevelTitle } from './components/LevelTitle';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { ProfileRoute } from './components/ProfileRoute';
import { LevelsPage } from './components/LevelsPage';
import { ToastContainer } from './components/ToastContainer';
import { UserHeader } from './components/UserHeader';
import { SkinUnlockAnimation } from './components/SkinUnlockAnimation';
import { useToast } from './hooks/useToast';
import { useSkinUnlock } from './hooks/useSkinUnlock';
import { useAuth } from './contexts/AuthContext';
import { PIXEL_FONT } from './utils/fonts';
import { updateUrlLevel, getLevelFromUrl } from './game/core/urlParams';
import { saveProgress, clearProgress, clearVictories } from './game/core/progressCache';

function GameApp() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(false);
  const toast = useToast();
  const skinUnlock = useSkinUnlock();
  const { user, profile: authProfile, initialized, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleStartGame = useCallback(async (level?: number, clearTrophies?: boolean) => {
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
    
    // Start game directly
    setIsPaused(false);
    setGameStarted(true);
  }, [user, authSkipped]);

  const handlePause = () => {
    if (gameState) {
      saveProgress(gameState).catch(console.error);
    }
    setIsPaused(true);
  };

  const handleContinue = () => {
    setIsPaused(false);
  };

  const handleMainMenu = () => {
    if (gameState) {
      saveProgress(gameState).catch(console.error);
    }
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
    // Start game directly
    setIsPaused(false);
    setGameStarted(true);
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

  // Listen for startGame event from LevelsPage
  useEffect(() => {
    const handleStartGameEvent = (event: CustomEvent) => {
      const { level } = event.detail;
      handleStartGame(level);
    };

    window.addEventListener('startGame', handleStartGameEvent as EventListener);
    return () => {
      window.removeEventListener('startGame', handleStartGameEvent as EventListener);
    };
  }, [handleStartGame]);

  // Auto-pause when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameStarted && !isPaused) {
        // Save progress when pausing due to tab change
        if (gameState?.status === 'playing') {
          saveProgress(gameState).catch(console.error);
        }
        setIsPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameStarted, isPaused, gameState]);

  // Listen for skin unlock events
  useEffect(() => {
    const handleSkinsUnlocked = (event: CustomEvent) => {
      const unlockedSkins = event.detail;
      skinUnlock.addUnlockedSkins(unlockedSkins);
    };

    window.addEventListener('skinsUnlocked', handleSkinsUnlocked as EventListener);
    return () => {
      window.removeEventListener('skinsUnlocked', handleSkinsUnlocked as EventListener);
    };
  }, [skinUnlock]);

  const handleAuthSkip = () => {
    setAuthSkipped(true);
    setShowAuthModal(false);
    setIsPaused(false);
    setGameStarted(true);
  };


  if (!gameStarted) {
    return (
      <>
        {user && (
          <UserHeader onProfileClick={() => {
            if (user && authProfile?.username) {
              navigate(`/profile/${authProfile.username}`);
            } else {
              setShowProfileModal(true);
            }
          }} />
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
          onShowProfile={() => {
            if (user && authProfile?.username) {
              navigate(`/profile/${authProfile.username}`);
            } else {
              setShowProfileModal(true);
            }
          }}
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
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </>
    );
  }
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = isMobile && window.innerHeight < window.innerWidth;

  return (
    <>
      {user && (
        <UserHeader 
          onProfileClick={() => {
            if (user && authProfile?.username) {
              navigate(`/profile/${authProfile.username}`);
            } else {
              setIsPaused(true);
              setShowProfileModal(true);
            }
          }}
          onPause={!isPaused ? handlePause : undefined}
        />
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
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isLandscape ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isLandscape ? '0' : '12px',
            maxHeight: '100vh',
            overflow: 'hidden',
            width: '100%',
            height: isLandscape ? '100vh' : 'auto',
          }}
        >
          {gameState && (isMobile || !isLandscape) && <LevelTitle key={gameState.level} gameState={gameState} />}
          <div style={{ 
            position: 'relative',
            maxHeight: isLandscape ? '100vh' : 'calc(100vh - 100px)',
            height: isLandscape ? '100vh' : 'auto',
            width: isLandscape ? '100vw' : 'auto',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GameCanvas isPaused={isPaused} onGameStateChange={handleGameStateChange} />
          </div>
        </div>
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
      {skinUnlock.currentAnimation && (
        <SkinUnlockAnimation
          skin={skinUnlock.currentAnimation}
          onComplete={skinUnlock.completeAnimation}
        />
      )}
    </>
  );
}

export default function App() {
  const { initialized } = useAuth();

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/profile/:username" element={<ProfileRoute />} />
        <Route path="/fases" element={<LevelsPageRoute />} />
        <Route path="*" element={<GameApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function LevelsPageRoute() {
  const navigate = useNavigate();
  const handleStartGame = async (level: number) => {
    navigate('/');
    window.dispatchEvent(new CustomEvent('startGame', { detail: { level } }));
  };
  return <LevelsPage onStartGame={handleStartGame} />;
}
