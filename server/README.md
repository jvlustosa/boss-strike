# WebSocket Multiplayer Server

WebSocket server for Boss Attack multiplayer matching by URL link.

## Setup

```bash
cd server
npm install
```

## Running

### Local Development

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Server runs on port 8080 by default (or PORT environment variable).

### With ngrok (Public Access)

1. **Install ngrok** (if not installed):
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok
   
   # macOS (via Homebrew)
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **In another terminal, start ngrok**:
   ```bash
   # Option 1: Using npm script
   npm run ngrok
   
   # Option 2: Direct ngrok command
   ngrok http 8080
   ```

4. **Copy the ngrok URL**:
   - ngrok will show a Forwarding URL like: `https://abc123.ngrok-free.app`
   - Convert to WebSocket URL: `wss://abc123.ngrok-free.app`
   - **Important**: Use `wss://` (secure WebSocket) not `ws://`

5. **Update client environment**:
   - Create/update `.env` in project root:
   ```
   VITE_WS_SERVER_URL=wss://abc123.ngrok-free.app
   ```

6. **Restart the client**:
   ```bash
   npm run dev
   ```

**Note**: Free ngrok URLs change each time you restart ngrok. For a static URL, use ngrok's paid plan or set up ngrok with a custom domain.

## How It Works

1. Players connect with a room ID in the URL: `ws://localhost:8080?room=ABC123`
2. First player to join a room becomes the host
3. Second player joins the same room ID
4. Host sends game state updates, all players send input
5. Room is deleted when empty or after 5 minutes of inactivity

## Environment Variables

- `PORT` - Server port (default: 8080)

