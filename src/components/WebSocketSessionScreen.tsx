import { useState, useEffect } from 'react';
import { websocketSession } from '../game/core/websocketSession';
import { getRoomIdFromUrl, updateUrlRoom, generateRoomId } from '../game/core/urlParams';

interface WebSocketSessionScreenProps {
  onSessionReady: () => void;
}

export function WebSocketSessionScreen({ onSessionReady }: WebSocketSessionScreenProps) {
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'ready'>('connecting');
  const [dots, setDots] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showManualStart, setShowManualStart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isCompleted = false;

    const handleSession = async () => {
      try {
        const urlRoomId = getRoomIdFromUrl();
        let finalRoomId = urlRoomId;

        if (!finalRoomId) {
          finalRoomId = generateRoomId();
          updateUrlRoom(finalRoomId);
        }

        setRoomId(finalRoomId);
        setStatus('connecting');

        websocketSession.setCallbacks({
          onJoin: (roomId, playerId, isHost) => {
            console.log(`[WS] Joined room ${roomId} as ${isHost ? 'host' : 'player'}`);
            setStatus('waiting');
            setConnectedPlayers(1);
            setError(null);
          },
          onPlayerJoined: (playerId, playerName, playerCount) => {
            console.log(`[WS] Player ${playerId} joined. Total: ${playerCount}`);
            setConnectedPlayers(playerCount);
          },
          onPlayerLeft: (playerId, playerCount) => {
            console.log(`[WS] Player ${playerId} left. Total: ${playerCount}`);
            setConnectedPlayers(playerCount);
          },
          onError: (errorMessage) => {
            console.error('[WS] Error:', errorMessage);
            setError(errorMessage);
            if (errorMessage.includes('não encontrado') || errorMessage.includes('não acessível')) {
              setStatus('connecting');
            }
          }
        });

        await websocketSession.connect(finalRoomId, null);

        const safetyTimeout = setTimeout(() => {
          if (!isCompleted) {
            console.log('[WS] Safety timeout - starting game anyway');
            isCompleted = true;
            setStatus('ready');
            setTimeout(() => {
              setIsHidden(true);
              onSessionReady();
            }, 500);
          }
        }, 20000);

        const checkPlayers = () => {
          if (isCompleted) return;

          const playerCount = websocketSession.getPlayerCount();
          const isConnected = websocketSession.isConnected();

          setConnectedPlayers(playerCount);

          if (isConnected && playerCount >= 2) {
            console.log('[WS] 2 players connected! Starting game...');
            isCompleted = true;
            clearTimeout(safetyTimeout);
            setStatus('ready');
            setTimeout(() => {
              setIsHidden(true);
              onSessionReady();
            }, 2000);
          } else if (isConnected) {
            setTimeout(checkPlayers, 1000);
          }
        };

        setTimeout(checkPlayers, 2000);

        setTimeout(() => {
          if (!isCompleted) {
            setShowManualStart(true);
          }
        }, 5000);

      } catch (error) {
        console.error('[WS] Error handling session:', error);
        setError('Falha ao conectar ao servidor');
      }
    };

    handleSession();

    return () => {
      websocketSession.disconnect();
    };
  }, [onSessionReady]);

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return `Conectando ao servidor${dots}`;
      case 'waiting':
        return `Aguardando jogadores${dots}`;
      case 'ready':
        return `Iniciando jogo...`;
      default:
        return 'Conectando...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return '#ffa500';
      case 'waiting':
        return '#ffff00';
      case 'ready':
        return '#00ffff';
      default:
        return '#ffffff';
    }
  };

  if (isHidden) {
    return null;
  }

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado! Compartilhe com seu amigo.');
    });
  };

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

          {error && (
            <div style={{
              fontSize: '14px',
              color: '#ff4444',
              marginBottom: '20px',
              textShadow: '1px 1px 0px #000',
            }}>
              Erro: {error}
            </div>
          )}

          {status === 'waiting' && (
            <div style={{ marginBottom: '20px' }}>
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

          {roomId && (
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
              Sala: {roomId}
            </div>
          )}

          {roomId && (
            <button
              onClick={copyRoomLink}
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#6366f1',
                border: '2px solid #4f46e5',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '20px',
                textShadow: '1px 1px 0px #000',
                boxShadow: '0 2px 0px #4f46e5',
              }}
            >
              📋 Copiar Link da Sala
            </button>
          )}

          {showManualStart && (
            <button
              onClick={(e) => {
                const playerCount = websocketSession.getPlayerCount();
                const isTestMode = e.shiftKey;

                if (playerCount >= 2 || isTestMode) {
                  console.log(`[WS] Manual start with ${playerCount} players${isTestMode ? ' (TEST MODE)' : ''}`);
                  setIsHidden(true);
                  onSessionReady();
                } else {
                  alert(`Aguarde! Apenas ${playerCount} jogador(es) conectado(s). Necessário 2 jogadores.\n\nDica: Segure Shift + clique para modo teste.`);
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
            Modo Multiplayer - Compartilhe o link da sala
          </div>
        </div>
      </div>
    </>
  );
}

