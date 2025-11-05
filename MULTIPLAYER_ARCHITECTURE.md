# Production-Ready Multiplayer Architecture

## Overview

This document outlines the production-grade multiplayer infrastructure for Boss Strike, built with:

- **NetworkManager**: WebSocket communication with automatic reconnection, message queuing
- **MultiplayerManager**: Player tracking, frame sync, input buffering, state validation
- **InputValidator**: Input sanitization, validation, throttling
- **MultiplayerSession**: High-level session coordination

## Architecture

```
┌─────────────────────────────────────────────────┐
│          GameCanvas (Render & Logic)            │
├─────────────────────────────────────────────────┤
│         MultiplayerSession (Coordinator)        │
├──────────────────┬──────────────────┬───────────┤
│ MultiplayerManager│ NetworkManager   │InputValidator
│ • Player Tracking │ • WebSocket      │ • Validation
│ • Frame Sync      │ • Reconnection   │ • Throttling
│ • Input Buffering │ • Message Queue  │ • Sanitation
│ • State Validation│ • Heartbeat      │
└──────────────────┴──────────────────┴───────────┘
         │                  │                │
         └──────────────────┴────────────────┘
              WebSocket Server
           (Railway, Production)
```

## Components

### 1. NetworkManager
Handles all WebSocket communication with built-in reliability:

**Features:**
- Automatic reconnection (exponential backoff)
- Message queuing when disconnected
- Heartbeat + ping for latency tracking
- Connection state tracking
- Error recovery

**Usage:**
```typescript
const network = new NetworkManager(serverUrl, roomId, playerId);
await network.connect();
network.sendInput(input);
network.setCallbacks({
  onPlayerJoined: (id, name, isHost) => {},
  onInputReceived: (id, input) => {},
  onGameStateUpdate: (snapshot) => {},
});
```

### 2. MultiplayerManager
Manages game state synchronization and player tracking:

**Features:**
- Per-player input recording
- Frame-based synchronization
- Server time sync
- State snapshot validation
- Automatic cleanup (60-frame buffer)
- Player latency tracking

**Usage:**
```typescript
const mp = new MultiplayerManager(roomId, playerId, isHost);
mp.addRemotePlayer(id, name, isHost, index);
mp.recordInput(playerId, input, frameNumber);
mp.nextFrame(); // Cleanup old data

if (mp.validateStateSnapshot(snapshot)) {
  applyGameState(snapshot);
}
```

### 3. InputValidator
Validates and sanitizes all input:

**Features:**
- Type validation
- Range checking (-1 to 1)
- Consecutive invalid input detection
- Input throttling (16ms)
- Batch validation
- Idle input detection

**Usage:**
```typescript
const validator = new InputValidator();
const validated = validator.validate(input);

if (validator.hasTooManyInvalidInputs()) {
  // Kick player or reset connection
}
```

### 4. MultiplayerSession
High-level coordinator:

**Features:**
- Initializes all components
- Coordinates input flow
- Manages state snapshots
- Connection monitoring
- Frame advancement

**Usage:**
```typescript
const session = new MultiplayerSession(url, roomId, playerId, isHost);
await session.initialize();

// Each frame:
session.updateLocalInput(x, y, fire);
session.sendInputToServer();
session.nextFrame();

// Host only:
session.sendGameStateSnapshot(snapshot);
```

## Game Loop Flow

### Host (Authoritative)
```
1. Receive player 1 & 2 inputs from network
2. Record inputs with frame numbers
3. Update player 1 with local input
4. Update player 2 with remote input
5. Update boss, bullets, collisions
6. Validate game state
7. Send state snapshot to clients
8. Render
9. Advance frame
```

### Non-Host (Client)
```
1. Capture local input
2. Send input to server
3. Receive game state from host
4. Apply authoritative state
5. Render
6. Advance frame
```

## Key Features

### 1. Automatic Reconnection
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max 5 attempts before giving up
- Automatic message queue flush on reconnect
- Connection status monitoring

### 2. Input Validation
- All inputs validated before processing
- Out-of-range values rejected
- Consecutive invalid inputs tracked
- Prevents input injection attacks

### 3. State Validation
- Position bounds checking
- Health/HP range validation
- Bullet count limits
- Prevents state corruption

### 4. Frame Synchronization
- Frame numbers for all inputs
- Automatic cleanup (60-frame buffer)
- Server time sync to handle clock drift
- Latency tracking

### 5. Resilience
- Message queue for offline messages
- Graceful degradation on errors
- Detailed error logging
- Connection status feedback

## Network Protocol

### Messages

**Input**
```json
{
  "type": "input",
  "input": { "x": -1, "y": 0, "fire": false, "timestamp": 1234567 },
  "playerId": "abc123"
}
```

**Game State (Host only)**
```json
{
  "type": "state",
  "snapshot": {
    "frameNumber": 120,
    "timestamp": 1234567,
    "players": [...],
    "boss": {...},
    "bulletsCount": 5
  },
  "playerId": "abc123"
}
```

**Ping**
```json
{
  "type": "ping",
  "playerId": "abc123",
  "timestamp": 1234567
}
```

## Production Checklist

- ✅ Input validation & sanitization
- ✅ State snapshot validation
- ✅ Automatic reconnection
- ✅ Message queuing
- ✅ Error recovery
- ✅ Latency tracking
- ✅ Connection monitoring
- ✅ Frame synchronization
- ✅ Memory cleanup
- ✅ Logging & debugging

## Testing

### Unit Tests
- Input validation edge cases
- State snapshot validation
- Frame buffer cleanup

### Integration Tests
- Reconnection scenarios
- Message queue flushing
- State synchronization
- Input latency

### Load Tests
- High-frequency input (120 FPS)
- Large state snapshots
- Connection churn

## Monitoring

Production metrics to track:
- Connection success rate
- Average latency
- Invalid input rate
- Reconnection frequency
- Message queue size
- CPU/memory usage

## Troubleshooting

### High Latency
- Check server load
- Monitor network conditions
- Verify player location

### Input Lag
- Verify input send rate (16ms throttle)
- Check frame sync
- Monitor reconnection frequency

### Desync
- Check host authority
- Verify state snapshots
- Monitor dropped messages

### Memory Leaks
- Input buffer should auto-cleanup (60 frames)
- Message queue should flush
- Players should be removed on disconnect

## Future Enhancements

1. **Lag Compensation**: Client-side prediction
2. **Delta Compression**: Smaller state updates
3. **Replay System**: Record & playback
4. **Analytics**: Detailed metrics
5. **Matchmaking**: Player rating system
6. **Voice Chat**: Audio streaming

