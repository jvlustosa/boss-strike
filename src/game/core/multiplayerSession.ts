import * as PlayroomKit from 'playroomkit';
import { emitSubtleLog } from '../../components/SubtleLogger';
import type { GameState } from './types';

interface MultiplayerPlayer {
  id: string;
  state: any;
  joystick: PlayroomKit.Joystick;
  playerData: {
    pos: { x: number; y: number };
    w: number;
    h: number;
    speed: number;
    cooldown: number;
    alive: boolean;
    health: number;
    maxHealth: number;
  };
}

interface MultiplayerSession {
  isInitialized: boolean;
  players: MultiplayerPlayer[];
  currentPlayerId: string | null;
  animationFrame: number | null;
  gameState: GameState | null;
  isHost: boolean;
}

class MultiplayerSessionManager {
  private session: MultiplayerSession = {
    isInitialized: false,
    players: [],
    currentPlayerId: null,
    animationFrame: null,
    gameState: null,
    isHost: false
  };

  private callbacks: {
    onGameStateUpdate?: (gameState: GameState) => void;
    onPlayerJoin?: (playerId: string) => void;
    onPlayerLeave?: (playerId: string) => void;
  } = {};

  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  async initialize(): Promise<void> {
    console.log('🎮 multiplayerSession: initialize() called');
    if (this.session.isInitialized) {
      console.log('🎮 multiplayerSession: Already initialized, returning');
      return;
    }

    if (!PlayroomKit) {
      console.error('🎮 multiplayerSession: PlayroomKit is not available!');
      throw new Error('PlayroomKit is not available');
    }

    this.connectionStatus = 'connecting';
    console.log('🎮 multiplayerSession: Starting connection...');

    try {
      await PlayroomKit.insertCoin();
      console.log('🎮 multiplayerSession: PlayroomKit.insertCoin() completed successfully');

      // Determine if this player is the host (first player)
      this.session.isHost = PlayroomKit.myPlayer() === PlayroomKit.getPlayers()[0];

      // Create a joystick controller for each joining player
      PlayroomKit.onPlayerJoin((state) => {
        console.log('Player joined:', state);
        
        const joystick = new PlayroomKit.Joystick(state, {
          type: "dpad",
          buttons: [
            { id: "fire", label: "Fire" }
          ],
          keyboard: true,
          size: 120,
          deadzone: 0.05
        });

        const playerId = state.id || state.toString();
        
        const player: MultiplayerPlayer = {
          id: playerId,
          state,
          joystick,
          playerData: {
            pos: { x: 50 + (this.session.players.length * 20), y: 180 },
            w: 8,
            h: 8,
            speed: 60,
            cooldown: 0,
            alive: true,
            health: 5,
            maxHealth: 5,
          }
        };
        
        this.session.players.push(player);
        
        if (state === PlayroomKit.myPlayer()) {
          this.session.currentPlayerId = playerId;
          console.log('Current player joystick created with ID:', playerId);
        }

        if (this.callbacks.onPlayerJoin) {
          this.callbacks.onPlayerJoin(playerId);
        }
      });

      // Handle player leaving
      PlayroomKit.onPlayerLeave((state) => {
        const playerId = state.id || state.toString();
        this.session.players = this.session.players.filter(p => p.id !== playerId);
        
        if (this.callbacks.onPlayerLeave) {
          this.callbacks.onPlayerLeave(playerId);
        }
      });

      this.session.isInitialized = true;
      this.connectionStatus = 'connected';
      this.startGameLoop();
    } catch (error) {
      console.error('🎮 multiplayerSession: Failed to initialize:', error);
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (this.session.isInitialized) {
        this.updatePlayerInputs();
        this.syncGameState();
      }
      
      if (this.session.isInitialized) {
        this.session.animationFrame = requestAnimationFrame(gameLoop);
      }
    };
    
    this.session.animationFrame = requestAnimationFrame(gameLoop);
  }

  private updatePlayerInputs(): void {
    this.session.players.forEach(player => {
      if (player.joystick) {
        const dpad = player.joystick.dpad();
        
        let x = 0;
        let y = 0;
        
        if (dpad.x === "left") x = -1;
        else if (dpad.x === "right") x = 1;
        
        if (dpad.y === "up") y = -1;
        else if (dpad.y === "down") y = 1;
        
        // Update player position
        if (x !== 0 || y !== 0) {
          player.playerData.pos.x += x * player.playerData.speed * (1/60); // Assuming 60fps
          player.playerData.pos.y += y * player.playerData.speed * (1/60);
          
          // Keep player within bounds
          player.playerData.pos.x = Math.max(0, Math.min(192 - player.playerData.w, player.playerData.pos.x));
          player.playerData.pos.y = Math.max(0, Math.min(200 - player.playerData.h, player.playerData.pos.y));
        }
        
        // Handle fire button
        if (player.joystick.isPressed("fire") && player.playerData.cooldown <= 0) {
          this.firePlayerBullet(player.id);
          player.playerData.cooldown = 0.2; // Fire cooldown
        }
        
        // Update cooldown
        if (player.playerData.cooldown > 0) {
          player.playerData.cooldown -= 1/60;
        }
      }
    });
  }

  private firePlayerBullet(playerId: string): void {
    const player = this.session.players.find(p => p.id === playerId);
    if (!player || !this.session.gameState) return;

    this.session.gameState.bullets.push({
      pos: { 
        x: player.playerData.pos.x + player.playerData.w / 2 - 1, 
        y: player.playerData.pos.y 
      },
      w: 2,
      h: 4,
      vel: { x: 0, y: -120 },
      from: 'player',
      playerId: playerId
    });

    // Play shoot sound effect
    if (window.audioManager) {
      window.audioManager.playSound('shoot', 0.3, 0.4);
    }
  }

  private syncGameState(): void {
    if (!this.session.gameState) return;

    // Update game state with all player positions
    this.session.gameState.players = this.session.players.map(p => ({
      id: p.id,
      ...p.playerData
    }));

    // If this is the host, broadcast the game state
    if (this.session.isHost) {
      PlayroomKit.setState('gameState', this.session.gameState);
    } else {
      // Non-host players receive the game state
      const hostGameState = PlayroomKit.getState('gameState');
      if (hostGameState && hostGameState !== this.session.gameState) {
        this.session.gameState = hostGameState;
        if (this.callbacks.onGameStateUpdate) {
          this.callbacks.onGameStateUpdate(hostGameState);
        }
      }
    }
  }

  setGameState(gameState: GameState): void {
    this.session.gameState = gameState;
  }

  getGameState(): GameState | null {
    return this.session.gameState;
  }

  getPlayers(): MultiplayerPlayer[] {
    return this.session.players;
  }

  getCurrentPlayerId(): string | null {
    return this.session.currentPlayerId;
  }

  isHost(): boolean {
    return this.session.isHost;
  }

  setCallbacks(callbacks: {
    onGameStateUpdate?: (gameState: GameState) => void;
    onPlayerJoin?: (playerId: string) => void;
    onPlayerLeave?: (playerId: string) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  softRestart(): void {
    if (this.session.animationFrame) {
      cancelAnimationFrame(this.session.animationFrame);
      this.session.animationFrame = null;
    }
    
    setTimeout(() => {
      if (this.session.isInitialized) {
        this.startGameLoop();
      }
    }, 100);
  }

  cleanup(): void {
    console.log('Multiplayer session: Full cleanup');
    this.session.isInitialized = false;
    
    if (this.session.animationFrame) {
      cancelAnimationFrame(this.session.animationFrame);
      this.session.animationFrame = null;
    }
    
    this.session.players = [];
    this.session.currentPlayerId = null;
    this.session.gameState = null;
    this.callbacks = {};
  }

  isReady(): boolean {
    return this.session.isInitialized && this.session.currentPlayerId !== null;
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.session.isInitialized;
  }
}

// Global singleton instance
export const multiplayerSession = new MultiplayerSessionManager();
