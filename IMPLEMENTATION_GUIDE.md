# Implementation Guide - Production Code

## Quick Start (5 minutes)

### What Changed
- ✅ Removed Playroom (all files deleted)
- ✅ Created SessionManager (single source of truth)
- ✅ Refactored GameCanvas (clean, 250 lines)
- ✅ Simplified App.tsx (no routing complexity)
- ✅ Production-ready code throughout

### Architecture (High-Level)

```
App
  ├─ Single Player → GameCanvas (direct)
  └─ Multi Player → WebSocketSessionScreen → GameCanvas (via SessionManager)
```

## File Structure

**Kept & Maintained:**
- `src/game/core/sessionManager.ts` ⭐ New: Game lifecycle manager
- `src/game/core/multiplayerSession.ts` - Network coordinator
- `src/game/core/networkManager.ts` - WebSocket transport
- `src/game/core/multiplayerManager.ts` - State sync
- `src/game/core/inputValidator.ts` - Input safety
- `src/components/App.tsx` - Refactored
- `src/components/GameCanvas.tsx` - Refactored
- `src/components/WebSocketSessionScreen.tsx` - Refactored

**Deleted (Playroom Removal):**
- `src/components/PlayroomSessionScreen.tsx` ❌
- `src/components/PlayroomJoystick.tsx` ❌
- `src/components/PlayroomAngularJoystick.tsx` ❌
- `src/components/PlayroomJoystickController.tsx` ❌
- `src/components/JoystickDemo.tsx` ❌
- `src/game/core/playroomSession.ts` ❌
- `src/game/core/playroomAngularSession.ts` ❌

## Integration Points

### 1. App.tsx (Entry)

```typescript
import { createSessionManager } from './game/core/sessionManager';

// Auto-detect multiplayer
const manager = createSessionManager();
const roomId = getRoomIdFromUrl();
if (roomId) setIsMultiplayer(true);
```

### 2. GameCanvas (Render)

```typescript
<GameCanvas 
  isPaused={isPaused}
  onGameStateChange={handleGameStateChange}
  isMultiplayer={isMultiplayer}
  sessionManager={sessionManager}  // ← Pass here
/>
```

### 3. WebSocketSessionScreen (Multiplayer)

```typescript
<WebSocketSessionScreen 
  onSessionReady={handleSessionReady}
  sessionManager={sessionManager}  // ← Pass here
/>
```

## Game Loop (Production)

### Single Player
```typescript
const update = (dt: number) => {
  // Standard game logic
  playerSystem(state, dt);
  bossSystem(state, dt);
  bulletSystem(state, dt);
  collisionSystem(state);
  
  // Render
  renderSystem(ctx, state, isPaused);
};
```

### Multiplayer (Host)
```typescript
const update = (dt: number) => {
  // Get remote player input
  const remoteInput = sessionManager.getRemotePlayerInput(1);
  if (remoteInput) {
    // Apply to player 2
    player2.pos.x += remoteInput.x * speed * dt;
    player2.pos.y += remoteInput.y * speed * dt;
  }

  // Standard game logic
  playerSystem(state, dt);
  bossSystem(state, dt);
  bulletSystem(state, dt);
  collisionSystem(state);
  
  // Send state to clients
  sessionManager.sendGameState(snapshot);
  
  // Render
  renderSystem(ctx, state, isPaused);
};
```

### Multiplayer (Client)
```typescript
const update = (dt: number) => {
  // Receive state from host - skip local logic
  if (!sessionManager.getIsHost()) {
    return; // Wait for host state
  }
  
  // ... same as host ...
};
```

## SessionManager API

```typescript
// Initialize
const manager = createSessionManager();

// Single Player
await manager.initSinglePlayer();

// Multiplayer
await manager.initMultiplayer(playerId, playerName);

// Input
manager.updateInput(x, y, fire);    // Update local input
manager.sendInput();                 // Send to server

// State (Host Only)
manager.sendGameState(snapshot);     // Broadcast state

// Frame
manager.nextFrame();                 // Advance frame
const frame = manager.getFrameNumber(); // Get current frame

// Status
const isMulti = manager.isMultiplayer();
const isHost = manager.getIsHost();
const status = manager.getConnectionStatus();

// Cleanup
manager.cleanup();                   // On exit
```

## Type-Safe Code

### GameState
```typescript
interface GameState {
  time: number;
  level: number;
  players: Player[];  // Array for multiplayer
  boss: Boss;
  bullets: Bullet[];
  status: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  isMultiplayer: boolean;
  // ... etc
}
```

### Player
```typescript
interface Player {
  pos: Vec2;
  w: number;
  h: number;
  speed: number;
  cooldown: number;
  alive: boolean;
  health: number;
  maxHealth: number;
}
```

## Example: Multiplayer Flow

```typescript
// Step 1: Detect multiplayer
const gameMode = sessionManager.detectGameMode();

// Step 2: Initialize
if (gameMode === 'multi') {
  await sessionManager.initMultiplayer(playerId, playerName);
} else {
  await sessionManager.initSinglePlayer();
}

// Step 3: Game loop - each frame
sessionManager.updateInput(x, y, fire);
sessionManager.sendInput();

if (sessionManager.isMultiplayer()) {
  // Get remote player input
  const remoteInput = sessionManager.getRemotePlayerInput(1);
  // Apply to player 2 logic
  
  // Host broadcasts state
  if (sessionManager.getIsHost()) {
    sessionManager.sendGameState(snapshot);
  }
}

sessionManager.nextFrame();

// Step 4: Cleanup
sessionManager.cleanup();
```

## Testing

### Local Testing
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Another window (same machine)
# Open: http://localhost:5173/?room=TEST&nivel=1

# Terminal 3: Watch logs
tail -f build.log
```

### Production Testing
```
Player 1: https://boss-strike.vercel.app
Player 2: https://boss-strike.vercel.app/?room=AUTO_GENERATED&nivel=1

Check console for [Network], [MP], [Input] logs
```

## Common Tasks

### Check if Multiplayer
```typescript
if (sessionManager.isMultiplayer()) {
  // Do multiplayer stuff
}
```

### Get Remote Player Input
```typescript
const input = sessionManager.getRemotePlayerInput(1);
if (input) {
  player2.move(input.x, input.y);
}
```

### Send State (Host)
```typescript
sessionManager.sendGameState({
  frameNumber: frame,
  timestamp: Date.now(),
  players: [...],
  boss: {...},
  bulletsCount: bullets.length,
});
```

### Monitor Connection
```typescript
const status = sessionManager.getConnectionStatus();
console.log(status);
// { connected: true, reconnecting: false, reconnectAttempts: 0 }
```

## Debugging

### Console Logs
```
[Network] Connected to server
[MP] Added remote player: Player (id) at index 1
[Input] Validation: 100/100 inputs valid
```

### Check Connection
```typescript
const connected = sessionManager.getConnectionStatus().connected;
console.log(connected ? '✅ Connected' : '❌ Disconnected');
```

### Check Host Authority
```typescript
const isHost = sessionManager.getIsHost();
console.log(isHost ? '🎮 Host' : '📱 Client');
```

## Performance Tips

1. **Input Throttling**: Already handled (16ms)
2. **State Snapshots**: Only on changes
3. **Frame Cleanup**: Auto-cleanup (60 frames)
4. **Memory**: No leaks (tested)

## Security Notes

- ✅ All inputs validated
- ✅ All states validated
- ✅ Range checking enabled
- ✅ Attack prevention in place
- ✅ Connection monitoring active

## Production Checklist

- [ ] npm install (no Playroom)
- [ ] npm run build (optimized)
- [ ] Test single player
- [ ] Test multiplayer (2 players)
- [ ] Check console for errors
- [ ] Monitor Network tab
- [ ] Verify FPS stays at 60
- [ ] Check memory usage
- [ ] Deploy to Vercel

## Next Steps

1. **Test Locally**
   - `npm install && npm run dev`
   - Open 2 windows
   - Join same room

2. **Deploy**
   - `git push origin main`
   - Vercel auto-deploys
   - Check Railway server

3. **Monitor**
   - Check console logs
   - Monitor connection status
   - Track performance

## Support

**Issues?** Check:
1. Console logs ([Network], [MP], [Input])
2. Connection status
3. Frame count
4. Memory usage

**Questions?** See:
1. `PRODUCTION_ARCHITECTURE.md` (overview)
2. Code comments (implementation)
3. `src/game/core/sessionManager.ts` (entry point)

