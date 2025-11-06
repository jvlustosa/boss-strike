import { MultiplayerManager } from './multiplayerManager';
import { NetworkManager } from './networkManager';
import { InputValidator } from './inputValidator';
import type { PlayerInput, GameStateSnapshot } from './multiplayerTypes';

/**
 * High-level multiplayer session manager
 * Coordinates multiplayer manager, network, and input validation
 */
export class MultiplayerSession {
  private mpManager: MultiplayerManager;
  private networkManager: NetworkManager;
  private inputValidator: InputValidator;
  private currentInput: PlayerInput = { x: 0, y: 0, fire: false, timestamp: 0 };
  private isInitialized: boolean = false;

  constructor(
    serverUrl: string,
    roomId: string,
    playerId: string,
    isHost: boolean
  ) {
    this.mpManager = new MultiplayerManager(roomId, playerId, isHost);
    this.networkManager = new NetworkManager(serverUrl, roomId, playerId);
    this.inputValidator = new InputValidator();

    this.setupNetworkCallbacks();
  }

  /**
   * Initialize the session
   */
  async initialize(): Promise<void> {
    try {
      await this.networkManager.connect();
      this.isInitialized = true;
      console.log('[MultiplayerSession] Initialized successfully');
    } catch (error) {
      console.error('[MultiplayerSession] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup session
   */
  cleanup(): void {
    this.networkManager.disconnect();
    this.mpManager.reset();
    this.isInitialized = false;
  }

  /**
   * Update local player input
   */
  updateLocalInput(x: number, y: number, fire: boolean): void {
    const input: PlayerInput = {
      x,
      y,
      fire,
      timestamp: Date.now(),
    };

    const validated = this.inputValidator.validate(input);
    if (validated) {
      this.currentInput = validated;
    }
  }

  /**
   * Get current input
   */
  getCurrentInput(): PlayerInput {
    return this.currentInput;
  }

  /**
   * Get input for remote player
   */
  getRemotePlayerInput(playerId: string): PlayerInput | null {
    return this.mpManager.getPlayerLatestInput(playerId);
  }

  /**
   * Send current input to server
   */
  sendInputToServer(): void {
    if (!this.isInitialized || this.inputValidator.hasTooManyInvalidInputs()) {
      return;
    }

    if (this.mpManager.shouldSendInput()) {
      this.networkManager.sendInput(this.currentInput);
      this.mpManager.markInputSent();
    }
  }

  /**
   * Send game state snapshot (host only)
   */
  sendGameStateSnapshot(snapshot: GameStateSnapshot): void {
    if (!this.isInitialized || !this.mpManager.isHost()) {
      return;
    }

    if (!this.mpManager.validateStateSnapshot(snapshot)) {
      console.warn('[MultiplayerSession] Invalid state snapshot rejected');
      return;
    }

    this.networkManager.sendGameState(snapshot);
  }

  /**
   * Advance to next frame
   */
  nextFrame(): void {
    this.mpManager.nextFrame();
  }

  /**
   * Get multiplayer state
   */
  getState() {
    return this.mpManager.getState();
  }

  /**
   * Get frame number
   */
  getFrameNumber(): number {
    return this.mpManager.getFrameNumber();
  }

  /**
   * Get local player index
   */
  getLocalPlayerIndex(): number {
    return this.mpManager.getLocalPlayerIndex();
  }

  /**
   * Get remote player index
   */
  getRemotePlayerIndex(): number {
    return this.mpManager.getRemotePlayerIndex();
  }

  /**
   * Get all remote players
   */
  getRemotePlayers() {
    return this.mpManager.getConnectedPlayers();
  }

  /**
   * Is host?
   */
  isHost(): boolean {
    return this.mpManager.isHost();
  }

  /**
   * Is initialized?
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Is connected?
   */
  getIsConnected(): boolean {
    return this.networkManager.getIsConnected();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.networkManager.getConnectionStatus();
  }

  private setupNetworkCallbacks(): void {
    this.networkManager.setCallbacks({
      onPlayerJoined: (playerId, playerName, isHost) => {
        console.log(`[MultiplayerSession] Remote player joined: ${playerName} (${playerId}), isHost: ${isHost}`);
        this.mpManager.addRemotePlayer(playerId, playerName, isHost, this.mpManager.getRemotePlayerIndex());
        
        // Call external listener if registered
        if (typeof (window as any).sessionManagerPlayerJoinedListener === 'function') {
          (window as any).sessionManagerPlayerJoinedListener(playerId, playerName, isHost);
        }
      },

      onPlayerLeft: (playerId) => {
        console.log(`[MultiplayerSession] Player left: ${playerId}`);
        this.mpManager.removePlayer(playerId);
      },

      onInputReceived: (playerId, input) => {
        const validated = this.inputValidator.validate(input);
        if (validated) {
          this.mpManager.recordInput(playerId, validated, this.mpManager.getFrameNumber());
        }
      },

      onGameStateUpdate: (snapshot) => {
        console.log('[MultiplayerSession] Game state update received');
        // Validate before accepting state from host
        if (!this.mpManager.isHost() && this.mpManager.validateStateSnapshot(snapshot)) {
          // State will be applied by GameCanvas
        }
      },

      onPing: (latency) => {
        // Update player latency
        const players = this.mpManager.getConnectedPlayers();
        if (players.length > 0) {
          this.mpManager.updatePlayerLatency(players[0].id, latency);
        }
      },

      onError: (error) => {
        console.error('[MultiplayerSession] Network error:', error);
      },

      onConnected: () => {
        console.log('[MultiplayerSession] Connected to server');
      },

      onDisconnected: () => {
        console.log('[MultiplayerSession] Disconnected from server');
      },
    });
  }
}

export const createMultiplayerSession = (
  serverUrl: string,
  roomId: string,
  playerId: string,
  isHost: boolean
): MultiplayerSession => {
  return new MultiplayerSession(serverUrl, roomId, playerId, isHost);
};

