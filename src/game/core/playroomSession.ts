import * as PlayroomKit from 'playroomkit';
import { emitSubtleLog } from '../../components/SubtleLogger';

interface PlayroomSession {
  isInitialized: boolean;
  players: Array<{ state: any; joystick: PlayroomKit.Joystick }>;
  currentPlayerJoystick: PlayroomKit.Joystick | null;
  animationFrame: number | null;
}

class PlayroomSessionManager {
  private session: PlayroomSession = {
    isInitialized: false,
    players: [],
    currentPlayerJoystick: null,
    animationFrame: null
  };

  private callbacks: {
    onMove?: (x: number, y: number) => void;
    onFire?: () => void;
  } = {};

  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  async initialize(): Promise<void> {
    if (this.session.isInitialized) {
      console.log('Playroom session already initialized');
      return;
    }

    this.connectionStatus = 'connecting';

    try {
      // Start the game
      await PlayroomKit.insertCoin();
      console.log('Playroom session initialized successfully');

      // Create a joystick controller for each joining player
      PlayroomKit.onPlayerJoin((state) => {
        console.log('Player joined:', state);
        
        // Joystick will only create UI for current player (myPlayer)
        // For others, it will only sync their state
        const joystick = new PlayroomKit.Joystick(state, {
          type: "dpad",
          buttons: [
            { id: "fire", label: "Fire" }
          ],
          keyboard: true, // Enable W,A,S and D keys which controls joystick
          size: 120, // Custom size for the joystick
          deadzone: 0.05 // Smaller deadzone for more responsive movement
        });
        
        this.session.players.push({ state, joystick });
        
        // Store reference to current player's joystick
        if (state === PlayroomKit.myPlayer()) {
          this.session.currentPlayerJoystick = joystick;
          console.log('Current player joystick created');
        }
      });

      this.session.isInitialized = true;
      this.connectionStatus = 'connected';
      this.startGameLoop();
    } catch (error) {
      console.error('Failed to initialize Playroom session:', error);
      this.connectionStatus = 'disconnected';
      throw error; // Re-throw to let caller handle the error
    }
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (this.session.currentPlayerJoystick && this.session.isInitialized) {
        const joystick = this.session.currentPlayerJoystick;
        
        // Update player position based on joystick state
        const dpad = joystick.dpad();
        
        // Convert D-Pad to continuous X/Y values for simultaneous movement
        let x = 0;
        let y = 0;
        
        if (dpad.x === "left") x = -1;
        else if (dpad.x === "right") x = 1;
        
        if (dpad.y === "up") y = -1;
        else if (dpad.y === "down") y = 1;
        
        // Use the continuous joystick handler for smooth simultaneous movement
        if (window.handleJoystickMove) {
          window.handleJoystickMove(x, y);
        }
        
        // Only log when there's actual movement
        if (x !== 0 || y !== 0) {
          const direction = dpad.x && dpad.y ? `${dpad.x}+${dpad.y}` : (dpad.x || dpad.y || 'unknown');
          // emitSubtleLog(direction, 'move');
        }
        
        // Check if fire button is pressed
        if (joystick.isPressed("fire")) {
          // emitSubtleLog('🔥', 'fire');
          if (this.callbacks.onFire) {
            this.callbacks.onFire();
          }
        }
      }
      
      if (this.session.isInitialized) {
        this.session.animationFrame = requestAnimationFrame(gameLoop);
      }
    };
    
    this.session.animationFrame = requestAnimationFrame(gameLoop);
  }

  setCallbacks(callbacks: { onMove?: (x: number, y: number) => void; onFire?: () => void }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Soft restart - only restart the game loop, keep Playroom session
  softRestart(): void {
    // emitSubtleLog('↻', 'system');
    
    // Stop current game loop
    if (this.session.animationFrame) {
      cancelAnimationFrame(this.session.animationFrame);
      this.session.animationFrame = null;
    }
    
    // Restart game loop after a short delay
    setTimeout(() => {
      if (this.session.isInitialized) {
        this.startGameLoop();
      }
    }, 100);
  }

  // Full cleanup - only when component unmounts
  cleanup(): void {
    console.log('Playroom session: Full cleanup');
    this.session.isInitialized = false;
    
    if (this.session.animationFrame) {
      cancelAnimationFrame(this.session.animationFrame);
      this.session.animationFrame = null;
    }
    
    this.session.currentPlayerJoystick = null;
    this.session.players = [];
    this.callbacks = {};
  }

  isReady(): boolean {
    return this.session.isInitialized && this.session.currentPlayerJoystick !== null;
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.session.isInitialized;
  }
}

// Global singleton instance
export const playroomSession = new PlayroomSessionManager();
