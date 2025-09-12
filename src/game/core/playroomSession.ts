import * as PlayroomKit from 'playroomkit';

// Debug flag - set to true to enable logs for debugging
const DEBUG_LOGS = true;

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
      console.log('🎮 PlayroomSession: Starting initialization...');
      
      // Ensure PlayroomKit is loaded
      const kit = await ensurePlayroomKitLoaded();
      console.log('🎮 PlayroomSession: PlayroomKit loaded successfully');
    
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

      console.log('🎮 PlayroomSession: All required methods available');
      this.connectionStatus = 'connecting';

      // Make PlayroomKit available globally for debugging
      (window as any).PlayroomKit = kit;
      console.log('🎮 PlayroomSession: PlayroomKit exposed to window');

      // Custom avatars for the game
      const avatars = [
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YWRlODAiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAgMjUuMzcyIDM0IDMyIDM0UzQ0IDQwIDQ0IDQ4IiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPgo=',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNmZjZiNmIiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAgMjUuMzcyIDM0IDMyIDM0UzQ0IDQwIDQ0IDQ4IiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPgo=',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM2MzY2ZjEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAgMjUuMzcyIDM0IDMyIDM0UzQ0IDQwIDQ0IDQ4IiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPgo=',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNmYmJjMDUiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAgMjUuMzcyIDM0IDMyIDM0UzQ0IDQwIDQ0IDQ4IiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPgo='
      ];

      // Start the game with lobby UI for multiplayer
      console.log('🎮 PlayroomSession: Starting insertCoin with lobby...');
      await kit.insertCoin({
        streamMode: true,
        allowGamepads: true,
        avatars, // Custom avatars for the lobby
        // Ensure lobby is shown
        skipLobby: false
      });
      console.log('🎮 PlayroomSession: insertCoin completed, lobby should be visible');
      
      // Check if lobby was created
      setTimeout(() => {
        const lobbyElements = document.querySelectorAll('*');
        const hasLobby = Array.from(lobbyElements).some(el => {
          const className = el.className?.toString() || '';
          const id = el.id || '';
          return className.includes('playroom') || 
                 className.includes('lobby') || 
                 className.includes('room') ||
                 id.includes('playroom');
        });
        console.log('🎮 PlayroomSession: Lobby check result:', hasLobby);
        
        if (!hasLobby) {
          console.warn('🎮 PlayroomSession: No lobby elements found, this might be an issue');
        }
      }, 2000);

    // Create a joystick controller for each joining player
    kit.onPlayerJoin((state) => {
      try {
        console.log(`🎮 PlayroomSession: Player joined! Total players: ${this.session.players.length + 1}`);
        
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
        
        console.log(`🎮 PlayroomSession: Player added! Total players now: ${this.session.players.length}`);
      } catch (error) {
        console.error('Error creating joystick:', error);
      }
    });

    this.session.isInitialized = true;
    this.connectionStatus = 'connected';
    this.startGameLoop();
    
    // Expose session to window for GameCanvas to check
    (window as any).playroomSession = this;
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

  getPlayerCount(): number {
    const count = this.session.players.length;
    console.log(`🎮 PlayroomSession: Player count = ${count}`);
    console.log(`🎮 PlayroomSession: Session initialized = ${this.session.isInitialized}`);
    console.log(`🎮 PlayroomSession: Connection status = ${this.connectionStatus}`);
    return count;
  }

  getRoomCode(): string | null {
    try {
      // Try to get room code from Playroom
      const kit = (window as any).PlayroomKit;
      if (kit && kit.getRoomCode) {
        return kit.getRoomCode();
      }
      return null;
    } catch (error) {
      console.error('Error getting room code:', error);
      return null;
    }
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

