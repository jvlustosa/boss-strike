import React, { useState, useEffect } from 'react';
import { shouldUsePlayroom } from '../game/core/environmentDetector';
// Note: Warning about createRoot import comes from PlayroomKit internally, not our code
import { playroomSession } from '../game/core/playroomSession';

interface PlayroomSessionScreenProps {
  onSessionReady: () => void;
}

export function PlayroomSessionScreen({ onSessionReady }: PlayroomSessionScreenProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ready'>('connecting');
  const [dots, setDots] = useState('');
  const [isHidden, setIsHidden] = useState(false);

  // Only show on mobile/touch devices
  if (!shouldUsePlayroom()) {
    // Skip session screen on desktop
    useEffect(() => {
      onSessionReady();
    }, [onSessionReady]);
    return null;
  }

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Wait for real Playroom connection with 3s timeout
  useEffect(() => {
    let isCompleted = false;

    const checkConnection = async () => {
      try {
        // Initialize Playroom session
        await playroomSession.initialize();
        if (!isCompleted) {
          setStatus('connected');
        }

        // Wait for Playroom UI to be ready and then hide loading screen
        const checkPlayroomUI = () => {
          if (isCompleted) return;
          
          // Check if Playroom has rendered its UI elements
          const playroomElements = document.querySelectorAll('[data-playroom], .playroom-joystick, [class*="playroom"], [class*="joystick"]');
          
          // Also check if our game canvas is ready
          const gameCanvas = document.querySelector('canvas');
          
          // Check if Playroom session is ready
          const isPlayroomReady = playroomSession.isReady();
          
          if (playroomElements.length > 0 || (gameCanvas && gameCanvas.width > 0) || isPlayroomReady) {
            // Playroom UI is visible or game is ready, hide loading screen immediately
            isCompleted = true;
            setIsHidden(true);
            setStatus('ready');
            setTimeout(() => {
              onSessionReady();
            }, 500);
          } else {
            // Check again in 200ms
            setTimeout(checkPlayroomUI, 200);
          }
        };

        // Start checking for Playroom UI after a short delay
        setTimeout(checkPlayroomUI, 1000);

      } catch (error) {
        console.error('Failed to connect to Playroom:', error);
        if (!isCompleted) {
          // Fallback: start game anyway after delay
          setTimeout(() => {
            if (!isCompleted) {
              setStatus('connected');
              setTimeout(() => {
                if (!isCompleted) {
                  setStatus('ready');
                  setTimeout(() => {
                    if (!isCompleted) {
                      isCompleted = true;
                      setIsHidden(true);
                      onSessionReady();
                    }
                  }, 1000);
                }
              }, 1000);
            }
          }, 2000);
        }
      }
    };

    // 3 second timeout - force hide loading screen
    const timeout = setTimeout(() => {
      if (!isCompleted) {
        isCompleted = true;
        setIsHidden(true);
        setStatus('ready');
        setTimeout(() => {
          onSessionReady();
        }, 500);
      }
    }, 3000);

    checkConnection();

    // Cleanup function
    return () => {
      clearTimeout(timeout);
    };
  }, [onSessionReady]);

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return `Conectando ao Playroom${dots}`;
      case 'connected':
        return 'Conectado! Configurando controles...';
      case 'ready':
        return 'Pronto! Iniciando jogo...';
      default:
        return 'Conectando...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return '#ffa500'; // Orange
      case 'connected':
        return '#00ff00'; // Green
      case 'ready':
        return '#00ffff'; // Cyan
      default:
        return '#ffffff'; // White
    }
  };

  // Don't render anything if hidden
  if (isHidden) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      fontFamily: "'Pixelify Sans', monospace",
      color: '#fff',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px',
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textShadow: '3px 3px 0px #000',
          letterSpacing: '2px',
        }}>
          🎮 PLAYROOM
        </div>
        
        <div style={{
          fontSize: '16px',
          marginBottom: '20px',
          color: getStatusColor(),
          textShadow: '2px 2px 0px #000',
          letterSpacing: '1px',
        }}>
          {getStatusText()}
        </div>

        <div style={{
          fontSize: '12px',
          color: '#aaa',
          textShadow: '1px 1px 0px #000',
          letterSpacing: '1px',
        }}>
          Preparando controles móveis...
        </div>
      </div>
    </div>
  );
}
