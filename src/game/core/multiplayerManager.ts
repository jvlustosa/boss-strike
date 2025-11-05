import type { 
  MultiplayerGameState, 
  RemotePlayer, 
  PlayerInput, 
  GameStateSnapshot,
  InputSnapshot 
} from './multiplayerTypes';

/**
 * Production-ready multiplayer manager
 * Handles player tracking, input synchronization, and state validation
 */
export class MultiplayerManager {
  private state: MultiplayerGameState;
  private frameNumber: number = 0;
  private inputBuffer: Map<number, InputSnapshot[]> = new Map();
  private lastSentInputFrame: number = 0;
  private stateValidationEnabled: boolean = true;

  constructor(
    roomId: string,
    playerId: string,
    isHost: boolean
  ) {
    this.state = {
      roomId,
      playerId,
      players: new Map(),
      localPlayerIndex: 0,
      isHost,
      frameNumber: 0,
      serverTime: Date.now(),
      clientTime: Date.now(),
      timeDrift: 0,
    };
  }

  /**
   * Register a remote player
   */
  addRemotePlayer(id: string, name: string, isHost: boolean, index: number): RemotePlayer {
    if (this.state.players.has(id)) {
      console.warn(`[MP] Player ${id} already registered`);
      return this.state.players.get(id)!;
    }

    const player: RemotePlayer = {
      id,
      name,
      isHost,
      index,
      lastInputTime: Date.now(),
      lastStateUpdateTime: Date.now(),
      isConnected: true,
      latency: 0,
    };

    this.state.players.set(id, player);
    console.log(`[MP] Added remote player: ${name} (${id}) at index ${index}`);
    return player;
  }

  /**
   * Update remote player latency
   */
  updatePlayerLatency(playerId: string, latency: number): void {
    const player = this.state.players.get(playerId);
    if (player) {
      player.latency = latency;
    }
  }

  /**
   * Record input for a player
   */
  recordInput(playerId: string, input: PlayerInput, frameNumber: number): void {
    if (!this.inputBuffer.has(frameNumber)) {
      this.inputBuffer.set(frameNumber, []);
    }

    const snapshot: InputSnapshot = {
      playerId,
      input: this.normalizeInput(input),
      frameNumber,
      timestamp: Date.now(),
    };

    this.inputBuffer.get(frameNumber)!.push(snapshot);
    this.updatePlayerInputTime(playerId);
  }

  /**
   * Get input for a specific frame
   */
  getInputForFrame(frameNumber: number): InputSnapshot[] {
    return this.inputBuffer.get(frameNumber) || [];
  }

  /**
   * Get latest input for a player
   */
  getPlayerLatestInput(playerId: string): PlayerInput | null {
    // Find most recent input for this player
    for (let f = this.frameNumber; f >= Math.max(0, this.frameNumber - 30); f--) {
      const inputs = this.inputBuffer.get(f);
      if (inputs) {
        const playerInput = inputs.find(i => i.playerId === playerId);
        if (playerInput) {
          return playerInput.input;
        }
      }
    }
    return null;
  }

  /**
   * Normalize input values to valid range
   */
  private normalizeInput(input: PlayerInput): PlayerInput {
    return {
      x: Math.max(-1, Math.min(1, Math.round(input.x))),
      y: Math.max(-1, Math.min(1, Math.round(input.y))),
      fire: Boolean(input.fire),
      timestamp: input.timestamp,
    };
  }

  /**
   * Validate game state snapshot
   */
  validateStateSnapshot(snapshot: GameStateSnapshot): boolean {
    if (!this.stateValidationEnabled) return true;

    try {
      // Check if values are in reasonable range
      for (const player of snapshot.players) {
        if (player.pos.x < -100 || player.pos.x > 200 ||
            player.pos.y < -100 || player.pos.y > 200) {
          console.warn(`[MP] Invalid player position: ${player.pos.x}, ${player.pos.y}`);
          return false;
        }
        if (player.health < 0 || player.health > 10) {
          console.warn(`[MP] Invalid player health: ${player.health}`);
          return false;
        }
      }

      if (snapshot.boss.hp < 0 || snapshot.boss.hp > snapshot.boss.hpMax * 2) {
        console.warn(`[MP] Invalid boss HP: ${snapshot.boss.hp}`);
        return false;
      }

      if (snapshot.bulletsCount < 0 || snapshot.bulletsCount > 1000) {
        console.warn(`[MP] Invalid bullets count: ${snapshot.bulletsCount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[MP] State validation error:', error);
      return false;
    }
  }

  /**
   * Sync server time with client time
   */
  syncTime(serverTime: number): void {
    const clientTime = Date.now();
    this.state.timeDrift = serverTime - clientTime;
    this.state.serverTime = serverTime;
    this.state.clientTime = clientTime;
  }

  /**
   * Get synchronized time
   */
  getTime(): number {
    return Date.now() + this.state.timeDrift;
  }

  /**
   * Increment frame number and cleanup old data
   */
  nextFrame(): void {
    this.frameNumber++;
    this.state.frameNumber = this.frameNumber;

    // Keep only last 60 frames of input buffer to prevent memory leak
    const oldestFrame = Math.max(0, this.frameNumber - 60);
    for (let f = 0; f < oldestFrame; f++) {
      this.inputBuffer.delete(f);
    }
  }

  /**
   * Check if should send input this frame
   */
  shouldSendInput(): boolean {
    // Send input every frame, but throttle to avoid network spam
    return this.frameNumber - this.lastSentInputFrame >= 1;
  }

  /**
   * Mark input as sent
   */
  markInputSent(): void {
    this.lastSentInputFrame = this.frameNumber;
  }

  /**
   * Get all connected players
   */
  getConnectedPlayers(): RemotePlayer[] {
    return Array.from(this.state.players.values()).filter(p => p.isConnected);
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): RemotePlayer | undefined {
    return this.state.players.get(playerId);
  }

  /**
   * Remove player
   */
  removePlayer(playerId: string): void {
    this.state.players.delete(playerId);
    console.log(`[MP] Removed player: ${playerId}`);
  }

  /**
   * Update player connection status
   */
  setPlayerConnected(playerId: string, connected: boolean): void {
    const player = this.state.players.get(playerId);
    if (player) {
      player.isConnected = connected;
    }
  }

  /**
   * Get state snapshot
   */
  getState(): MultiplayerGameState {
    return { ...this.state };
  }

  /**
   * Get frame number
   */
  getFrameNumber(): number {
    return this.frameNumber;
  }

  /**
   * Get local player index
   */
  getLocalPlayerIndex(): number {
    return this.state.localPlayerIndex;
  }

  /**
   * Get remote player index
   */
  getRemotePlayerIndex(): number {
    return this.state.localPlayerIndex === 0 ? 1 : 0;
  }

  /**
   * Is host?
   */
  isHost(): boolean {
    return this.state.isHost;
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.frameNumber = 0;
    this.lastSentInputFrame = 0;
    this.inputBuffer.clear();
    this.state.frameNumber = 0;
  }

  private updatePlayerInputTime(playerId: string): void {
    const player = this.state.players.get(playerId);
    if (player) {
      player.lastInputTime = Date.now();
    }
  }
}

export const createMultiplayerManager = (
  roomId: string,
  playerId: string,
  isHost: boolean
): MultiplayerManager => {
  return new MultiplayerManager(roomId, playerId, isHost);
};

