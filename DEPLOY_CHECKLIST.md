# ✅ Railway Deploy Checklist

## Code Status

### ✅ Server Code
- [x] Uses `process.env.PORT` (Railway auto-sets)
- [x] Listens on `0.0.0.0` (required for Railway)
- [x] CORS configured for Vercel
- [x] WebSocket server ready
- [x] Error handling implemented
- [x] Room cleanup (5min timeout)

### ✅ Dependencies
- [x] `ws` package (WebSocket)
- [x] Removed unused `socket.io`
- [x] `package.json` configured
- [x] `railway.json` configured

### ✅ Configuration
- [x] `server/railway.json` exists
- [x] Start command: `npm start`
- [x] Root directory: `server`

## Railway Configuration

### Required Settings:
1. **Root Directory**: `server`
2. **Start Command**: `npm start`
3. **Port**: Auto (Railway sets `$PORT`)

### Optional Environment Variables:
```
ALLOWED_ORIGINS=https://boss-attack.vercel.app
```

## After Deploy

1. Copy Railway URL: `https://seu-projeto.railway.app`
2. Convert to WebSocket: `wss://seu-projeto.railway.app`
3. Add to Vercel: `VITE_WS_SERVER_URL=wss://seu-projeto.railway.app`
4. Redeploy Vercel

## Verification

- [ ] Railway logs show: "WebSocket server running on 0.0.0.0:XXXX"
- [ ] Railway service is "Active"
- [ ] Vercel has `VITE_WS_SERVER_URL` set
- [ ] Test multiplayer connection

## Status: ✅ READY FOR DEPLOY

