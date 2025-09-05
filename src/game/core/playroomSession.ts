import * as PlayroomKit from 'playroomkit';
import { emitSubtleLog } from '../../components/SubtleLogger';

// Debug PlayroomKit import
console.log('🎮 playroomSession: PlayroomKit import check:', {
  PlayroomKit: typeof PlayroomKit,
  hasInsertCoin: typeof PlayroomKit?.insertCoin,
  hasOnPlayerJoin: typeof PlayroomKit?.onPlayerJoin,
  hasJoystick: typeof PlayroomKit?.Joystick,
  hasMyPlayer: typeof PlayroomKit?.myPlayer,
  keys: PlayroomKit ? Object.keys(PlayroomKit) : 'undefined'
});

// Function to ensure PlayroomKit is loaded
async function ensurePlayroomKitLoaded(): Promise<typeof PlayroomKit> {
  if (PlayroomKit && typeof PlayroomKit.insertCoin === 'function') {
    console.log('🎮 playroomSession: PlayroomKit is already loaded');
    return PlayroomKit;
  }
  
  console.log('🎮 playroomSession: PlayroomKit not loaded, attempting dynamic import...');
  try {
    const dynamicPlayroomKit = await import('playroomkit');
    console.log('🎮 playroomSession: Dynamic import successful:', {
      PlayroomKit: typeof dynamicPlayroomKit,
      hasInsertCoin: typeof dynamicPlayroomKit?.insertCoin,
      hasOnPlayerJoin: typeof dynamicPlayroomKit?.onPlayerJoin,
      hasJoystick: typeof dynamicPlayroomKit?.Joystick,
      hasMyPlayer: typeof dynamicPlayroomKit?.myPlayer,
      keys: dynamicPlayroomKit ? Object.keys(dynamicPlayroomKit) : 'undefined'
    });
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

  async initialize(): Promise<void> {
    console.log('🎮 playroomSession: initialize() called');
    if (this.session.isInitialized) {
      console.log('🎮 playroomSession: Already initialized, returning');
      return;
    }

    // Ensure PlayroomKit is loaded
    const kit = await ensurePlayroomKitLoaded();
    
    console.log('🎮 playroomSession: PlayroomKit is available:', typeof kit);
    console.log('🎮 playroomSession: PlayroomKit methods:', Object.keys(kit));
    console.log('🎮 playroomSession: PlayroomKit.insertCoin type:', typeof kit.insertCoin);
    console.log('🎮 playroomSession: PlayroomKit.onPlayerJoin type:', typeof kit.onPlayerJoin);
    console.log('🎮 playroomSession: PlayroomKit.Joystick type:', typeof kit.Joystick);
    console.log('🎮 playroomSession: PlayroomKit.myPlayer type:', typeof kit.myPlayer);
    
    // Check if required methods are available
    if (typeof kit.insertCoin !== 'function') {
      console.error('🎮 playroomSession: PlayroomKit.insertCoin is not a function!');
      throw new Error('PlayroomKit.insertCoin is not available');
    }
    
    if (typeof kit.onPlayerJoin !== 'function') {
      console.error('🎮 playroomSession: PlayroomKit.onPlayerJoin is not a function!');
      throw new Error('PlayroomKit.onPlayerJoin is not available');
    }
    
    if (typeof kit.Joystick !== 'function') {
      console.error('🎮 playroomSession: PlayroomKit.Joystick is not a function!');
      throw new Error('PlayroomKit.Joystick is not available');
    }

    this.connectionStatus = 'connecting';
    console.log('🎮 playroomSession: Starting connection...');

    try {
      // Start the game
      console.log('🎮 playroomSession: Calling kit.insertCoin()...');
      console.log('🎮 playroomSession: Before insertCoin - kit state:', {
        insertCoin: typeof kit.insertCoin,
        onPlayerJoin: typeof kit.onPlayerJoin,
        Joystick: typeof kit.Joystick,
        myPlayer: typeof kit.myPlayer
      });
      
      await kit.insertCoin({
        streamMode: true,
        allowGamepads: true
      });
      console.log('🎮 playroomSession: kit.insertCoin() completed successfully');
      
      console.log('🎮 playroomSession: After insertCoin - kit state:', {
        insertCoin: typeof kit.insertCoin,
        onPlayerJoin: typeof kit.onPlayerJoin,
        Joystick: typeof kit.Joystick,
        myPlayer: typeof kit.myPlayer
      });

      // Create a joystick controller for each joining player
      kit.onPlayerJoin((state) => {
        console.log('🎮 playroomSession: Player joined:', state);
        console.log('🎮 playroomSession: My player:', kit.myPlayer());
        console.log('🎮 playroomSession: Is current player:', state === kit.myPlayer());
        
        try {
          // Joystick will only create UI for current player (myPlayer)
          // For others, it will only sync their state
          const joystick = new kit.Joystick(state, {
            type: "dpad",
            buttons: [
              { id: "fire", label: "Fire" }
            ],
            keyboard: true, // Enable W,A,S and D keys which controls joystick
            size: 120, // Custom size for the joystick
            deadzone: 0.05, // Smaller deadzone for more responsive movement
            position: "bottom-left", // Explicit position
            opacity: 0.8 // Make it slightly transparent
          });
          
          console.log('🎮 playroomSession: Joystick created successfully:', joystick);
          
          this.session.players.push({ state, joystick });
          
          // Store reference to current player's joystick
          if (state === kit.myPlayer()) {
            this.session.currentPlayerJoystick = joystick;
            console.log('🎮 playroomSession: Current player joystick created and stored');
          }
        } catch (error) {
          console.error('🎮 playroomSession: Error creating joystick:', error);
        }
      });

      this.session.isInitialized = true;
      this.connectionStatus = 'connected';
      this.startGameLoop();
    } catch (error) {
      console.error('🎮 playroomSession: Failed to initialize Playroom session:', error);
      console.error('🎮 playroomSession: Error details:', error.message, error.stack);
      this.connectionStatus = 'disconnected';
      throw error; // Re-throw to let caller handle the error
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
          if (window.handleJoystickMove) {
            window.handleJoystickMove(x, y);
          }
          
          // Only log when there's actual movement
          if (x !== 0 || y !== 0) {
            const direction = dpad.x && dpad.y ? `${dpad.x}+${dpad.y}` : (dpad.x || dpad.y || 'unknown');
            console.log('🎮 playroomSession: Joystick movement:', direction, 'x:', x, 'y:', y);
          }
          
          // Check if fire button is pressed
          if (joystick.isPressed("fire")) {
            console.log('🎮 playroomSession: Fire button pressed');
            if (this.callbacks.onFire) {
              this.callbacks.onFire();
            }
          }
        } catch (error) {
          console.error('🎮 playroomSession: Error in game loop:', error);
        }
      } else {
        // Log when joystick is not available
        if (this.session.isInitialized && !this.session.currentPlayerJoystick) {
          console.log('🎮 playroomSession: Game loop running but no joystick available');
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
