import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import crypto from 'crypto';

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://boss-attack.vercel.app', 'http://localhost:3000', 'http://localhost:5173'];

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  res.writeHead(404);
  res.end('WebSocket server');
});

const wss = new WebSocketServer({ 
  server: httpServer,
  perMessageDeflate: false
});

/**
 * Room subscription system with hashed room codes
 * Maps roomHash → Room instance
 */
const rooms = new Map();

/**
 * Hash function for room IDs to prevent collision attacks
 */
function hashRoomId(roomId) {
  if (!roomId) return null;
  return crypto
    .createHash('sha256')
    .update(roomId)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Room class with subscription management
 * Each room maintains WebSocket subscriptions per player
 */
class Room {
  constructor(id, hash) {
    this.id = id;
    this.hash = hash;  // Hashed room ID
    this.players = new Map();
    this.subscriptions = new Map();  // playerId → subscription metadata
    this.gameState = null;
    this.hostId = null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  /**
   * Add player to room and subscribe to events
   * Returns true if player was added or already exists
   */
  addPlayer(socket, playerId, playerName) {
    // Check if player already exists in room (reconnection)
    if (this.players.has(playerId)) {
      console.log(`[Room] Player ${playerId} already in room - updating socket`);
      const existingPlayer = this.players.get(playerId);
      existingPlayer.socket = socket;  // Update socket for reconnection
      existingPlayer.lastUpdate = Date.now();
      this.lastActivity = Date.now();
      return true;  // Already in room, just update socket
    }

    // Check if room is full
    if (this.players.size >= 2) {
      console.log(`[Room] Room ${this.id} is full (${this.players.size}/2 players)`);
      return false;
    }
    
    const isHost = this.players.size === 0;
    const player = {
      socket,
      id: playerId,
      name: playerName || `Player ${this.players.size + 1}`,
      isHost,
      ready: false,
      input: { x: 0, y: 0, fire: false },
      lastUpdate: Date.now(),
      subscribedAt: Date.now()
    };

    this.players.set(playerId, player);
    
    // Track subscription metadata
    this.subscriptions.set(playerId, {
      playerId,
      subscribedAt: Date.now(),
      roomHash: this.hash,
      isHost
    });

    if (isHost) {
      this.hostId = playerId;
    }

    this.lastActivity = Date.now();
    console.log(`[Room] Player ${playerId} (${playerName}) subscribed to room ${this.id} [${this.hash}]`);
    
    return true;
  }

  /**
   * Remove player and unsubscribe from room events
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.subscriptions.delete(playerId);
      
      console.log(`[Room] Player ${playerId} unsubscribed from room ${this.id} [${this.hash}]`);
      
      if (this.hostId === playerId && this.players.size > 0) {
        const newHost = Array.from(this.players.values())[0];
        this.hostId = newHost.id;
        newHost.isHost = true;
        console.log(`[Room] Host promoted to ${newHost.id}`);
      }
    }
    
    this.lastActivity = Date.now();
  }

  /**
   * Broadcast message to subscribed players
   */
  broadcast(message, excludePlayerId = null) {
    const data = JSON.stringify(message);
    let sentCount = 0;
    
    this.players.forEach((player, id) => {
      if (id !== excludePlayerId && player.socket.readyState === 1) {
        try {
          player.socket.send(data);
          sentCount++;
        } catch (error) {
          console.error(`[Room] Failed to send to ${id}:`, error.message);
        }
      }
    });
    
    this.lastActivity = Date.now();
    return sentCount;
  }

  /**
   * Get active subscriptions in this room
   */
  getSubscriptions() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check if player is subscribed to this room
   */
  isSubscribed(playerId) {
    return this.subscriptions.has(playerId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * Check if room is stale (no activity for 5 minutes)
   */
  isStale() {
    return (Date.now() - this.lastActivity) > (5 * 60 * 1000);
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const isNgrok = req.headers.host?.includes('ngrok') || origin?.includes('ngrok');
  
  // Allow ngrok connections (free tier has limitations but we'll allow it)
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !origin.includes('localhost') && !isNgrok) {
    console.log(`[WS] Rejected connection from unauthorized origin: ${origin}`);
    ws.close(1008, 'Unauthorized origin');
    return;
  }

  const { pathname, query } = parse(req.url, true);
  
  // Extract room ID from path: /room/ABC123
  let urlRoomId = null;
  const pathRoomMatch = pathname.match(/\/room\/([a-zA-Z0-9]+)/);
  if (pathRoomMatch && pathRoomMatch[1]) {
    urlRoomId = pathRoomMatch[1];
    console.log(`[WS] Room ID from path: ${urlRoomId}`);
  }
  
  // Fallback to query param for backwards compatibility: ?room=ABC123
  if (!urlRoomId && query.room) {
    urlRoomId = query.room;
    console.log(`[WS] Room ID from query: ${urlRoomId}`);
  }
  
  const urlPlayerName = query.name || null;

  let currentRoom = null;
  let playerId = null;

  console.log(`[WS] New connection attempt - Room: ${urlRoomId || 'none'}, Path: ${pathname}, Origin: ${origin || 'none'}`);

  ws.on('message', (data) => {
    try {
      const messageStr = data.toString();
      console.log(`[WS] Message received from ${playerId || 'unknown'}:`, messageStr);
      const message = JSON.parse(messageStr);
      handleMessage(ws, message);
    } catch (error) {
      console.error('[WS] Error parsing message:', error, 'Data:', data.toString());
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  function handleMessage(ws, message) {
    console.log(`[WS] Handling message type: ${message.type} from ${playerId || 'unknown'}`);
    switch (message.type) {
      case 'join':
        console.log(`[WS] Processing join request - Room: ${urlRoomId || message.roomId || 'none'}, Player: ${message.playerName || urlPlayerName || 'unknown'}`);
        handleJoin(ws, message, urlRoomId, urlPlayerName);
        break;
      case 'input':
        handleInput(message);
        break;
      case 'gameState':
        handleGameState(message);
        break;
      case 'ready':
        handleReady(message);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        console.warn(`[WS] Unknown message type: ${message.type}`);
    }
  }

  function handleJoin(ws, message, urlRoomId, urlPlayerName) {
    // Priority: URL room ID > message room ID > generate new
    const requestedRoomId = urlRoomId || message.roomId || null;
    const playerNameToUse = urlPlayerName || message.playerName || `Player`;
    
    // Hash room ID for lookup (prevents collision attacks)
    const roomHash = hashRoomId(requestedRoomId);
    
    if (!requestedRoomId) {
      // No room specified - create new room for host
      const newRoomId = generateRoomId();
      const newHash = hashRoomId(newRoomId);
      playerId = generatePlayerId();
      const room = new Room(newRoomId, newHash);
      rooms.set(newHash, room);
      currentRoom = room;
      
      console.log(`[WS] ✓ Created new room: ${newRoomId} [${newHash}] for player: ${playerId}`);
      
      if (room.addPlayer(ws, playerId, playerNameToUse)) {
        ws.send(JSON.stringify({
          type: 'joined',
          roomId: newRoomId,
          playerId,
          isHost: true,
          playerCount: 1
        }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
      }
      return;
    }

    // Join existing or create if doesn't exist (using hashed lookup)
    let room = rooms.get(roomHash);
    
    if (!room) {
      // Room doesn't exist yet - create it
      playerId = generatePlayerId();
      room = new Room(requestedRoomId, roomHash);
      rooms.set(roomHash, room);
      currentRoom = room;
      
      console.log(`[WS] ✓ Created room: ${requestedRoomId} [${roomHash}] for player: ${playerId}`);
    } else {
      // Room exists - join it (verify hash matches)
      playerId = generatePlayerId();
      currentRoom = room;
      console.log(`[WS] ✓ Player ${playerId} joining room: ${requestedRoomId} [${roomHash}]`);
      console.log(`[WS]   Active subscriptions: ${room.getSubscriptions().map(s => s.playerId).join(', ')}`);
    }

    // Check if player already exists in room
    const playerAlreadyInRoom = room.isSubscribed(playerId);
    
    if (playerAlreadyInRoom) {
      // Player already in room - just send confirmation (reconnection)
      console.log(`[WS] Player ${playerId} already in room ${requestedRoomId} - reconnection`);
      const isHostPlayer = room.hostId === playerId;
      const playerCountNow = room.getPlayerCount();
      
      ws.send(JSON.stringify({
        type: 'joined',
        roomId: requestedRoomId,
        roomHash: roomHash,
        playerId,
        isHost: isHostPlayer,
        playerCount: playerCountNow,
        reconnected: true
      }));
      
      console.log(`[WS] ✓ Reconnected player ${playerId} to room ${requestedRoomId} [${roomHash}]`);
      return;
    }

    // Try to add player to room
    if (room.addPlayer(ws, playerId, playerNameToUse)) {
      const isHostPlayer = room.hostId === playerId;
      const playerCountNow = room.getPlayerCount();
      
      // Send joined confirmation to this player
      const joinedMessage = {
        type: 'joined',
        roomId: requestedRoomId,
        roomHash: roomHash,  // Include hash for client reference
        playerId,
        isHost: isHostPlayer,
        playerCount: playerCountNow
      };
      
      console.log(`[WS] → Sending 'joined' to ${playerId} (${playerNameToUse})`);
      ws.send(JSON.stringify(joinedMessage));

      // Notify OTHER players in room that someone joined
      if (playerCountNow > 1) {
        const otherPlayersMessage = {
          type: 'playerJoined',
          playerId,
          playerName: playerNameToUse,
          playerCount: playerCountNow,
          roomHash: roomHash
        };
        
        const sentCount = room.broadcast(otherPlayersMessage, playerId);
        console.log(`[WS] ✓ Broadcasted 'playerJoined' to ${sentCount} subscribed player(s) in ${requestedRoomId}`);
      }
      
      console.log(`[WS] ✓ Room ${requestedRoomId} [${roomHash}] now has ${playerCountNow}/2 players`);
    } else {
      // Room is full (2 players already)
      console.log(`[WS] ❌ Room ${requestedRoomId} is full - cannot add player ${playerId}`);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Room is full (2 players maximum)',
        roomId: requestedRoomId,
        playerCount: room.getPlayerCount()
      }));
    }
  }

  function handleInput(message) {
    if (!currentRoom || !playerId) return;
    
    const player = currentRoom.players.get(playerId);
    if (player) {
      player.input = message.input || player.input;
      player.lastUpdate = Date.now();
      
      currentRoom.broadcast({
        type: 'playerInput',
        playerId,
        input: player.input
      }, playerId);
    }
  }

  function handleGameState(message) {
    if (!currentRoom || !playerId) return;
    
    const player = currentRoom.players.get(playerId);
    if (player && player.isHost) {
      currentRoom.gameState = message.gameState;
      
      currentRoom.broadcast({
        type: 'gameStateUpdate',
        gameState: message.gameState
      }, playerId);
    }
  }

  function handleReady(message) {
    if (!currentRoom || !playerId) return;
    
    const player = currentRoom.players.get(playerId);
    if (player) {
      player.ready = message.ready !== false;
      
      currentRoom.broadcast({
        type: 'playerReady',
        playerId,
        ready: player.ready
      }, playerId);
    }
  }

  ws.on('close', () => {
    if (currentRoom && playerId) {
      console.log(`[WS] Player ${playerId} disconnected from room ${currentRoom.id}`);
      
      const playerName = currentRoom.players.get(playerId)?.name;
      currentRoom.removePlayer(playerId);
      
      if (currentRoom.isEmpty()) {
        rooms.delete(currentRoom.id);
        console.log(`[WS] Room ${currentRoom.id} deleted (empty)`);
      } else {
        currentRoom.broadcast({
          type: 'playerLeft',
          playerId,
          playerCount: currentRoom.getPlayerCount()
        });
      }
    }
  });

  ws.on('error', (error) => {
    console.error(`[WS] WebSocket error:`, error);
  });
});

setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000;
  
  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > timeout && room.isEmpty()) {
      rooms.delete(roomId);
      console.log(`[WS] Cleaned up empty room: ${roomId}`);
    }
  });
}, 60000);

const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`[WS] WebSocket server running on ${HOST}:${PORT}`);
  console.log(`[WS] Ready for connections`);
});

