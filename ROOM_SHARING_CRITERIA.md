# 🎮 Critérios de Criação e Compartilhamento de Sala

## Problema Identificado

O sistema de sala ainda tem issues de sincronização. Aqui estão os critérios EXATOS para funcionar bem.

## 🔍 Fluxo Completo (Passo a Passo)

### **PLAYER 1 (Host): Criação de Sala**

#### Passo 1: Menu Click "Multiplayer"
```
App.tsx → handleStartMultiplayer()
  ├─ updateUrlLevel(level)
  ├─ setIsMultiplayer(true)
  ├─ setShowSessionScreen(true)
```

#### Passo 2: WebSocketSessionScreen Monta
```
useEffect → handleSession()
  ├─ getRoomIdFromUrl() → null (primeira vez)
  ├─ generateRoomId() → "ABC123"
  ├─ updateUrlRoom("ABC123") → URL: ?room=ABC123&nivel=1 ✅
  ├─ setRoomId("ABC123")
  ├─ sessionManager.initMultiplayer(playerId, playerName)
```

#### Passo 3: SessionManager Inicia
```
sessionManager.initMultiplayer()
  ├─ getRoomIdFromUrl() → "ABC123" ✅ DEVE ENCONTRAR!
  ├─ createMultiplayerSession(url, "ABC123", playerId, true)
  ├─ multiplayerSession.initialize()
  │   ├─ networkManager.connect()
  │   │   └─ WebSocket URL: wss://server.com?room=ABC123
  │   └─ Callback: onPlayerJoined
  ├─ isHost = true ✅
```

#### Passo 4: Player 1 Vê Botão "Copy Room Link"
```
Compartilha: https://app.com/?room=ABC123&nivel=1 ✅
```

---

### **PLAYER 2 (Client): Entrada na Sala**

#### Passo 1: Cola Link no Browser
```
URL: https://app.com/?room=ABC123&nivel=1
```

#### Passo 2: App.tsx Auto-Detecta Multiplayer
```
useEffect → detectGameMode()
  ├─ getRoomIdFromUrl() → "ABC123" ✅
  ├─ setIsMultiplayer(true)
  ├─ setShowSessionScreen(true) ✅
```

#### Passo 3: WebSocketSessionScreen Monta
```
useEffect → handleSession()
  ├─ getRoomIdFromUrl() → "ABC123" ✅ JÁ TEM!
  ├─ NÃO gera novo ID
  ├─ setRoomId("ABC123")
  ├─ sessionManager.initMultiplayer(playerId, playerName)
```

#### Passo 4: SessionManager Conecta à Sala Existente
```
sessionManager.initMultiplayer()
  ├─ getRoomIdFromUrl() → "ABC123" ✅
  ├─ createMultiplayerSession(url, "ABC123", playerId, false)
  ├─ networkManager.connect()
  │   ├─ WebSocket URL: wss://server.com?room=ABC123
  │   ├─ Server recebe: roomId="ABC123"
  │   ├─ Server encontra sala existente ✅
  │   ├─ Adiciona novo player à sala
  │   └─ Envia: { type: 'joined', isHost: false }
  ├─ isHost = false ✅
```

#### Passo 5: Player 2 Vê Player 1 Conectado
```
connectedPlayers: 2 ✅
Botão "START GAME" aparece
```

---

## ❌ Problemas Que Podem Ocorrer

### Problema 1: Room ID Não Persiste na URL
```
❌ Player 1 gera sala, mas updateUrlRoom() não funcionou
↓
URL fica: https://app.com/?nivel=1 (sem ?room=ABC123)
↓
Player 2 coloca URL, mas não tem room ID
↓
generateRoomId() cria NOVA sala em vez de entrar na existente
↓
Dois jogadores em salas diferentes!
```

**Solução:**
```typescript
// DEVE ser chamado ANTES de inicializar
updateUrlRoom(finalRoomId);  // ✅ Sincronous

// Verificar console:
console.log(window.location.href); // Deve ter ?room=ABC123
```

### Problema 2: Room ID Não é Lido Corretamente
```
❌ Player 2 cola link, mas getRoomIdFromUrl() retorna null
↓
useEffect em App.tsx não detecta multiplayer
↓
Entra em single player mode
↓
Nunca tenta conectar ao servidor
```

**Solução:**
```typescript
// Debug Player 2 quando colar link:
console.log('URL:', window.location.href);
console.log('Params:', new URLSearchParams(window.location.search));
console.log('Room ID:', getRoomIdFromUrl());

// Deve mostrar: room=ABC123
```

### Problema 3: Servidor Não Recebe Room ID
```
❌ Cliente conecta, mas URL query params não chegam ao servidor
↓
networkManager.connect() faz: wss://server.com (sem ?room=ABC123)
↓
Servidor recebe roomId=null
↓
Servidor cria nova sala em vez de usar existente
```

**Solução:**
```typescript
// Em networkManager.ts:
const url = new URL(this.serverUrl);
url.searchParams.set('room', roomId); // ✅ DEVE ser set()
this.ws = new WebSocket(url.toString());

console.log('[Network] Connecting to:', url.toString());
// Deve mostrar: wss://server.com?room=ABC123
```

### Problema 4: Servidor Não Encontra Sala Existente
```
❌ Servidor recebe room="ABC123" mas sala não existe
↓
Cria nova sala em vez de adicionar à existente
```

**Solução (servidor):**
```javascript
// server/index.js linha 191-204
let room = rooms.get(requestedRoomId);

if (!room) {
  // ❌ Cria nova sala se não existir - CORRETO para cliente
  room = new Room(requestedRoomId);
  rooms.set(requestedRoomId, room);
} else {
  // ✅ Encontrou sala existente - Bom!
}

// Verificar log:
console.log(`[WS] Player joining room: ${requestedRoomId}`);
// Deve estar entre outras mensagens de Player 1
```

### Problema 5: Host Authority Não Funciona
```
❌ Player 1 (host) não consegue enviar estado do jogo
↓
Player 2 não recebe sincronização
↓
Dois mundos diferentes (desync)
```

**Solução:**
```typescript
// No GameCanvas:
if (sessionManager.getIsHost()) {
  sessionManager.sendGameState(snapshot); // ✅ Só host envia
}

// Debug:
console.log('isHost:', sessionManager.getIsHost());
console.log('connectedPlayers:', sessionManager.getRemotePlayers().length);
```

---

## ✅ Checklist de Validação

### Player 1 (Host)
- [ ] Click "Multiplayer"
- [ ] Aguarda 2 segundos
- [ ] URL muda para `?room=ABC123&nivel=1`
- [ ] Botão "Copy Room Link" aparece
- [ ] Console mostra: `[SessionManager] Multiplayer initialized - HOST`
- [ ] Console mostra: `[Network] Connected to server`

### Player 2 (Client)
- [ ] Cola link em nova aba/janela
- [ ] URL mostra `?room=ABC123&nivel=1`
- [ ] WebSocketSessionScreen aparece
- [ ] Aguarda conexão
- [ ] Console mostra: `[SessionManager] Multiplayer initialized - CLIENT`
- [ ] Vê contador: "1/2 PLAYERS" → "2/2 PLAYERS"
- [ ] Player 1 vê contador: "1/2 PLAYERS" → "2/2 PLAYERS"

### Sincronização
- [ ] Ambos clicam "START GAME"
- [ ] Jogo inicia para ambos ao mesmo tempo
- [ ] Movimento de um jogador aparece no outro
- [ ] Latência < 200ms

---

## 🔧 Debug Commands (Console)

```javascript
// Check room ID
getRoomIdFromUrl()  // Deve retornar: "ABC123"

// Check URL
window.location.href  // Deve ter: ?room=ABC123

// Check session
sessionManager.getGameMode()  // "multi"
sessionManager.getIsHost()   // true (Player 1) ou false (Player 2)
sessionManager.getConnectionStatus()  // { connected, reconnecting, reconnectAttempts }

// Check room creation flow
console.log(new URLSearchParams(window.location.search).entries())
// Array: [ ['room', 'ABC123'], ['nivel', '1'] ]
```

---

## 🎯 Critérios Rigorosos para Funcionar

### 1. **Room ID Generation** ✅
- Gerado UMA VEZ quando Player 1 entra
- `generateRoomId()` retorna string 6 caracteres uppercase
- Exemplo: `ABC123`, `XYZ789`

### 2. **URL Persistência** ✅
- `updateUrlRoom()` DEVE ser chamado ANTES de inicializar multiplayer
- URL deve ficar: `?room=ABC123&nivel=1`
- Deve persistir ao colar em nova aba

### 3. **Room ID Parsing** ✅
- `getRoomIdFromUrl()` DEVE encontrar `?room=ABC123`
- Player 2 DEVE ler esse valor
- Não pode gerar novo ID

### 4. **WebSocket Connection** ✅
- Client conecta com: `wss://server.com?room=ABC123`
- Servidor recebe URL query params
- Servidor cria/encontra sala

### 5. **Room Management (Servidor)** ✅
- Player 1: `rooms.set("ABC123", new Room())`
- Player 2: `rooms.get("ABC123")` encontra a sala
- Ambos adicionados à mesma `Map`

### 6. **Host Authority** ✅
- Player 1: `isHost = true` → Envia estado
- Player 2: `isHost = false` → Recebe estado
- Servidor retorna `isHost` correto

### 7. **Message Broadcasting** ✅
- Servidor broadcast `playerJoined` para todos
- Ambos veem count: "2/2 PLAYERS"
- WebSocketSessionScreen mostra ambos conectados

### 8. **Game State Sync** ✅
- Host envia snapshot a cada frame
- Client recebe e aplica
- Movimento sincronizado

---

## 🚀 Implementação Correta

```typescript
// ✅ CORRETO - Fluxo Player 1
const handleStartMultiplayer = () => {
  setIsMultiplayer(true);
  setShowSessionScreen(true);
};

// ✅ CORRETO - WebSocketSessionScreen
const handleSession = async () => {
  let roomId = getRoomIdFromUrl();
  if (!roomId) {
    roomId = generateRoomId();
    updateUrlRoom(roomId);  // ← CRÍTICO: Antes de inicializar
  }
  
  setRoomId(roomId);
  await sessionManager.initMultiplayer(playerId, playerName);
};

// ✅ CORRETO - App.tsx auto-detect
useEffect(() => {
  const roomId = getRoomIdFromUrl();
  if (roomId) {
    setIsMultiplayer(true);
    setShowSessionScreen(true);
  }
}, []);

// ✅ CORRETO - SessionManager
async initMultiplayer(playerId, playerName) {
  const roomId = getRoomIdFromUrl();
  if (!roomId) {
    throw new Error('No room ID in URL');
  }
  
  await createMultiplayerSession(...).initialize();
}
```

---

## 📊 Estado Esperado

### Player 1 Console
```
[SessionManager] Multiplayer initialized - HOST
[Network] Connected to server
[WS] New connection attempt - Room: ABC123, Origin: https://...
[WS] Created new room: ABC123 for player: xyz...
[MultiplayerSession] Connected to server
```

### Player 2 Console
```
[SessionManager] Multiplayer initialized - CLIENT
[Network] Connected to server
[WS] New connection attempt - Room: ABC123, Origin: https://...
[WS] Player xyz joining room: ABC123
[MultiplayerSession] Connected to server
```

---

## ❌ Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| "No room ID in URL" | Player 2 cola link sem ?room= | Verificar `updateUrlRoom()` foi chamado |
| 2 jogadores em salas diferentes | Room ID não lido | Debug `getRoomIdFromUrl()` |
| Room = null no servidor | URL params não passaram | Check `wss://` inclui `?room=` |
| isHost = undefined | Servidor não retornou corretamente | Verificar `handleJoin()` |
| Desync (cada um vê coisa diferente) | Estado não sincronizado | Host deve enviar state cada frame |

---

## 🎯 Resumo

Para funcionar **FLUIDAMENTE**, você PRECISA garantir:

1. ✅ Room ID gerado e URL atualizada ANTES de tudo
2. ✅ Player 2 LEI o room ID da URL corretamente
3. ✅ WebSocket connection PASSA o room ID como query param
4. ✅ Servidor ENCONTRA a sala existente (não cria nova)
5. ✅ isHost determinado CORRETAMENTE pelo servidor
6. ✅ Host ENVIA estado, Client RECEBE estado
7. ✅ Ambos veem "2/2 PLAYERS" antes de iniciar

Se ALGUM critério falhar → desync ou conexão quebrada!

