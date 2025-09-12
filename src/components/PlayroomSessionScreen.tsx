import { useState, useEffect } from 'react';
import { shouldUsePlayroom } from '../game/core/environmentDetector';
import { playroomSession } from '../game/core/playroomSession';

interface PlayroomSessionScreenProps {
  onSessionReady: () => void;
  isMultiplayer?: boolean;
}

export function PlayroomSessionScreen({ onSessionReady, isMultiplayer = false }: PlayroomSessionScreenProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'waiting' | 'ready'>('connecting');
  const [dots, setDots] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [showManualStart, setShowManualStart] = useState(false);

  // Show Playroom for multiplayer or mobile devices
  const shouldUsePlayroomResult = shouldUsePlayroom();
  
  if (!shouldUsePlayroomResult && !isMultiplayer) {
    // Skip session screen on desktop single player
    useEffect(() => {
      onSessionReady();
    }, [onSessionReady]);
    return null;
  }

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Simplified lobby handling with timeout
  useEffect(() => {
    let isCompleted = false;

    const handleLobby = async () => {
      try {
        if (isMultiplayer) {
          console.log('🎮 Multiplayer: Starting lobby process...');
          setStatus('waiting');
          
          // Initialize Playroom first
          try {
            await playroomSession.initialize();
            console.log('🎮 Multiplayer: Playroom initialized');
            setStatus('connected');
          } catch (error) {
            console.error('🎮 Multiplayer: Failed to initialize Playroom:', error);
            // Continue anyway with manual start
            setStatus('connected');
          }
          
          // Timeout de segurança - inicia o jogo após 20 segundos
          const safetyTimeout = setTimeout(() => {
            if (!isCompleted) {
              console.log('🎮 Multiplayer: Safety timeout - starting game anyway');
              isCompleted = true;
              setStatus('ready');
              setTimeout(() => {
                setIsHidden(true);
                onSessionReady();
              }, 500);
            }
          }, 20000);

          // Start checking for players immediately after initialization
          const checkPlayers = () => {
            if (isCompleted) return;
            
            const playroomSession = (window as any).playroomSession;
            let playerCount = 1; // Default to 1 (host)
            let roomCodeValue = null;
            
            if (playroomSession && playroomSession.getPlayerCount) {
              playerCount = playroomSession.getPlayerCount();
              roomCodeValue = playroomSession.getRoomCode?.() || null;
            } else {
              console.warn('🎮 Multiplayer: PlayroomSession not available, using fallback');
            }
            
            setConnectedPlayers(playerCount);
            setRoomCode(roomCodeValue);
            
            console.log(`🎮 Multiplayer: Players connected: ${playerCount}/2`);
            
            // Start game only when 2 players are connected
            if (playerCount >= 2) {
              console.log('🎮 Multiplayer: 2 players connected! Starting game...');
              isCompleted = true;
              clearTimeout(safetyTimeout);
              setStatus('ready');
              setTimeout(() => {
                setIsHidden(true);
                onSessionReady();
              }, 2000);
            } else {
              // Check again in 1 second
              setTimeout(checkPlayers, 1000);
            }
          };
          
          // Start checking for players after a short delay
          setTimeout(checkPlayers, 2000);

          // Mostra botão manual após 5 segundos
          setTimeout(() => {
            if (!isCompleted) {
              setShowManualStart(true);
            }
          }, 5000);
          
        } else {
          // Single player - start immediately
          console.log('🎮 Single player: Starting immediately');
          setStatus('ready');
          setTimeout(() => {
            if (!isCompleted) {
              isCompleted = true;
              setIsHidden(true);
              onSessionReady();
            }
          }, 1000);
        }

      } catch (error) {
        console.error('Error handling lobby:', error);
        // Start anyway on error
        if (!isCompleted) {
          isCompleted = true;
          setStatus('ready');
          setTimeout(() => {
            setIsHidden(true);
            onSessionReady();
          }, 1000);
        }
      }
    };

    handleLobby();

    return () => {
      // No cleanup needed
    };
  }, [onSessionReady, isMultiplayer]);

  const getStatusText = () => {
    const multiplayerText = isMultiplayer ? ' (Multiplayer)' : '';
    switch (status) {
      case 'connecting':
        return `Conectando ao Playroom${multiplayerText}${dots}`;
      case 'waiting':
        return `Aguardando lobby do Playroom${dots}`;
      case 'connected':
        return `Lobby ativo! Jogadores: ${connectedPlayers}/2${dots}`;
      case 'ready':
        return `Iniciando jogo${multiplayerText}...`;
      default:
        return 'Conectando...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return '#ffa500'; // Orange
      case 'waiting':
        return '#ffff00'; // Yellow
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
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(74, 222, 128, 0.5); }
            50% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.8); }
            100% { box-shadow: 0 0 5px rgba(74, 222, 128, 0.5); }
          }
        `}
      </style>
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
      zIndex: 1,
      fontFamily: "'Pixelify Sans', monospace",
      color: '#fff',
      pointerEvents: status === 'ready' ? 'none' : 'auto',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textShadow: '3px 3px 0px #000',
          letterSpacing: '2px',
        }}>
          🎮 BOSS STRIKE
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

        {/* Player Counter */}
        {isMultiplayer && status === 'connected' && (
          <div style={{
            marginBottom: '20px',
          }}>
            {/* Main Counter */}
            <div style={{
              fontSize: '24px',
              color: connectedPlayers >= 2 ? '#4ade80' : '#ffa500',
              textShadow: '2px 2px 0px #000',
              letterSpacing: '3px',
              marginBottom: '10px',
              fontWeight: 'bold',
              backgroundColor: connectedPlayers >= 2 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 165, 0, 0.2)',
              padding: '12px 24px',
              borderRadius: '8px',
              border: `3px solid ${connectedPlayers >= 2 ? '#4ade80' : '#ffa500'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              animation: connectedPlayers >= 2 ? 'pulse 1s infinite' : 'none',
            }}>
              <span>👥</span>
              <span>{connectedPlayers}/2</span>
              <span>JOGADORES</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '200px',
              height: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #333',
              margin: '0 auto',
            }}>
              <div style={{
                width: `${(connectedPlayers / 2) * 100}%`,
                height: '100%',
                backgroundColor: connectedPlayers >= 2 ? '#4ade80' : '#ffa500',
                transition: 'width 0.5s ease-in-out',
                animation: connectedPlayers >= 2 ? 'glow 2s infinite' : 'none',
              }} />
            </div>
            
            {/* Player Status */}
            <div style={{
              fontSize: '12px',
              color: connectedPlayers >= 2 ? '#4ade80' : '#ffa500',
              textAlign: 'center',
              marginTop: '8px',
              fontWeight: 'bold',
              textShadow: '1px 1px 0px #000',
            }}>
              {connectedPlayers === 0 && 'Aguardando jogadores...'}
              {connectedPlayers === 1 && '1 jogador conectado - Aguardando mais 1...'}
              {connectedPlayers >= 2 && '✅ Pronto para iniciar!'}
            </div>
          </div>
        )}

        {/* Room Code Display */}
        {isMultiplayer && roomCode && (
          <div style={{
            fontSize: '14px',
            color: '#4ade80',
            textShadow: '1px 1px 0px #000',
            letterSpacing: '2px',
            marginBottom: '10px',
            fontWeight: 'bold',
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #4ade80',
          }}>
            Código da Sala: {roomCode}
          </div>
        )}

        {/* Manual Start Button */}
        {showManualStart && isMultiplayer && (
          <button
            onClick={(event) => {
              const playroomSession = (window as any).playroomSession;
              const playerCount = playroomSession?.getPlayerCount?.() || 1;
              
              // Allow starting with 1 player for testing (hold Shift for test mode)
              const isTestMode = event.shiftKey;
              
              if (playerCount >= 2 || isTestMode) {
                console.log(`🎮 Multiplayer: Manual start clicked with ${playerCount} players${isTestMode ? ' (TEST MODE)' : ''}`);
                setIsHidden(true);
                onSessionReady();
              } else {
                console.log(`🎮 Multiplayer: Manual start clicked but only ${playerCount} players connected`);
                alert(`Aguarde! Apenas ${playerCount} jogador(es) conectado(s). Necessário 2 jogadores para iniciar.\n\nDica: Segure Shift + clique para modo teste (1 jogador).`);
              }
            }}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#4ade80',
              border: '3px solid #22c55e',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px',
              textShadow: '1px 1px 0px #000',
              boxShadow: '0 4px 0px #22c55e',
              transition: 'all 0.1s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0px #22c55e';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0px #22c55e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0px #22c55e';
            }}
          >
            🎮 INICIAR JOGO (2 JOGADORES)
          </button>
        )}

        <div style={{
          fontSize: '12px',
          color: '#aaa',
          textShadow: '1px 1px 0px #000',
          letterSpacing: '1px',
        }}>
          {isMultiplayer ? 'Modo Multiplayer - Aguarde 2 jogadores conectarem' : 'Modo Single Player'}
        </div>
      </div>
    </div>
    </>
  );
}