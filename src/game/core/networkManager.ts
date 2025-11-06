import type { GameStateSnapshot, InputSnapshot } from './multiplayerTypes';

/**
 * Production-grade network manager for multiplayer
 * Handles WebSocket communication, reliability, and reconnection
 */
export interface NetworkManagerCallbacks {
  onPlayerJoined?: (playerId: string, playerName: string, isHost: boolean) => void;
  onPlayerLeft?: (playerId: string) => void;
  onInputReceived?: (playerId: string, input: any) => void;
  onGameStateUpdate?: (snapshot: GameStateSnapshot) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onPing?: (latency: number) => void;
}

export class NetworkManager {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private roomId: string;
  private playerId: string;
  private callbacks: NetworkManagerCallbacks = {};
  private isConnected: boolean = false;
  private isReconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageQueue: any[] = [];
  private lastPingTime: number = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string, roomId: string, playerId: string) {
    this.serverUrl = serverUrl;
    this.roomId = roomId;
    this.playerId = playerId;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[Network] Already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.serverUrl);
        url.searchParams.set('room', this.roomId);

        console.log(`[Network] Connecting to ${url.toString()}`);
        this.ws = new WebSocket(url.toString());

        const connectTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout (15s)'));
        }, 15000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log(`[Network] Connected to ${url.toString()}`);
          
          // Send join message immediately
          this.sendMessage({
            type: 'join',
            roomId: this.roomId,
            playerId: this.playerId,
            timestamp: Date.now()
          });
          
          this.handleConnected();
          resolve();
        };

        this.ws.onmessage = (event) => this.handleMessage(event.data);
        this.ws.onerror = (error) => this.handleError(error);
        this.ws.onclose = () => this.handleDisconnected();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: NetworkManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Send player input to server
   */
  sendInput(input: any): void {
    this.sendMessage({
      type: 'input',
      input,
      playerId: this.playerId,
    });
  }

  /**
   * Send game state to other players (host only)
   */
  sendGameState(snapshot: GameStateSnapshot): void {
    this.sendMessage({
      type: 'state',
      snapshot,
      playerId: this.playerId,
    });
  }

  /**
   * Send player ready signal
   */
  sendReady(ready: boolean): void {
    this.sendMessage({
      type: 'ready',
      ready,
      playerId: this.playerId,
    });
  }

  /**
   * Send ping request
   */
  sendPing(): void {
    if (!this.isConnected) return;
    this.lastPingTime = Date.now();
    this.sendMessage({
      type: 'ping',
      playerId: this.playerId,
      timestamp: this.lastPingTime,
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopPing();
    this.flushMessageQueue();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  private sendMessage(message: any): void {
    if (this.getIsConnected()) {
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Network] Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'joined':
          console.log('[Network] Joined room:', message.roomId);
          break;

        case 'playerJoined':
          if (this.callbacks.onPlayerJoined) {
            this.callbacks.onPlayerJoined(
              message.playerId,
              message.playerName,
              message.isHost
            );
          }
          break;

        case 'playerLeft':
          if (this.callbacks.onPlayerLeft) {
            this.callbacks.onPlayerLeft(message.playerId);
          }
          break;

        case 'playerInput':
          if (this.callbacks.onInputReceived) {
            this.callbacks.onInputReceived(message.playerId, message.input);
          }
          break;

        case 'gameStateUpdate':
          if (this.callbacks.onGameStateUpdate) {
            this.callbacks.onGameStateUpdate(message.snapshot);
          }
          break;

        case 'pong':
          if (message.timestamp && this.lastPingTime) {
            const latency = Date.now() - message.timestamp;
            if (this.callbacks.onPing) {
              this.callbacks.onPing(latency);
            }
          }
          break;

        case 'error':
          console.error('[Network] Server error:', message.message);
          if (this.callbacks.onError) {
            this.callbacks.onError(message.message);
          }
          break;

        default:
          console.warn('[Network] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Network] Failed to parse message:', error);
    }
  }

  private handleConnected(): void {
    console.log('[Network] Connected to server');
    console.log(`[Network] Room: ${this.roomId}, Player: ${this.playerId}`);
    this.isConnected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    // Flush queued messages
    this.flushMessageQueue();

    // Start heartbeat and ping
    this.startHeartbeat();
    this.startPing();

    if (this.callbacks.onConnected) {
      console.log('[Network] Calling onConnected callback');
      this.callbacks.onConnected();
    }
  }

  private handleDisconnected(): void {
    console.log('[Network] Disconnected from server');
    this.isConnected = false;
    this.stopHeartbeat();
    this.stopPing();

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to reconnect to server after multiple attempts');
      }
    }

    if (this.callbacks.onDisconnected) {
      this.callbacks.onDisconnected();
    }
  }

  private handleError(error: Event): void {
    console.error('[Network] WebSocket error:', error);
    if (this.callbacks.onError) {
      this.callbacks.onError('Network connection error');
    }
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[Network] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Network] Reconnection failed:', error);
      });
    }, delay);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.getIsConnected()) {
        this.sendMessage({ type: 'ping', playerId: this.playerId });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.getIsConnected()) {
        this.sendPing();
      }
    }, 5000); // Every 5 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const createNetworkManager = (
  serverUrl: string,
  roomId: string,
  playerId: string
): NetworkManager => {
  return new NetworkManager(serverUrl, roomId, playerId);
};

