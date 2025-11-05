# ngrok Setup Guide

Quick guide to expose your WebSocket server publicly using ngrok.

## Prerequisites

1. Install ngrok: https://ngrok.com/download
2. (Optional) Sign up for a free ngrok account for longer sessions

## Quick Start

### Terminal 1: Start Server
```bash
cd server
npm start
```

### Terminal 2: Start ngrok
```bash
cd server
npm run ngrok
```

Or directly:
```bash
ngrok http 8080
```

## Get the WebSocket URL

1. ngrok will display a forwarding URL like:
   ```
   Forwarding   https://abc123.ngrok-free.app -> http://localhost:8080
   ```

2. Convert to WebSocket URL:
   - From: `https://abc123.ngrok-free.app`
   - To: `wss://abc123.ngrok-free.app`
   - **Important**: Use `wss://` (secure) not `ws://`

3. Update `.env` in project root:
   ```env
   VITE_WS_SERVER_URL=wss://abc123.ngrok-free.app
   ```

4. Restart your client:
   ```bash
   npm run dev
   ```

## Tips

- **Free tier**: URLs change each restart. Use for testing.
- **Paid tier**: Static domains available.
- **Security**: ngrok provides HTTPS/WSS automatically.
- **WebSocket**: ngrok supports WebSocket connections out of the box.

## Troubleshooting

### Connection Refused
- Make sure server is running on port 8080
- Check ngrok is forwarding to correct port

### WebSocket Connection Failed (Error 1006)
**Problema**: ngrok free tier bloqueia conexões WebSocket com código 1006.

**Soluções**:

1. **Configurar ngrok authtoken** (recomendado):
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
   Isso bypassa o interstitial page que bloqueia WebSocket.

2. **Usar ngrok com authtoken no comando**:
   ```bash
   ngrok http 8080 --authtoken YOUR_AUTHTOKEN
   ```

3. **Atualizar para ngrok pago** (sem limitações)

4. **Usar alternativa para produção**:
   - Railway (recomendado)
   - Render
   - Heroku
   - DigitalOcean

### WebSocket Connection Failed (Outros)
- Use `wss://` not `ws://` for ngrok URLs
- Check `.env` file has correct URL
- Restart client after updating `.env`
- Verify ngrok tunnel is active

### URL Changes Each Time
- This is normal for free ngrok
- Consider paid plan for static domain
- Or use ngrok config file for custom subdomain

## Example ngrok Output

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the `Forwarding` URL and convert `https://` to `wss://` for WebSocket.

