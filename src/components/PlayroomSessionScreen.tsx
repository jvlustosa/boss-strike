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
  const [playroomLoaded, setPlayroomLoaded] = useState(false);

  // Only show on mobile/touch devices
  const shouldUsePlayroomResult = shouldUsePlayroom();
  console.log('🎮 PlayroomSessionScreen: shouldUsePlayroom() =', shouldUsePlayroomResult);
  
  if (!shouldUsePlayroomResult) {
    // Skip session screen on desktop
    console.log('🎮 PlayroomSessionScreen: Desktop detected, skipping session screen');
    useEffect(() => {
      console.log('🎮 PlayroomSessionScreen: Desktop - calling onSessionReady immediately');
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

  // Track Playroom loading state
  useEffect(() => {
    if (playroomLoaded) {
      console.log('🎮 Playroom screen is now loaded and visible');
    }
  }, [playroomLoaded]);

  // Advanced Playroom detection with MutationObserver
  useEffect(() => {
    if (!shouldUsePlayroom()) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added element or its children contain Playroom elements
              const playroomElements = element.querySelectorAll?.('[data-playroom], .playroom-joystick, [class*="playroom"], [class*="joystick"], .bootstrap-wrapper, [class*="bootstrap"]') || [];
              const isPlayroomElement = element.matches?.('[data-playroom], .playroom-joystick, [class*="playroom"], [class*="joystick"], .bootstrap-wrapper, [class*="bootstrap"]') || false;
              
              // Also check if element has Playroom-like classes or IDs
              const className = element.className || '';
              const id = element.id || '';
              const isPlayroomLike = className.includes('playroom') || 
                                   className.includes('joystick') || 
                                   className.includes('bootstrap') ||
                                   id.includes('playroom') ||
                                   id.includes('joystick');
              
              if (playroomElements.length > 0 || isPlayroomElement || isPlayroomLike) {
                console.log('🎮 Playroom element detected via MutationObserver:', element);
                if (!playroomLoaded) {
                  setPlayroomLoaded(true);
                }
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [playroomLoaded]);

  // Wait for Playroom connection and Launch button click
  useEffect(() => {
    console.log('🎮 PlayroomSessionScreen: useEffect started');
    let isCompleted = false;

    const checkConnection = async () => {
      try {
        console.log('🎮 Starting Playroom connection...');
        // Initialize Playroom session
        await playroomSession.initialize();
        console.log('🎮 Playroom session initialized successfully');
        if (!isCompleted) {
          setStatus('connected');
          console.log('🎮 Status set to connected');
        }

        // Wait for Playroom UI to be ready and then hide loading screen
        const checkPlayroomUI = () => {
          console.log('🎮 checkPlayroomUI called, isCompleted:', isCompleted);
          if (isCompleted) {
            console.log('🎮 checkPlayroomUI: Already completed, returning');
            return;
          }
          
          // Check if Playroom has rendered its UI elements
          const playroomElements = document.querySelectorAll('[data-playroom], .playroom-joystick, [class*="playroom"], [class*="joystick"], .bootstrap-wrapper, [class*="bootstrap"]');
          console.log('🎮 checkPlayroomUI: Found', playroomElements.length, 'Playroom elements');
          
          // Also check for any elements that might be Playroom UI
          const allElements = document.querySelectorAll('*');
          const playroomLikeElements = Array.from(allElements).filter(el => {
            const className = el.className || '';
            const id = el.id || '';
            return className.includes('playroom') || 
                   className.includes('joystick') || 
                   className.includes('bootstrap') ||
                   id.includes('playroom') ||
                   id.includes('joystick');
          });
          console.log('🎮 checkPlayroomUI: Found', playroomLikeElements.length, 'Playroom-like elements:', playroomLikeElements);
          
          if (playroomElements.length > 0 || playroomLikeElements.length > 0) {
            // Playroom UI is visible, track that it's loaded
            if (!playroomLoaded) {
              setPlayroomLoaded(true);
              console.log('🎮 Playroom UI detected and loaded:', playroomElements.length, 'elements');
            }
            
            // Playroom UI is visible, start game automatically
            console.log('🎮 Setting isCompleted = true');
            isCompleted = true;
            setStatus('ready');
            
            // Start game immediately after Playroom is connected
            console.log('🎮 Playroom connected! Starting game automatically...');
            console.log('🎮 onSessionReady callback:', onSessionReady);
            setTimeout(() => {
              console.log('🎮 About to call setIsHidden(true) and onSessionReady()');
              setIsHidden(true);
              console.log('🎮 Calling onSessionReady()...');
              onSessionReady();
              console.log('🎮 onSessionReady() called successfully');
            }, 1000); // Small delay to show "ready" status
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


    console.log('🎮 PlayroomSessionScreen: About to call checkConnection()');
    checkConnection();

    // Cleanup function
    return () => {
      // No cleanup needed for this implementation
    };
  }, [onSessionReady]);

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return `Conectando ao Playroom${dots}`;
      case 'connected':
        return 'Conectado! Configurando controles...';
      case 'ready':
        return 'Playroom conectado! Iniciando jogo...';
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
      zIndex: 1, // Very low z-index to stay below Playroom
      fontFamily: "'Pixelify Sans', monospace",
      color: '#fff',
      pointerEvents: status === 'ready' ? 'none' : 'auto', // Allow clicks through when ready
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px',
        pointerEvents: 'auto', // Keep content interactive
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
        
        {/* Playroom loaded indicator */}
        {playroomLoaded && (
          <div style={{
            fontSize: '14px',
            color: '#00ff00',
            marginBottom: '10px',
            fontWeight: 'bold',
            textShadow: '1px 1px 0px #000',
          }}>
            ✅ Playroom carregado
          </div>
        )}

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
