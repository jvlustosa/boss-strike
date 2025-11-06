import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

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

const rooms = new Map();

class Room {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.gameState = null;
    this.hostId = null;
    this.createdAt = Date.now();
  }

  addPlayer(socket, playerId, playerName) {
    if (this.players.size >= 2) {
      return false;
    }
    
    const isHost = this.players.size === 0;
    this.players.set(playerId, {
      socket,
      id: playerId,
      name: playerName || `Player ${this.players.size + 1}`,
      isHost,
      ready: false,
      input: { x: 0, y: 0, fire: false },
      lastUpdate: Date.now()
    });

    if (isHost) {
      this.hostId = playerId;
    }

    return true;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      
      if (this.hostId === playerId && this.players.size > 0) {
        const newHost = Array.from(this.players.values())[0];
        this.hostId = newHost.id;
        newHost.isHost = true;
      }
    }
  }

  broadcast(message, excludePlayerId = null) {
    const data = JSON.stringify(message);
    this.players.forEach((player, id) => {
      if (id !== excludePlayerId && player.socket.readyState === 1) {
        player.socket.send(data);
      }
    });
  }

  getPlayerCount() {
    return this.players.size;
  }

  isEmpty() {
    return this.players.size === 0;
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

  const { query } = parse(req.url, true);
  const urlRoomId = query.room || null;
  const urlPlayerName = query.name || null;

  let currentRoom = null;
  let playerId = null;

  console.log(`[WS] New connection attempt - Room: ${urlRoomId || 'none'}, Origin: ${origin || 'none'}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  function handleMessage(ws, message) {
    switch (message.type) {
      case 'join':
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
    
    if (!requestedRoomId) {
      // No room specified - create new room for host
      const newRoomId = generateRoomId();
      playerId = generatePlayerId();
      const room = new Room(newRoomId);
      rooms.set(newRoomId, room);
      currentRoom = room;
      
      console.log(`[WS] Created new room: ${newRoomId} for player: ${playerId}`);
      
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

    // Join existing or create if doesn't exist
    let room = rooms.get(requestedRoomId);
    
    if (!room) {
      // Room doesn't exist yet - create it
      playerId = generatePlayerId();
      room = new Room(requestedRoomId);
      rooms.set(requestedRoomId, room);
      currentRoom = room;
      
      console.log(`[WS] Created room: ${requestedRoomId} for player: ${playerId}`);
    } else {
      // Room exists - join it
      playerId = generatePlayerId();
      currentRoom = room;
      console.log(`[WS] Player ${playerId} joining room: ${requestedRoomId}`);
    }

    if (room.addPlayer(ws, playerId, playerNameToUse)) {
      ws.send(JSON.stringify({
        type: 'joined',
        roomId: requestedRoomId,
        playerId,
        isHost: room.hostId === playerId,
        playerCount: room.getPlayerCount()
      }));

      // Notify other players in room
      room.broadcast({
        type: 'playerJoined',
        playerId,
        playerName: playerNameToUse,
        playerCount: room.getPlayerCount()
      }, playerId);
      
      console.log(`[WS] Room ${requestedRoomId} now has ${room.getPlayerCount()} players`);
    } else {
      ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
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

