# 🚀 Deployment Checklist - Railway + Vercel

## ✅ O Que Já Está Pronto

### Railway (WebSocket Server)
- ✅ Server deployado: `boss-attack-production.up.railway.app`
- ✅ Porta automática: `process.env.PORT` configurada
- ✅ CORS habilitado para:
  - `https://boss-attack.vercel.app` (produção)
  - `http://localhost:3000` (local)
  - `http://localhost:5173` (dev)
- ✅ Health check endpoint: `/health`
- ✅ Suporta room criação e entrada

### Vercel (Frontend)
- ✅ Frontend deployado: `https://boss-strike.vercel.app`
- ✅ Build otimizado (Vite)
- ✅ Auto-detecção de modo multiplayer
- ✅ Auto-join de sala com URL parameter

---

## 🔧 O Que Você PRECISA Configurar

### 1. Vercel - Environment Variable
**Status:** ⚠️ CRÍTICO - Precisa ser feito

```
Variável: VITE_WS_SERVER_URL
Valor: wss://boss-attack-production.up.railway.app
```

**Como configurar:**

1. Abra [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique no projeto `boss-strike`
3. Vá para **Settings** → **Environment Variables**
4. Clique **Add New**
5. Configure:
   - **Name:** `VITE_WS_SERVER_URL`
   - **Value:** `wss://boss-attack-production.up.railway.app`
   - **Environments:** `Production, Preview, Development`
6. Click **Save**

**Resultado esperado:**
```
✓ Variable added
```

### 2. Vercel - Redeploy Frontend

Após adicionar a variável, **REDEPLOY** o frontend:

1. Vá para **Deployments**
2. Clique no último deploy
3. Click **Redeploy**
4. Aguarde conclusão

**Ou via CLI:**
```bash
npm run build
vercel --prod
```

### 3. Railway - CORS (Opcional)

Se quiser adicionar mais origens:

1. Railway Dashboard → `boss-attack-production`
2. Settings → Environment Variables
3. Adicione:
   ```
   ALLOWED_ORIGINS=https://boss-attack.vercel.app,https://seu-outro-dominio.com
   ```

---

## 📋 Checklist Completo

### Vercel
- [ ] Variável `VITE_WS_SERVER_URL` adicionada
- [ ] Value = `wss://boss-attack-production.up.railway.app`
- [ ] Environment: Production, Preview, Development
- [ ] Frontend redeployado
- [ ] Verifica se build passou

### Railway
- [ ] Server está rodando
- [ ] Porta automática configurada
- [ ] Health check: `https://boss-attack-production.up.railway.app/health` retorna `{"status":"ok"}`

### Testing
- [ ] Acessa `https://boss-strike.vercel.app`
- [ ] Clica "Multiplayer"
- [ ] Vê WebSocketSessionScreen (não fica em branco)
- [ ] Console mostra: `[Network] Connected to server`
- [ ] Room é criada com sucesso
- [ ] Link da sala funciona (auto-join)
- [ ] 2 jogadores entram e se movem separadamente

---

## 🧪 Teste Rápido

### Local (Dev)
```bash
# Terminal 1: Frontend
npm run dev
# Terminal 2: Server
cd server && npm run dev

# Browser:
http://localhost:5173
http://localhost:5173?room=TEST
```

### Production
```
1. https://boss-strike.vercel.app
2. Click "Multiplayer"
3. Copiar link
4. Nova aba: cola link
5. Ambos devem ver "2/2 PLAYERS"
```

---

## 🔍 Troubleshooting

### "Servidor não encontrado"
```
❌ VITE_WS_SERVER_URL não está em Vercel
✅ Solução: Adicionar env var + redeploy
```

### "Connection timeout"
```
❌ Railway está offline ou CORS bloqueando
✅ Solução: 
   1. Verificar https://boss-attack-production.up.railway.app/health
   2. Adicionar origin em ALLOWED_ORIGINS
```

### "Desync entre jogadores"
```
❌ Network latência alta ou perda de pacotes
✅ Solução:
   1. Verificar console do browser
   2. Check Railway logs
   3. Verificar latência: Chrome DevTools → Network
```

### "Fica em branco no WebSocketSessionScreen"
```
❌ VITE_WS_SERVER_URL não foi buildado
✅ Solução: Redeploy após adicionar env var
```

---

## 📊 URLs Importantes

| Serviço | URL |
|---------|-----|
| Frontend | https://boss-strike.vercel.app |
| WebSocket | wss://boss-attack-production.up.railway.app |
| Health Check | https://boss-attack-production.up.railway.app/health |
| Vercel Dashboard | https://vercel.com/dashboard |
| Railway Dashboard | https://railway.app/dashboard |

---

## 🚀 Próximos Passos

1. **Imediato:** Adicionar VITE_WS_SERVER_URL em Vercel
2. **Imediato:** Redeploy Vercel
3. **Imediato:** Testar multiplayer
4. **Se tudo ok:** Game está 100% pronto em produção! 🎉

---

## 📝 Notas

- Railway server auto-restarta se cair
- Vercel auto-redeploy a cada push para `main`
- WebSocket usa `wss://` (secure) em produção
- CORS validado no server
- Room IDs são únicos e gerados aleatoriamente

**Status Final:** ✅ Pronto para Produção (falta só a env var)

