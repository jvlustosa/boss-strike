# 🔧 ngrok Troubleshooting - WebSocket Connection Issues

## ❌ Erro: WebSocket connection failed (1006)

**Erro comum:**
```
WebSocket connection to 'wss://xxx.ngrok-free.app' failed: 
WebSocket is closed before the connection is established (1006)
```

## 🔍 Causa

O ngrok **free tier** bloqueia conexões WebSocket automaticamente com a página "Visit Site" (interstitial). Isso causa o erro 1006 (abnormal closure).

## ✅ Soluções

### 1. Configurar ngrok authtoken (Recomendado)

1. **Criar conta no ngrok** (gratuito): https://dashboard.ngrok.com/signup
2. **Copiar authtoken** do dashboard
3. **Configurar authtoken**:
   ```bash
   ngrok config add-authtoken SEU_AUTHTOKEN_AQUI
   ```
4. **Reiniciar ngrok**:
   ```bash
   ngrok http 8080
   ```

Agora o ngrok vai bypassar a página de bloqueio e permitir WebSocket! ✅

### 2. Usar ngrok pago

O plano pago não tem limitações e funciona perfeitamente com WebSocket.

### 3. Usar alternativas para produção

Para produção, use serviços que suportam WebSocket nativamente:

**Railway** (recomendado):
- Deploy automático
- WebSocket funcionando
- Grátis com limites generosos

**Render**:
- Web Service
- WebSocket funcionando
- Grátis com limites

**DigitalOcean**:
- VPS completo
- Controle total
- $5/mês

## 🚀 Deploy Recomendado para Produção

### Railway (Mais fácil)

1. Conecte seu repositório no Railway
2. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - **Port**: `$PORT` (automático)
3. Railway fornece URL automática: `wss://seu-projeto.railway.app`
4. Configure no Vercel: `VITE_WS_SERVER_URL=wss://seu-projeto.railway.app`

### Render (Alternativa)

1. Novo Web Service no Render
2. Conecte repositório
3. Configure:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
4. Render fornece URL: `wss://seu-projeto.onrender.com`
5. Configure no Vercel: `VITE_WS_SERVER_URL=wss://seu-projeto.onrender.com`

## 📝 Notas

- **ngrok free**: Ótimo para testes locais (com authtoken)
- **Railway/Render**: Melhor para produção
- **Código 1006**: Sempre indica bloqueio do ngrok free tier

## 🎯 Quick Fix

Se você só quer testar rapidamente:

1. Instale ngrok: https://ngrok.com/download
2. Crie conta gratuita: https://dashboard.ngrok.com/signup
3. Configure authtoken: `ngrok config add-authtoken SEU_TOKEN`
4. Inicie: `ngrok http 8080`
5. Use a URL no `.env`: `VITE_WS_SERVER_URL=wss://xxx.ngrok-free.app`

Pronto! WebSocket funcionando! 🎉

