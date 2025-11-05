# Multiplayer Migration Guide

## Overview
This guide explains how to migrate from the old `websocketSession` to the new production-grade multiplayer infrastructure.

## Old vs New Architecture

### Old System
```typescript
// Simple, direct WebSocket usage
const websocketSession = new WebSocketSessionManager(url);
await websocketSession.connect(roomId);
websocketSession.sendInput(input);
```

**Issues:**
- No input validation
- No state validation
- Limited error handling
- Basic reconnection
- No frame sync

### New System
```typescript
// Production-grade, layered architecture
const session = new MultiplayerSession(url, roomId, playerId, isHost);
await session.initialize();

session.updateLocalInput(x, y, fire);
session.sendInputToServer();

if (isHost) {
  session.sendGameStateSnapshot(snapshot);
}

session.nextFrame();
```

**Benefits:**
- ✅ Full input validation
- ✅ State snapshot validation
- ✅ Robust error handling
- ✅ Advanced reconnection
- ✅ Frame synchronization
- ✅ Latency tracking
- ✅ Production-ready logging

## Migration Steps

### Step 1: Keep WebSocketSessionManager (Deprecate Later)
The old `websocketSession` is still available but should not be used for new multiplayer code.

### Step 2: Update GameCanvas to Use MultiplayerSession

**Before:**
```typescript
if (isMultiplayer && websocketSession.isConnected()) {
  // Old system
  const keys = state.keys;
  const input = {
    x: (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0),
    y: (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0),
    fire: keys[' '] || false
  };
  websocketSession.sendInput(input);
}
```

**After:**
```typescript
if (isMultiplayer && mpSession) {
  // Update input from keyboard
  const keys = state.keys;
  const x = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
  const y = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
  const fire = keys[' '] || keys['space'] || false;

  mpSession.updateLocalInput(x, y, fire);
  mpSession.sendInputToServer();
  mpSession.nextFrame();
}
```

### Step 3: Update WebSocketSessionScreen

**Before:**
```typescript
await websocketSession.connect(finalRoomId, null);

websocketSession.setCallbacks({
  onJoin: (roomId, playerId, isHost) => { ... },
  onPlayerJoined: (playerId, playerName, count) => { ... },
});
```

**After:**
```typescript
const mpSession = createMultiplayerSession(
  serverUrl,
  finalRoomId,
  playerId,
  isHost
);
await mpSession.initialize();

// Callbacks are handled internally
```

### Step 4: Update State Application (Non-Host)

**Before:**
```typescript
websocketSession.setCallbacks({
  onGameStateUpdate: (gameState) => {
    if (!isHost) {
      Object.assign(state, gameState);
    }
  }
});
```

**After:**
```typescript
// Host sends via:
mpSession.sendGameStateSnapshot({
  frameNumber,
  timestamp: Date.now(),
  players: [...],
  boss: {...},
  bulletsCount: bullets.length
});

// Clients receive via network callbacks and apply snapshot
```

## API Comparison

### Input Handling

**Old:**
```typescript
const input = { x, y, fire };
websocketSession.sendInput(input);
```

**New:**
```typescript
session.updateLocalInput(x, y, fire);
session.sendInputToServer();
```

### Player Management

**Old:**
```typescript
const playerCount = websocketSession.getPlayerCount();
```

**New:**
```typescript
const players = session.getRemotePlayers();
const playerCount = players.length + 1; // +1 for self
```

### Connection Status

**Old:**
```typescript
if (websocketSession.isConnected()) { ... }
```

**New:**
```typescript
if (session.getIsConnected()) { ... }
const status = session.getConnectionStatus();
```

### Frame Control

**Old:**
```typescript
// No explicit frame control
```

**New:**
```typescript
session.nextFrame(); // Call once per game frame
const frameNumber = session.getFrameNumber();
```

## Best Practices

### 1. Always Validate Input
```typescript
// Good
session.updateLocalInput(x, y, fire);
session.sendInputToServer();

// Bad - unvalidated input
ws.send(JSON.stringify(anyInput));
```

### 2. Validate State Before Applying
```typescript
// Good
if (mpManager.validateStateSnapshot(snapshot)) {
  applyState(snapshot);
}

// Bad - apply any state
applyState(receivedData);
```

### 3. Handle Disconnections
```typescript
const status = session.getConnectionStatus();
if (!status.connected && status.reconnecting) {
  // Show "Reconnecting..." UI
}
```

### 4. Monitor Latency
```typescript
const players = session.getRemotePlayers();
for (const player of players) {
  console.log(`${player.name}: ${player.latency}ms`);
}
```

### 5. Use Frame Numbers
```typescript
// Good - explicit frame tracking
const frame = session.getFrameNumber();
mpManager.recordInput(playerId, input, frame);

// Bad - relying on time
const time = Date.now();
```

## Debugging

### Enable Detailed Logging
```typescript
// Check console for [Network], [MP], [Input] tags
// Production: Filter to warnings/errors only
```

### Monitor Connection
```typescript
const status = session.getConnectionStatus();
console.log(JSON.stringify(status, null, 2));
```

### Check Input Validation
```typescript
if (validator.hasTooManyInvalidInputs()) {
  console.warn('Too many invalid inputs - possible attack');
}
```

### Verify State Snapshots
```typescript
if (!mpManager.validateStateSnapshot(snapshot)) {
  console.warn('Invalid state snapshot rejected');
}
```

## Rollback Plan

If you need to revert to the old system:

1. The old `websocketSession` is still available
2. No code has been removed, only deprecated
3. Create a feature flag if needed:
   ```typescript
   const useNewMultiplayer = import.meta.env.VITE_USE_NEW_MULTIPLAYER === 'true';
   if (useNewMultiplayer) {
     // Use MultiplayerSession
   } else {
     // Use websocketSession
   }
   ```

## Timeline

- **Phase 1** (Current): New infrastructure in place, old system still active
- **Phase 2** (v1.1): Migrate GameCanvas to use new system
- **Phase 3** (v1.2): Remove old websocketSession (deprecated)
- **Phase 4** (v2.0): Full cleanup, new system only

## Testing Checklist

- [ ] Connection established
- [ ] Input received by remote player
- [ ] State synchronized
- [ ] Reconnection works
- [ ] Latency tracking accurate
- [ ] No memory leaks
- [ ] Error handling graceful
- [ ] Performance acceptable

## Support

Issues? Check:
1. `MULTIPLAYER_ARCHITECTURE.md` for detailed docs
2. Console logs (`[Network]`, `[MP]`, `[Input]` tags)
3. Connection status: `session.getConnectionStatus()`
4. Player list: `session.getRemotePlayers()`

