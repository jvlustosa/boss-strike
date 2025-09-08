import * as PlayroomKit from 'playroomkit';

interface PlayroomAngularSession {
  isInitialized: boolean;
  players: Array<{ state: any; joystick: PlayroomKit.Joystick }>;
  currentPlayerJoystick: PlayroomKit.Joystick | null;
  animationFrame: number | null;
}

// Helper function to convert radians to X, Y components (-1 to 1)
function radToXY(rad: number) {
  return {
    y: Math.cos(rad),
    x: Math.sin(rad)
  };
}

class PlayroomAngularSessionManager {
  private session: PlayroomAngularSession = {
    isInitialized: false,
    players: [],
    currentPlayerJoystick: null,
    animationFrame: null
  };

  private callbacks: {
    onMove?: (x: number, y: number) => void;
    onFire?: () => void;
  } = {};

  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.session.isInitialized) {
      return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // Start new initialization
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Start the game
      await PlayroomKit.insertCoin();

      // Create a joystick controller for each joining player
      PlayroomKit.onPlayerJoin((state) => {
        // Joystick will only create UI for current player (myPlayer)
        // For others, it will only sync their state
        const joystick = new PlayroomKit.Joystick(state, {
          type: "angular",
          buttons: [
            { id: "fire", label: "Fire" }
          ],
          keyboard: true // Enable W,A,S and D keys which controls joystick
        });
        
        this.session.players.push({ state, joystick });
        
        // Store reference to current player's joystick
        if (state === PlayroomKit.myPlayer()) {
          this.session.currentPlayerJoystick = joystick;
        }
      });

      this.session.isInitialized = true;
      this.startGameLoop();
    } catch (error) {
      console.error('Failed to initialize Playroom Angular session:', error);
      this.initializationPromise = null; // Reset promise on error
      throw error; // Re-throw to let caller handle the error
    } finally {
      this.initializationPromise = null; // Clear promise when done
    }
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (this.session.currentPlayerJoystick && this.session.isInitialized) {
        const joystick = this.session.currentPlayerJoystick;
        
        // Get angular joystick values
        const angle = joystick.angle();
        const magnitude = (joystick as any).magnitude();
        
        // Convert to X, Y components (-1 to 1)
        if (magnitude > 0.05) { // Smaller deadzone for more responsive movement
          const { x, y } = radToXY(angle);
          
          // Use the continuous joystick handler for smooth simultaneous movement
          if ((window as any).handleJoystickMove) {
            (window as any).handleJoystickMove(x, y);
          }
          
          // Only log when there's significant movement
          if (Math.abs(x) > 0.3 || Math.abs(y) > 0.3) {
            // Movement detected - could log here if needed
            // emitSubtleLog(combined, 'move');
          }
        } else {
          // No movement - clear all keys
          if ((window as any).handleJoystickMove) {
            (window as any).handleJoystickMove(0, 0);
          }
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
    
    // Restart game loop after a short delay to ensure proper cleanup
    setTimeout(() => {
      if (this.session.isInitialized) {
        this.startGameLoop();
      }
    }, 150); // Slightly increased delay for better stability
  }

  // Full cleanup - only when component unmounts
  cleanup(): void {
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

  isInitializing(): boolean {
    return this.initializationPromise !== null;
  }
}

// Global singleton instance
export const playroomAngularSession = new PlayroomAngularSessionManager();
