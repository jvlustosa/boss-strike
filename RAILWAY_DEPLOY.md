# 🚂 Railway Deployment Guide

## Step-by-Step Deployment

### 1. Connect Repository to Railway

1. Go to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select this repository: `boss-attack`

### 2. Configure Service

1. Railway will detect the project
2. Click on the service → **Settings**
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install` (Railway auto-detects)
   - **Start Command**: `npm start`
   - **Port**: Railway auto-assigns (use `$PORT` env var)

### 3. Environment Variables

Railway automatically sets `PORT` variable. The server uses `process.env.PORT || 8080`.

**Optional - Add CORS origins:**
```
ALLOWED_ORIGINS=https://boss-attack.vercel.app,https://seu-dominio.vercel.app
```

### 4. Get WebSocket URL

1. After deploy, Railway provides a URL like: `https://seu-projeto.railway.app`
2. Convert to WebSocket URL: `wss://seu-projeto.railway.app`
3. Copy this URL

### 5. Configure Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   VITE_WS_SERVER_URL=wss://seu-projeto.railway.app
   ```
3. Redeploy Vercel project

### 6. Verify

1. Check Railway logs: Should show "WebSocket server running on port XXXX"
2. Test connection in your game
3. Multiplayer should work! ✅

## Railway Configuration Summary

- **Root Directory**: `server`
- **Start Command**: `npm start`
- **Port**: Auto (Railway sets `$PORT`)
- **Build**: Auto (`npm install`)

## Troubleshooting

### Port Issues
Railway uses `$PORT` automatically. The server code already handles this: `process.env.PORT || 8080`

### Connection Failed
- Verify Railway URL is correct
- Check Railway logs for errors
- Ensure `VITE_WS_SERVER_URL` is set in Vercel
- Redeploy Vercel after adding env var

### CORS Errors
Add `ALLOWED_ORIGINS` in Railway environment variables with your Vercel URL.

## Notes

- Railway free tier: 500 hours/month
- Auto-deploys on git push
- Logs available in Railway dashboard
- WebSocket works out of the box! ✅

