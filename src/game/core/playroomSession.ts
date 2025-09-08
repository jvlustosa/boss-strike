import * as PlayroomKit from 'playroomkit';

// Debug flag - set to false to disable logs in production
const DEBUG_LOGS = false;

// Function to ensure PlayroomKit is loaded
async function ensurePlayroomKitLoaded(): Promise<typeof PlayroomKit> {
  if (PlayroomKit && typeof PlayroomKit.insertCoin === 'function') {
    if (DEBUG_LOGS) {
      console.log('🎮 playroomSession: PlayroomKit is already loaded');
    }
    return PlayroomKit;
  }
  
  if (DEBUG_LOGS) {
    console.log('🎮 playroomSession: PlayroomKit not loaded, attempting dynamic import...');
  }
  try {
    const dynamicPlayroomKit = await import('playroomkit');
    if (DEBUG_LOGS) {
      console.log('🎮 playroomSession: Dynamic import successful');
    }
    return dynamicPlayroomKit;
  } catch (error) {
    console.error('🎮 playroomSession: Dynamic import failed:', error);
    throw new Error('Failed to load PlayroomKit');
  }
}

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
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // If already initialized, return immediately
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
      // Ensure PlayroomKit is loaded
      const kit = await ensurePlayroomKitLoaded();
    
      // Check if required methods are available
      if (typeof kit.insertCoin !== 'function') {
        throw new Error('PlayroomKit.insertCoin is not available');
      }
      
      if (typeof kit.onPlayerJoin !== 'function') {
        throw new Error('PlayroomKit.onPlayerJoin is not available');
      }
      
      if (typeof kit.Joystick !== 'function') {
        throw new Error('PlayroomKit.Joystick is not available');
      }

      this.connectionStatus = 'connecting';

      // Start the game
      await kit.insertCoin({
        streamMode: true,
        allowGamepads: true
      });

    // Create a joystick controller for each joining player
    kit.onPlayerJoin((state) => {
      try {
        // Joystick will only create UI for current player (myPlayer)
        // For others, it will only sync their state
        const joystick = new kit.Joystick(state, {
          type: "dpad",
          buttons: [
            { id: "fire", label: "Fire" }
          ],
          keyboard: true // Enable W,A,S and D keys which controls joystick
        });
        
        this.session.players.push({ state, joystick });
        
        // Store reference to current player's joystick
        if (state === kit.myPlayer()) {
          this.session.currentPlayerJoystick = joystick;
        }
      } catch (error) {
        console.error('Error creating joystick:', error);
      }
    });

    this.session.isInitialized = true;
    this.connectionStatus = 'connected';
    this.startGameLoop();
    } catch (error) {
      console.error('Failed to initialize Playroom session:', error);
      this.connectionStatus = 'disconnected';
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
        
        try {
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
          if ((window as any).handleJoystickMove) {
            (window as any).handleJoystickMove(x, y);
          }
          
          // Check if fire button is pressed
          if (joystick.isPressed("fire")) {
            if (this.callbacks.onFire) {
              this.callbacks.onFire();
            }
          }
        } catch (error) {
          console.error('Error in game loop:', error);
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

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.session.isInitialized;
  }

  isInitializing(): boolean {
    return this.initializationPromise !== null;
  }
}

// Global singleton instance
export const playroomSession = new PlayroomSessionManager();

