# Multiplayer Quick Start Guide

## 5-Minute Overview

### What Was Built

Complete production-grade multiplayer infrastructure:

```
✅ NetworkManager      - WebSocket with reconnection
✅ MultiplayerManager  - State sync & player tracking
✅ InputValidator      - Input validation & sanitization
✅ MultiplayerSession  - Coordinator
✅ Full Documentation  - Architecture & migration
```

### Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| Input Validation | ❌ None | ✅ Full |
| State Validation | ❌ None | ✅ Full |
| Reconnection | ⚠️ Basic | ✅ Robust |
| Error Handling | ⚠️ Limited | ✅ Comprehensive |
| Frame Sync | ❌ None | ✅ Full |
| Latency Tracking | ❌ None | ✅ Full |
| Memory Management | ⚠️ Leaks | ✅ Cleaned |
| Production Logging | ❌ Verbose | ✅ Clean |

## Usage in GameCanvas

### Initialize (once)

```typescript
import { createMultiplayerSession } from '../game/core/multiplayerSession';

// In WebSocketSessionScreen or similar
const mpSession = await createMultiplayerSession(
  serverUrl,
  roomId,
  playerId,
  isHost
);
```

### Each Frame

```typescript
// Update input from keyboard
const keys = state.keys;
const x = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
const y = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
const fire = keys[' '] || false;

// Send input
mpSession.updateLocalInput(x, y, fire);
mpSession.sendInputToServer();

// Host broadcasts state
if (mpSession.isHost()) {
  mpSession.sendGameStateSnapshot({
    frameNumber: state.frameNumber,
    timestamp: Date.now(),
    players: state.players.map(p => ({
      index: state.players.indexOf(p),
      pos: p.pos,
      health: p.health,
      alive: p.alive,
      cooldown: p.cooldown,
    })),
    boss: {
      pos: state.boss.pos,
      hp: state.boss.hp,
      hpMax: state.boss.hpMax,
    },
    bulletsCount: state.bullets.length,
  });
}

// Advance frame
mpSession.nextFrame();
```

### Get Remote Player Input

```typescript
const remotePlayerId = mpSession.getRemotePlayers()[0]?.id;
const remoteInput = mpSession.getRemotePlayerInput(remotePlayerId);

if (remoteInput) {
  // Apply to player 2
  const player2 = state.players[1];
  player2.pos.x += remoteInput.x * PLAYER_SPEED * dt;
  player2.pos.y += remoteInput.y * PLAYER_SPEED * dt;
}
```

### Monitor Connection

```typescript
const status = mpSession.getConnectionStatus();
console.log(status);
// { connected: true, reconnecting: false, reconnectAttempts: 0 }
```

## Architecture Overview

```
┌─────────────────────────────────┐
│     GameCanvas                  │
│  ├─ Input from keyboard         │
│  └─ Render players/state        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   MultiplayerSession            │
│  ├─ Coordinate input            │
│  ├─ Track state                 │
│  └─ Handle connection           │
└────────┬──────────┬───────┬─────┘
         │          │       │
         ▼          ▼       ▼
    ┌─────────┬──────────┬─────────────┐
    │ Network │Multiplayer│ InputValid  │
    │ Manager │ Manager   │ ator        │
    └─────────┴──────────┴─────────────┘
         │
         ▼
    ┌──────────────────┐
    │ WebSocket Server │
    │ (Railway)        │
    └──────────────────┘
```

## Common Tasks

### Check if Connected
```typescript
if (mpSession.getIsConnected()) {
  // Connected
}
```

### Get Player Latency
```typescript
const players = mpSession.getRemotePlayers();
for (const player of players) {
  console.log(`${player.name}: ${player.latency}ms`);
}
```

### Handle Disconnection
```typescript
const status = mpSession.getConnectionStatus();
if (!status.connected && status.reconnecting) {
  showUI("Reconnecting...");
}
```

### Debug Connection
```typescript
// Console shows:
// [Network] Connected to server
// [MP] Added remote player: Player (abc123) at index 1
// [Input] Validation: 45/50 inputs valid
```

## File Locations

```
src/game/core/
├── multiplayerTypes.ts         Types & interfaces
├── multiplayerManager.ts       State & sync logic
├── inputValidator.ts           Input validation
├── networkManager.ts           WebSocket
├── multiplayerSession.ts       High-level API ⭐ START HERE
└── websocketSession.ts         Legacy (deprecated)
```

## Documentation

1. **MULTIPLAYER_PRODUCTION_READY.md** - Feature overview
2. **MULTIPLAYER_ARCHITECTURE.md** - Technical deep dive
3. **MULTIPLAYER_MIGRATION.md** - Integration steps (NEW)
4. **MULTIPLAYER_QUICK_START.md** - This file!

## Testing

### Unit Test Example
```typescript
const session = new MultiplayerSession(url, roomId, playerId, true);
await session.initialize();

// Test input
session.updateLocalInput(1, 0, false);
const input = session.getCurrentInput();
assert(input.x === 1);
assert(input.y === 0);
```

### Integration Test Example
```typescript
// Two players connecting
const host = new MultiplayerSession(url, roomId, pid1, true);
const client = new MultiplayerSession(url, roomId, pid2, false);

await host.initialize();
await client.initialize();

// Send input
client.updateLocalInput(1, 0, false);
client.sendInputToServer();

// Host receives
setTimeout(() => {
  const remoteInput = host.getRemotePlayerInput(pid2);
  assert(remoteInput.x === 1);
}, 100);
```

## Deployment

### Prerequisites
- ✅ WebSocket server on Railway
- ✅ VITE_WS_SERVER_URL in Vercel env
- ✅ GameCanvas updated to use MultiplayerSession

### Steps
1. Update GameCanvas (see usage above)
2. Test locally: `npm run dev`
3. Test multiplayer: Open 2 browser tabs
4. Deploy: `git push origin main`
5. Monitor: Check console logs

## Troubleshooting

### Connection Fails
```typescript
const status = mpSession.getConnectionStatus();
console.log(status.reconnectAttempts); // How many retries?
```

Check:
- Railway server running
- VITE_WS_SERVER_URL correct
- Network connection available

### Input Not Sent
```typescript
if (!mpSession.getIsConnected()) {
  console.log('Not connected');
}
```

### State Out of Sync
```typescript
// Only host sends state
if (!mpSession.isHost()) {
  console.warn('Non-host trying to send state');
}
```

### High Latency
```typescript
const players = mpSession.getRemotePlayers();
console.log(players[0].latency); // ms
```

## Performance

- **60 FPS**: Optimized for gaming
- **16ms**: Input throttle
- **Memory**: Auto-cleanup (60 frames)
- **Network**: ~1KB per state update
- **CPU**: Minimal overhead

## Security

✅ Input validation  
✅ State validation  
✅ Range checking  
✅ Error handling  
✅ Connection monitoring  

## What's Next?

1. ✅ **Done**: Production infrastructure
2. 🔜 **Next**: Integrate into GameCanvas
3. 🔜 **Then**: Client-side prediction
4. 🔜 **Later**: Matchmaking & matchmaking

---

**Ready to integrate!** Start with `multiplayerSession.ts` for the high-level API.

