# 🔍 WebSocket Server Debug - Guia Completo

## ❌ Problema: Multiplayer Não Funciona

### Checklist de Diagnóstico

#### 1. Server Está Rodando?

```bash
# Terminal: Verificar se server está ativo
cd server
npm run dev

# Deve aparecer:
[WS] WebSocket server running on 0.0.0.0:8080
[WS] Ready for connections
```

**Se não aparecer:**
- Verificar se porta 8080 está livre
- Verificar se há erros no terminal
- Verificar package.json scripts

#### 2. Health Check Funciona?

```bash
# Teste local
curl http://localhost:8080/health

# Esperado:
{"status":"ok","timestamp":1699...}
```

**Se não funcionar:**
- Server não está rodando
- Porta errada
- Firewall bloqueando

#### 3. Client Está Conectando?

**Console Browser (F12):**
```
Procure por:
[Network] Connecting to ws://localhost:8080?room=ABC123
[Network] Connected to ws://localhost:8080
[Network] Sending join message
```

**Se não aparecer:**
- Verificar se WebSocketSessionScreen está sendo renderizado
- Verificar se sessionManager está inicializado
- Verificar se VITE_WS_SERVER_URL está configurado

#### 4. Server Recebe Mensagens?

**Terminal Server:**
```
Procure por:
[WS] New connection attempt - Room: ABC123
[WS] Join received - Room: ABC123
[WS] Sending 'joined' to player: ...
```

**Se não aparecer:**
- Client não está conectando
- CORS bloqueando
- URL errada

#### 5. Mensagens Chegam no Client?

**Console Browser:**
```
Procure por:
[Network] Joined room: ABC123
[Network] Received playerJoined: ...
[MultiplayerSession] Remote player joined: ...
```

**Se não aparecer:**
- Server não está enviando
- Client não está recebendo
- WebSocket desconectado

---

## 🔧 Problemas Comuns e Soluções

### Problema 1: "Connection Refused"

**Sintoma:**
```
WebSocket connection failed
Error: Connection refused
```

**Solução:**
1. Verificar se server está rodando: `cd server && npm run dev`
2. Verificar porta: deve ser 8080 (ou PORT env var)
3. Verificar firewall: liberar porta 8080
4. Testar health check: `curl http://localhost:8080/health`

### Problema 2: "CORS Error"

**Sintoma:**
```
CORS policy blocked
Origin not allowed
```

**Solução:**
1. Verificar ALLOWED_ORIGINS no server/index.js
2. Adicionar origem: `'http://localhost:5173'`
3. Verificar se origin está no array
4. Restart server

### Problema 3: "Connection Timeout"

**Sintoma:**
```
WebSocket connection timeout (15s)
```

**Solução:**
1. Verificar se server está acessível
2. Verificar URL: `ws://localhost:8080` (local) ou `wss://...` (prod)
3. Verificar rede/firewall
4. Aumentar timeout se necessário

### Problema 4: "No Messages Received"

**Sintoma:**
```
Client conecta mas não recebe mensagens
Server não vê mensagens do client
```

**Solução:**
1. Verificar se `sendMessage` está sendo chamado
2. Verificar se WebSocket está OPEN (readyState === 1)
3. Verificar console para erros de parsing
4. Verificar formato de mensagem (deve ser JSON)

### Problema 5: "Room Not Found"

**Sintoma:**
```
Client conecta mas room não existe
Room hash não match
```

**Solução:**
1. Verificar se room ID está sendo passado corretamente
2. Verificar se hash está sendo calculado igual
3. Verificar se room foi criada no server
4. Verificar logs do server para room creation

---

## 🧪 Teste Manual Passo a Passo

### Step 1: Verificar Server

```bash
# Terminal 1
cd server
npm run dev

# Esperado:
[WS] WebSocket server running on 0.0.0.0:8080
[WS] Ready for connections

# Teste health:
curl http://localhost:8080/health
# Esperado: {"status":"ok",...}
```

### Step 2: Verificar Client

```bash
# Terminal 2
npm run dev

# Browser: http://localhost:5173
# F12 → Console
# Procure por: [Network] Connecting to...
```

### Step 3: Testar Multiplayer

```
1. Browser: http://localhost:5173
2. LoginScreen: Digite nome
3. MainMenu: Clique "Multiplayer"
4. WebSocketSessionScreen aparece
5. Console: Procure por [Network] Connected
6. Server Terminal: Procure por [WS] New connection
```

### Step 4: Testar Cross-Tab

```
1. Tab 1: Multiplayer → Copia link
2. Tab 2: Cola link
3. Console Tab 1: Procure por [WS] Broadcasting
4. Console Tab 2: Procure por [Network] Joined room
```

---

## 📊 Logs Esperados (Completos)

### Server Terminal

```
[WS] WebSocket server running on 0.0.0.0:8080
[WS] Ready for connections
[WS] New connection attempt - Room: ABC123, Path: /room/ABC123
[WS] Room ID from path: ABC123
[WS] Join received - Room: ABC123
[WS] Sending 'joined' to player1: ...
[WS] Broadcasting 'playerJoined' to 1 subscribed player
[WS] ✓ Room ABC123 [hash] now has 2/2 players
```

### Browser Console (Tab 1)

```
[App] Initializing - Room ID: null, Auto Multiplayer: false
[App] Auto Multiplayer detected
[WebSocketSessionScreen] Initializing session
[WebSocketSessionScreen] Generated new room ID: ABC123
[Network] Connecting to ws://localhost:8080?room=ABC123
[Network] Connected to ws://localhost:8080
[Network] Sending join message
[Network] Joined room: ABC123
[MultiplayerSession] Connected to server
[WebSocketSessionScreen] Player connected: João
```

### Browser Console (Tab 2)

```
[App] Initializing - Room ID: ABC123, Auto Multiplayer: true
[App] Auto Multiplayer detected - showing session screen
[WebSocketSessionScreen] Room ID from URL: ABC123
[Network] Connecting to ws://localhost:8080?room=ABC123
[Network] Connected to ws://localhost:8080
[Network] Sending join message
[Network] Joined room: ABC123
[MultiplayerSession] Connected to server
[MultiplayerSession] Remote player joined: Maria
[WebSocketSessionScreen] Remote player detected: Maria
```

---

## 🐛 Troubleshooting Avançado

### Debug NetworkManager

```javascript
// Cole no console do browser:
console.log('NetworkManager:', window.networkManager);
console.log('WebSocket state:', window.networkManager?.ws?.readyState);
// 0 = CONNECTING
// 1 = OPEN
// 2 = CLOSING
// 3 = CLOSED
```

### Debug Server Connection

```javascript
// Cole no console do browser:
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('✅ Direct WebSocket test: CONNECTED');
ws.onerror = (e) => console.error('❌ Direct WebSocket test: ERROR', e);
ws.onclose = (e) => console.log('❌ Direct WebSocket test: CLOSED', e.code, e.reason);
```

### Debug Room ID

```javascript
// Cole no console do browser:
const url = new URL(window.location.href);
console.log('URL:', url.href);
console.log('Path:', url.pathname);
console.log('Room from path:', url.pathname.match(/\/room\/([a-zA-Z0-9]+)/)?.[1]);
console.log('Room from query:', url.searchParams.get('room'));
```

---

## 🚨 Problemas Críticos

### Se NADA funciona:

1. **Verificar se server está rodando**
   ```bash
   ps aux | grep node  # Linux/Mac
   tasklist | findstr node  # Windows
   ```

2. **Verificar se porta está livre**
   ```bash
   netstat -ano | findstr 8080  # Windows
   lsof -i :8080  # Linux/Mac
   ```

3. **Verificar se há erros no código**
   ```bash
   npm run build  # Frontend
   cd server && npm run build  # Backend (se houver)
   ```

4. **Verificar logs completos**
   - Server terminal: TODOS os logs
   - Browser console: TODOS os logs
   - Network tab: TODAS as requisições WebSocket

---

## 📋 Checklist Final

- [ ] Server está rodando (`npm run dev` em server/)
- [ ] Health check funciona (`curl http://localhost:8080/health`)
- [ ] Client conecta (`[Network] Connected` no console)
- [ ] Server recebe conexão (`[WS] New connection` no terminal)
- [ ] Client envia join (`[Network] Sending join message`)
- [ ] Server recebe join (`[WS] Join received` no terminal)
- [ ] Server envia joined (`[WS] Sending 'joined'` no terminal)
- [ ] Client recebe joined (`[Network] Joined room` no console)
- [ ] Room matching funciona (2 players na mesma room)
- [ ] Broadcasting funciona (P1 vê P2 entrar)

---

**PRÓXIMO PASSO:** Execute o checklist acima e compartilhe os logs que NÃO aparecem!

