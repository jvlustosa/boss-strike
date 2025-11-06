import { useState, useEffect, useRef } from 'react';
import { getRoomIdFromUrl, updateUrlRoom, generateRoomId } from '../game/core/urlParams';
import type { SessionManager } from '../game/core/sessionManager';

interface WebSocketSessionScreenProps {
  onSessionReady: () => void;
  sessionManager: SessionManager | null;
}

export function WebSocketSessionScreen({ onSessionReady, sessionManager }: WebSocketSessionScreenProps) {
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'ready'>('connecting');
  const [dots, setDots] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showManualStart, setShowManualStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);

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

  // Initialize session (only once)
  const initRef = useRef(false);
  const cleanupRef = useRef(false);
  const gameStartedRef = useRef(false);
  const joinedListenerCalledRef = useRef(false);
  const playerJoinedCallbackCalledRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current || cleanupRef.current || gameStartedRef.current) {
      console.log('[WebSocketSessionScreen] Already initialized, cleaning up, or game started, skipping');
      return;
    }

    let isCompleted = false;

    const handleSession = async () => {
      initRef.current = true;

      try {
        if (!sessionManager) {
          console.error('[WebSocketSessionScreen] Session manager not initialized');
          setError('Session manager not initialized');
          initRef.current = false; // Reset to allow retry
          return;
        }

        // Check if already initialized
        if (sessionManager.getIsInitialized() && sessionManager.isMultiplayer()) {
          console.log('[WebSocketSessionScreen] Already initialized, skipping');
          initRef.current = false; // Reset to allow re-init if needed
          return;
        }

        console.log('[WebSocketSessionScreen] Initializing session');

        // Get or create room ID
        let finalRoomId = getRoomIdFromUrl();
        console.log('[WebSocketSessionScreen] Room ID from URL:', finalRoomId);

        if (!finalRoomId) {
          finalRoomId = generateRoomId();
          updateUrlRoom(finalRoomId);
          console.log('[WebSocketSessionScreen] Generated new room ID:', finalRoomId);
        }

        setRoomId(finalRoomId);
        setStatus('connecting');
        console.log('[WebSocketSessionScreen] Connecting to room:', finalRoomId);

        // Get user name from userManager (MUST have a name)
        const { userManager } = await import('../game/core/userManager');
        const user = userManager.getCurrentUser();
        
        // Enforce name requirement - user MUST be logged in with a name
        if (!user?.name) {
          throw new Error('Player name is required. Please login first.');
        }
        
        const userName = user.name;

        // Register listener for joined event (gets player count) BEFORE initialization
        const joinedListener = (roomId: string, playerId: string, playerCount: number, isHost: boolean) => {
          console.log('[WebSocketSessionScreen] Joined room - playerCount:', playerCount);
          setConnectedPlayers(playerCount);
          
          // If room is full, send ready signal
          if (playerCount === 2) {
            setStatus('ready');
            setIsReady(true);
            // Send ready signal to server
            const networkManager = (sessionManager as any).multiplayerSession?.networkManager;
            if (networkManager) {
              networkManager.sendReady(true);
              console.log('[WebSocketSessionScreen] Sent ready signal to server');
            }
          }
        };
        (window as any).sessionManagerJoinedListener = joinedListener;

        // Register listener for playerJoined event (when remote player enters)
        if (sessionManager.onPlayerJoined) {
          sessionManager.onPlayerJoined((playerId, playerName, isHost) => {
            console.log('[WebSocketSessionScreen] Remote player detected:', playerName, 'isHost:', isHost);
            setConnectedPlayers(2);
            setStatus('ready');
            
            // Send ready signal when remote player joins
            const networkManager = (sessionManager as any).multiplayerSession?.networkManager;
            if (networkManager) {
              networkManager.sendReady(true);
              setIsReady(true);
              console.log('[WebSocketSessionScreen] Sent ready signal to server');
            }
          });
        }

        // Listen for ready messages from other players via NetworkManager callback
        const networkManager = (sessionManager as any).multiplayerSession?.networkManager;
        if (networkManager) {
          const originalCallbacks = networkManager.callbacks || {};
          networkManager.setCallbacks({
            ...originalCallbacks,
            onReady: (playerId, ready, allReady) => {
              if (playerId !== (sessionManager as any).playerId && ready) {
                console.log('[WebSocketSessionScreen] Remote player ready:', playerId, 'allReady:', allReady);
                setRemoteReady(true);
              }
              if (allReady) {
                console.log('[WebSocketSessionScreen] Both players ready and synced!');
              }
            }
          });
        }

        // Initialize multiplayer session (only once) - AFTER listeners are registered
        const playerId = `player_${Math.random().toString(36).substring(7)}`;
        await sessionManager.initMultiplayer(playerId, userName);

        setStatus('waiting');
        setConnectedPlayers(1); // Initial count
        setError(null);
        console.log('[WebSocketSessionScreen] Player connected:', userName);

        // NO automatic timeout - require 2/2 players for manual start
        // Start button only appears when connectedPlayers >= 2
        console.log('[Session] Waiting for 2nd player to start game');

      } catch (error) {
        console.error('[Session] Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect to server');
        setStatus('connecting');
        initRef.current = false; // Reset to allow retry
      }
    };

    handleSession();

    return () => {
      // Cleanup on unmount
      cleanupRef.current = true;
      console.log('[WebSocketSessionScreen] Component unmounting - cleanup');
      if (sessionManager) {
        sessionManager.cleanup();
      }
      initRef.current = false; // Reset for next mount
    };
  }, [sessionManager, onSessionReady]);

  if (isHidden) {
    return null;
  }

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return `Connecting to server${dots}`;
      case 'waiting':
        return `Waiting for players${dots}`;
      case 'ready':
        return `Ready to start!`;
      default:
        return 'Connecting...';
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

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Room link copied! Share with your friend.');
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
            🎮 BOSS STRIKE - MULTIPLAYER
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
              Error: {error}
            </div>
          )}

          {(status === 'waiting' || status === 'ready') && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '24px',
                color: connectedPlayers >= 2 && isReady && remoteReady ? '#4ade80' : '#ffa500',
                textShadow: '2px 2px 0px #000',
                letterSpacing: '3px',
                marginBottom: '10px',
                fontWeight: 'bold',
                backgroundColor: connectedPlayers >= 2 && isReady && remoteReady ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                padding: '12px 24px',
                borderRadius: '8px',
                border: `3px solid ${connectedPlayers >= 2 && isReady && remoteReady ? '#4ade80' : '#ffa500'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                animation: connectedPlayers >= 2 && isReady && remoteReady ? 'pulse 1s infinite' : 'none',
              }}>
                <span>👥</span>
                <span>{connectedPlayers}/2</span>
                <span>PLAYERS</span>
                {connectedPlayers === 2 && (!isReady || !remoteReady) && (
                  <span style={{ fontSize: '14px', marginLeft: '10px' }}>
                    {!isReady && '⏳ Waiting for you...'}
                    {isReady && !remoteReady && '⏳ Waiting for other player...'}
                  </span>
                )}
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
                {connectedPlayers === 0 && 'Waiting for players...'}
                {connectedPlayers === 1 && '1 player connected - Waiting for more...'}
                {connectedPlayers >= 2 && '✅ Ready to start!'}
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
              Room: {roomId}
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
              📋 Copy Room Link
            </button>
          )}

          {/* START GAME button - ONLY appears when room is full AND both players are ready */}
          {connectedPlayers === 2 && isReady && remoteReady && (status === 'waiting' || status === 'ready') && (
            <button
              onClick={(e) => {
                if (isHidden || gameStartedRef.current) {
                  console.log('[Session] Already starting game, ignoring click');
                  return;
                }
                console.log('[Session] Starting game - both players ready and synced');
                gameStartedRef.current = true;
                setIsHidden(true);
                onSessionReady();
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
                animation: 'pulse 1s infinite',
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
              🎮 START GAME
            </button>
          )}

          <div style={{
            fontSize: '12px',
            color: '#aaa',
            textShadow: '1px 1px 0px #000',
            letterSpacing: '1px',
          }}>
            Multiplayer Mode - Share the room link with your friend
          </div>
        </div>
      </div>
    </>
  );
}
