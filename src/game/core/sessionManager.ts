import type { GameState } from './types';
import { createMultiplayerSession } from './multiplayerSession';
import type { MultiplayerSession } from './multiplayerSession';
import { getRoomIdFromUrl, getLevelFromUrl } from './urlParams';

/**
 * Production-grade Session Manager
 * Handles both single-player and multiplayer game lifecycle
 */
export class SessionManager {
  private gameMode: 'single' | 'multi' = 'single';
  private multiplayerSession: MultiplayerSession | null = null;
  private playerId: string = '';
  private roomId: string = '';
  private isHost: boolean = false;
  private isInitialized: boolean = false;
  private serverUrl: string = '';
  private playerJoinedListener: ((playerId: string, playerName: string, isHost: boolean) => void) | null = null;

  constructor() {
    this.serverUrl = this.getServerUrl();
  }

  /**
   * Set listener for when a remote player joins
   */
  onPlayerJoined(callback: (playerId: string, playerName: string, isHost: boolean) => void): void {
    this.playerJoinedListener = callback;
    
    // If already have a multiplayer session, register the callback
    if (this.multiplayerSession) {
      // The callback will be called when playerJoined event fires
    }
  }

  /**
   * Auto-detect game mode from URL
   */
  detectGameMode(): 'single' | 'multi' {
    const roomId = getRoomIdFromUrl();
    return roomId ? 'multi' : 'single';
  }

  /**
   * Initialize single player mode
   */
  async initSinglePlayer(): Promise<void> {
    this.gameMode = 'single';
    this.multiplayerSession = null;
    this.isInitialized = true;
    console.log('[SessionManager] Single player mode initialized');
  }

  /**
   * Initialize multiplayer mode
   */
  async initMultiplayer(playerId: string, playerName: string = 'Player'): Promise<void> {
    try {
      const roomId = getRoomIdFromUrl();
      if (!roomId) {
        throw new Error('No room ID in URL for multiplayer');
      }

      this.playerId = playerId;
      this.roomId = roomId;

      // Create session (host if first player, otherwise client)
      const isHost = true; // Will be determined by server
      this.multiplayerSession = await createMultiplayerSession(
        this.serverUrl,
        roomId,
        playerId,
        isHost
      );

      // Register listener callback on window
      if (this.playerJoinedListener) {
        (window as any).sessionManagerPlayerJoinedListener = this.playerJoinedListener;
      }

      await this.multiplayerSession.initialize();
      this.gameMode = 'multi';
      this.isHost = this.multiplayerSession.isHost();
      this.isInitialized = true;

      console.log(`[SessionManager] Multiplayer initialized - ${this.isHost ? 'HOST' : 'CLIENT'}`);
    } catch (error) {
      console.error('[SessionManager] Multiplayer init failed:', error);
      throw error;
    }
  }

  /**
   * Get current game mode
   */
  getGameMode(): 'single' | 'multi' {
    return this.gameMode;
  }

  /**
   * Is multiplayer?
   */
  isMultiplayer(): boolean {
    return this.gameMode === 'multi';
  }

  /**
   * Update local player input
   */
  updateInput(x: number, y: number, fire: boolean): void {
    if (this.multiplayerSession && this.isInitialized) {
      this.multiplayerSession.updateLocalInput(x, y, fire);
    }
  }

  /**
   * Send input to server
   */
  sendInput(): void {
    if (this.multiplayerSession && this.isInitialized) {
      this.multiplayerSession.sendInputToServer();
    }
  }

  /**
   * Get remote player input
   */
  getRemotePlayerInput(index: number): { x: number; y: number; fire: boolean } | null {
    if (!this.multiplayerSession || !this.isInitialized) {
      return null;
    }

    const players = this.multiplayerSession.getRemotePlayers();
    if (players.length === 0) return null;

    const remoteInput = this.multiplayerSession.getRemotePlayerInput(players[0].id);
    return remoteInput || null;
  }

  /**
   * Get remote player name
   */
  getRemotePlayerName(): string | null {
    if (!this.multiplayerSession || !this.isInitialized) {
      return null;
    }

    const players = this.multiplayerSession.getRemotePlayers();
    if (players.length === 0) return null;

    return players[0].name || 'Player 2';
  }

  /**
   * Send game state snapshot (host only)
   */
  sendGameState(snapshot: any): void {
    if (this.multiplayerSession && this.isInitialized && this.isHost) {
      this.multiplayerSession.sendGameStateSnapshot(snapshot);
    }
  }

  /**
   * Advance frame
   */
  nextFrame(): void {
    if (this.multiplayerSession && this.isInitialized) {
      this.multiplayerSession.nextFrame();
    }
  }

  /**
   * Get frame number
   */
  getFrameNumber(): number {
    return this.multiplayerSession?.getFrameNumber() ?? 0;
  }

  /**
   * Is host?
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  /**
   * Get player index
   */
  getPlayerIndex(): number {
    return this.multiplayerSession?.getLocalPlayerIndex() ?? 0;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    if (!this.multiplayerSession) {
      return { connected: true, reconnecting: false, reconnectAttempts: 0 };
    }
    return this.multiplayerSession.getConnectionStatus();
  }

  /**
   * Cleanup session
   */
  cleanup(): void {
    if (this.multiplayerSession) {
      this.multiplayerSession.cleanup();
    }
    this.isInitialized = false;
    console.log('[SessionManager] Session cleaned up');
  }

  /**
   * Is initialized?
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  private getServerUrl(): string {
    // Use env variable if available
    if (import.meta.env.VITE_WS_SERVER_URL) {
      return import.meta.env.VITE_WS_SERVER_URL;
    }

    // Auto-detect based on current host
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:8080';
    }

    return `${protocol}//${hostname}:8080`;
  }
}

export const createSessionManager = (): SessionManager => {
  return new SessionManager();
};

