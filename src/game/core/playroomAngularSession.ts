import * as PlayroomKit from 'playroomkit';
import { emitSubtleLog } from '../../components/SubtleLogger';

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

  async initialize(): Promise<void> {
    if (this.session.isInitialized) {
      console.log('Playroom Angular session already initialized');
      return;
    }

    try {
      // Start the game
      await PlayroomKit.insertCoin();
      console.log('Playroom Angular session initialized successfully');

      // Create a joystick controller for each joining player
      PlayroomKit.onPlayerJoin((state) => {
        console.log('Player joined:', state);
        
        // Joystick will only create UI for current player (myPlayer)
        // For others, it will only sync their state
        const joystick = new PlayroomKit.Joystick(state, {
          type: "angular",
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
          console.log('Current player angular joystick created');
        }
      });

      this.session.isInitialized = true;
      this.startGameLoop();
    } catch (error) {
      console.error('Failed to initialize Playroom Angular session:', error);
    }
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (this.session.currentPlayerJoystick && this.session.isInitialized) {
        const joystick = this.session.currentPlayerJoystick;
        
        // Get angular joystick values
        const angle = joystick.angle();
        const magnitude = joystick.magnitude();
        
        // Convert to X, Y components (-1 to 1)
        if (magnitude > 0.05) { // Smaller deadzone for more responsive movement
          const { x, y } = radToXY(angle);
          
          // Use the continuous joystick handler for smooth simultaneous movement
          if (window.handleJoystickMove) {
            window.handleJoystickMove(x, y);
          }
          
          // Only log when there's significant movement
          if (Math.abs(x) > 0.3 || Math.abs(y) > 0.3) {
            const direction = x > 0.3 ? 'right' : x < -0.3 ? 'left' : '';
            const vertical = y > 0.3 ? 'down' : y < -0.3 ? 'up' : '';
            const combined = [direction, vertical].filter(Boolean).join('+') || 'center';
            // emitSubtleLog(combined, 'move');
          }
        } else {
          // No movement - clear all keys
          if (window.handleJoystickMove) {
            window.handleJoystickMove(0, 0);
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
    
    // Restart game loop after a short delay
    setTimeout(() => {
      if (this.session.isInitialized) {
        this.startGameLoop();
      }
    }, 100);
  }

  // Full cleanup - only when component unmounts
  cleanup(): void {
    console.log('Playroom Angular session: Full cleanup');
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
}

// Global singleton instance
export const playroomAngularSession = new PlayroomAngularSessionManager();
