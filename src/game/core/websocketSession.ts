type Message = {
  type: string;
  [key: string]: any;
};

type PlayerInput = {
  x: number;
  y: number;
  fire: boolean;
};

type WebSocketCallbacks = {
  onJoin?: (roomId: string, playerId: string, isHost: boolean) => void;
  onPlayerJoined?: (playerId: string, playerName: string, playerCount: number) => void;
  onPlayerLeft?: (playerId: string, playerCount: number) => void;
  onPlayerInput?: (playerId: string, input: PlayerInput) => void;
  onGameStateUpdate?: (gameState: any) => void;
  onPlayerReady?: (playerId: string, ready: boolean) => void;
  onError?: (error: string) => void;
};

class WebSocketSessionManager {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private playerId: string | null = null;
  private isHost: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnecting: boolean = false;
  private callbacks: WebSocketCallbacks = {};
  private playerInputs: Map<string, PlayerInput> = new Map();
  private serverUrl: string;
  private heartbeatInterval: number | null = null;

  constructor(serverUrl: string = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
  }

  async connect(roomId: string | null = null, playerName: string | null = null): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.roomId === roomId) {
        return;
      }
      this.disconnect();
    }

    if (!this.serverUrl) {
      this.isConnecting = false;
      if (this.callbacks.onError) {
        this.callbacks.onError('Servidor WebSocket não configurado. Configure VITE_WS_SERVER_URL no .env');
      }
      return;
    }

    this.isConnecting = true;
    this.roomId = roomId;
    let connectionError = false;

    try {
      const url = new URL(this.serverUrl);
      if (roomId) {
        url.searchParams.set('room', roomId);
      }
      if (playerName) {
        url.searchParams.set('name', playerName);
      }

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        console.log('[WS Client] Connected to server');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        connectionError = false;
        
        this.send({
          type: 'join',
          roomId: roomId || null,
          playerName: playerName || null
        });

        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WS Client] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS Client] WebSocket error:', error);
        connectionError = true;
      };

      this.ws.onclose = (event) => {
        console.log('[WS Client] Connection closed', event.code, event.reason);
        this.stopHeartbeat();
        
        // 1006 = Abnormal closure (no close frame received)
        // Common with ngrok free tier blocking
        const isNgrokBlock = event.code === 1006 && this.serverUrl.includes('ngrok');
        
        if (connectionError && this.reconnectAttempts === 0) {
          this.isConnecting = false;
          if (this.callbacks.onError) {
            let errorMsg: string;
            if (isNgrokBlock) {
              errorMsg = 'ngrok bloqueou a conexão. Use ngrok authtoken ou atualize para versão paga. Alternativa: use Railway/Render para produção.';
            } else if (this.serverUrl.includes('localhost')) {
              errorMsg = 'Servidor não encontrado. Verifique se o servidor está rodando em localhost:8080';
            } else {
              errorMsg = 'Erro de conexão. Verifique se o servidor está acessível';
            }
            this.callbacks.onError(errorMsg);
          }
        }
        
        // Don't retry if it's ngrok blocking (will keep failing)
        if (isNgrokBlock) {
          this.isConnecting = false;
          return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId && !connectionError) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[WS Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.connect(this.roomId, null);
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.isConnecting = false;
          if (this.callbacks.onError && !connectionError) {
            this.callbacks.onError('Não foi possível reconectar ao servidor');
          }
        } else {
          this.isConnecting = false;
        }
      };
    } catch (error) {
      console.error('[WS Client] Connection error:', error);
      this.isConnecting = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(`Erro ao conectar: ${error instanceof Error ? error.message : 'URL inválida'}`);
      }
    }
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case 'joined':
        this.playerId = message.playerId;
        this.roomId = message.roomId;
        this.isHost = message.isHost;
        if (this.callbacks.onJoin) {
          this.callbacks.onJoin(message.roomId, message.playerId, message.isHost);
        }
        break;

      case 'playerJoined':
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(
            message.playerId,
            message.playerName,
            message.playerCount
          );
        }
        break;

      case 'playerLeft':
        this.playerInputs.delete(message.playerId);
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft(message.playerId, message.playerCount);
        }
        break;

      case 'playerInput':
        this.playerInputs.set(message.playerId, message.input);
        if (this.callbacks.onPlayerInput) {
          this.callbacks.onPlayerInput(message.playerId, message.input);
        }
        break;

      case 'gameStateUpdate':
        if (this.callbacks.onGameStateUpdate) {
          this.callbacks.onGameStateUpdate(message.gameState);
        }
        break;

      case 'playerReady':
        if (this.callbacks.onPlayerReady) {
          this.callbacks.onPlayerReady(message.playerId, message.ready);
        }
        break;

      case 'error':
        console.error('[WS Client] Server error:', message.message);
        if (this.callbacks.onError) {
          this.callbacks.onError(message.message);
        }
        break;

      case 'pong':
        break;

      default:
        console.warn('[WS Client] Unknown message type:', message.type);
    }
  }

  send(message: Message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WS Client] Cannot send message - not connected');
    }
  }

  sendInput(input: PlayerInput) {
    this.send({
      type: 'input',
      input
    });
  }

  sendGameState(gameState: any) {
    if (this.isHost) {
      this.send({
        type: 'gameState',
        gameState
      });
    }
  }

  sendReady(ready: boolean = true) {
    this.send({
      type: 'ready',
      ready
    });
  }

  getPlayerInput(playerId: string): PlayerInput | null {
    return this.playerInputs.get(playerId) || null;
  }

  getAllPlayerInputs(): Map<string, PlayerInput> {
    return new Map(this.playerInputs);
  }

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.playerId = null;
    this.isHost = false;
    this.playerInputs.clear();
    this.isConnecting = false;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  isConnectingState(): boolean {
    return this.isConnecting;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getIsHost(): boolean {
    return this.isHost;
  }

  getPlayerCount(): number {
    return this.playerInputs.size + (this.playerId ? 1 : 0);
  }
}

function getServerUrl(): string {
  if (import.meta.env.VITE_WS_SERVER_URL) {
    return import.meta.env.VITE_WS_SERVER_URL;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  if (hostname.includes('ngrok') || hostname.includes('ngrok-free') || hostname.includes('ngrok.app')) {
    return `${protocol}//${hostname}`;
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ws://localhost:8080';
  }
  
  if (hostname.includes('vercel.app')) {
    console.warn('[WS] Vercel não suporta WebSocket. Configure VITE_WS_SERVER_URL para apontar para um servidor WebSocket externo.');
    return ''; // Retorna vazio para forçar configuração manual
  }
  
  return `${protocol}//${hostname}:8080`;
}

const WS_SERVER_URL = getServerUrl();
console.log('[WS] Using server URL:', WS_SERVER_URL);
export const websocketSession = new WebSocketSessionManager(WS_SERVER_URL);

