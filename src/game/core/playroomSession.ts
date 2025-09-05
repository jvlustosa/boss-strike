import * as PlayroomKit from 'playroomkit';
import { emitSubtleLog } from '../../components/SubtleLogger';

// Debug flag - set to false to disable logs in production
const DEBUG_LOGS = false;

// Debug PlayroomKit import (only in development)
if (DEBUG_LOGS) {
  console.log('🎮 playroomSession: PlayroomKit import check:', {
    PlayroomKit: typeof PlayroomKit,
    hasInsertCoin: typeof PlayroomKit?.insertCoin,
    hasOnPlayerJoin: typeof PlayroomKit?.onPlayerJoin,
    hasJoystick: typeof PlayroomKit?.Joystick,
    hasMyPlayer: typeof PlayroomKit?.myPlayer,
    keys: PlayroomKit ? Object.keys(PlayroomKit) : 'undefined'
  });
}

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

  async initialize(): Promise<void> {
    if (DEBUG_LOGS) {
      console.log('🎮 playroomSession: initialize() called');
    }
    if (this.session.isInitialized) {
      if (DEBUG_LOGS) {
        console.log('🎮 playroomSession: Already initialized, returning');
      }
      return;
    }

    // Ensure PlayroomKit is loaded
    const kit = await ensurePlayroomKitLoaded();
    
    if (DEBUG_LOGS) {
      console.log('🎮 playroomSession: PlayroomKit is available:', typeof kit);
      console.log('🎮 playroomSession: PlayroomKit methods:', Object.keys(kit));
    }
    
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
      if (DEBUG_LOGS) {
        console.log('🎮 playroomSession: Calling kit.insertCoin()...');
      }
      
      await kit.insertCoin({
        streamMode: true,
        allowGamepads: true
      });
      
      if (DEBUG_LOGS) {
        console.log('🎮 playroomSession: kit.insertCoin() completed successfully');
      }

      // Create a joystick controller for each joining player
      kit.onPlayerJoin((state) => {
        if (DEBUG_LOGS) {
          console.log('🎮 playroomSession: Player joined:', state);
        }
        
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
          
          this.session.players.push({ state, joystick });
          
          // Store reference to current player's joystick
          if (state === kit.myPlayer()) {
            this.session.currentPlayerJoystick = joystick;
            if (DEBUG_LOGS) {
              console.log('🎮 playroomSession: Current player joystick created and stored');
            }
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
          
          // Check if fire button is pressed
          if (joystick.isPressed("fire")) {
            if (this.callbacks.onFire) {
              this.callbacks.onFire();
            }
          }
        } catch (error) {
          console.error('🎮 playroomSession: Error in game loop:', error);
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
