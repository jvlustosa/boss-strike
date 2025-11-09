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
import { saveProgress, clearProgress, clearVictories, getNextLevel } from './game/core/progressCache';

function GameApp() {
  const location = useLocation();
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
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  
  // Auto-start game when on /play route
  useEffect(() => {
    if (location.pathname === '/play' && !gameStarted) {
      const startGame = async () => {
        const urlLevel = getLevelFromUrl();
        // Se não há nível na URL, pega a próxima fase desbloqueada
        const nextLevel = await getNextLevel();
        const targetLevel = urlLevel || nextLevel;
        updateUrlLevel(targetLevel);
        
        if (targetLevel === 1) {
          await clearProgress();
        }
        
        if (targetLevel === 1 && !user && !authSkipped) {
          setShowAuthModal(true);
          return;
        }
        
        setIsPaused(false);
        setGameStarted(true);
      };
      startGame();
    }
  }, [location.pathname, gameStarted, user, authSkipped]);

  const handleStartGame = useCallback(async (level?: number, clearTrophies?: boolean) => {
    // Verificar se há nível na URL primeiro, senão usar o nível passado, senão a próxima fase
    const urlLevel = getLevelFromUrl();
    const nextLevel = level ? level : (urlLevel || await getNextLevel());
    const targetLevel = nextLevel;
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
    // Reset game state and navigate to home
    setGameStarted(false);
    setIsPaused(false);
    navigate('/');
  };

  const handleGameStateChange = useCallback((state: any) => {
    setGameState(state);
    
    // Salvar progresso automaticamente quando o jogador avança de fase
    if (state.status === 'won' && state.victoryTimer > 0) {
      saveProgress(state).catch(console.error);
    }
  }, []);


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
      if (level) {
        // Update URL immediately
        updateUrlLevel(level);
        // Force game restart by setting gameStarted to false first, then starting
        setGameStarted(false);
        setIsPaused(false);
        // Small delay to ensure state is reset before starting new game
        setTimeout(() => {
          handleStartGame(level);
        }, 50);
      }
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

  const handleRestartGame = useCallback(async (resetTrophies: boolean) => {
    setShowRestartPrompt(false);
    setIsPaused(false);
    await handleStartGame(1, resetTrophies);
  }, [handleStartGame]);

  const handleCancelRestart = () => {
    setShowRestartPrompt(false);
  };

  const restartPrompt = showRestartPrompt ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#111',
          border: '3px solid #fff',
          boxShadow: '4px 4px 0px #333',
          padding: '16px',
          maxWidth: '260px',
          width: '100%',
          color: '#fff',
          fontFamily: PIXEL_FONT,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', marginBottom: '12px', lineHeight: 1.4 }}>
          você gostaria de reiniciar seus troféus também?
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={handleCancelRestart}
            style={{
              background: '#222',
              color: '#fff',
              border: '2px solid #fff',
              padding: '6px 8px',
              fontFamily: PIXEL_FONT,
              fontSize: '10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #333',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleRestartGame(true)}
            style={{
              background: '#44aa44',
              color: '#fff',
              border: '2px solid #fff',
              padding: '6px 8px',
              fontFamily: PIXEL_FONT,
              fontSize: '10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #113311',
            }}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => handleRestartGame(false)}
            style={{
              background: '#ff4444',
              color: '#fff',
              border: '2px solid #fff',
              padding: '6px 8px',
              fontFamily: PIXEL_FONT,
              fontSize: '10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #331111',
            }}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  ) : null;

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
      {/* Back to Menu button */}
      <button
        onClick={handleMainMenu}
        style={{
          position: 'fixed',
          top: isMobile ? '12px' : '16px',
          left: isMobile ? '12px' : '16px',
          zIndex: 1100,
          padding: isMobile ? '10px 16px' : '12px 20px',
          fontSize: isMobile ? '12px' : '14px',
          fontFamily: PIXEL_FONT,
          background: '#222',
          color: '#fff',
          border: '2px solid #fff',
          borderRadius: '8px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '0 0 0 2px #333, 4px 4px 0px #333',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#333';
          e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #fff, 0 0 0 2px #fff, 4px 4px 0px #333';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#222';
          e.currentTarget.style.boxShadow = '0 0 0 2px #333, 4px 4px 0px #333';
        }}
      >
        ← Menu
      </button>

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
            <GameCanvas isPaused={isPaused} onGameStateChange={handleGameStateChange} gameStarted={gameStarted} gameState={gameState} />
          </div>
        </div>
        {isPaused && gameState && !(gameState.status === 'won' && gameState.victoryTimer <= 0) && (
          <PauseMenu 
            onContinue={handleContinue} 
            onMainMenu={handleMainMenu}
            onRestart={() => setShowRestartPrompt(true)}
          />
        )}
      </div>
      {restartPrompt}
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
      <>
        <style>{`
          @keyframes spin3d {
            0% {
              transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
            }
            25% {
              transform: rotateX(90deg) rotateY(0deg) rotateZ(90deg);
            }
            50% {
              transform: rotateX(180deg) rotateY(90deg) rotateZ(180deg);
            }
            75% {
              transform: rotateX(270deg) rotateY(180deg) rotateZ(270deg);
            }
            100% {
              transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          fontFamily: PIXEL_FONT,
          gap: '24px',
        }}>
          <div style={{
            position: 'relative',
            width: '64px',
            height: '64px',
          }}>
            <div style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              border: '4px solid #0f0',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.3)',
              animation: 'spin3d 2s linear infinite',
              transformOrigin: 'center center',
              imageRendering: 'pixelated' as any,
            }} />
            <div style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              border: '4px solid #0ff',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.3)',
              animation: 'spin3d 2s linear infinite reverse',
              transformOrigin: 'center center',
              top: '16px',
              left: '16px',
              imageRendering: 'pixelated' as any,
            }} />
          </div>
          <div style={{
            fontSize: '14px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: 0.8,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            Carregando...
          </div>
        </div>
      </>
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
    // Update URL first
    updateUrlLevel(level);
    // Navigate to home
    navigate('/');
    // Dispatch event after a small delay to ensure navigation completed
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startGame', { detail: { level } }));
    }, 50);
  };
  return <LevelsPage onStartGame={handleStartGame} />;
}
