# 🔧 Debug Room Sharing - Troubleshooting Interativo

## Quick Diagnosis

Cole EXATAMENTE esses comandos no console do browser e reporte os resultados:

### **Step 1: Verifica URL**
```javascript
console.log('=== URL CHECK ===');
console.log('Full URL:', window.location.href);
console.log('Search params:', window.location.search);
console.log('Room ID from URL:', new URLSearchParams(window.location.search).get('room'));
console.log('Level from URL:', new URLSearchParams(window.location.search).get('nivel'));
```

**Esperado Player 1 (depois de clicar Multiplayer):**
```
Full URL: https://boss-strike.vercel.app/?room=ABC123&nivel=1
Search params: ?room=ABC123&nivel=1
Room ID from URL: ABC123
Level from URL: 1
```

**Esperado Player 2 (colando link):**
```
Full URL: https://boss-strike.vercel.app/?room=ABC123&nivel=1
Search params: ?room=ABC123&nivel=1
Room ID from URL: ABC123
Level from URL: 1
```

---

### **Step 2: Verifica SessionManager**
```javascript
console.log('=== SESSION CHECK ===');
console.log('Game mode:', sessionManager?.getGameMode());
console.log('Is host:', sessionManager?.getIsHost());
console.log('Frame number:', sessionManager?.getFrameNumber());
console.log('Connection status:', sessionManager?.getConnectionStatus());
```

**Esperado Player 1:**
```
Game mode: multi
Is host: true
Frame number: 0 (ou > 0 se já iniciou)
Connection status: { connected: true, reconnecting: false, reconnectAttempts: 0 }
```

**Esperado Player 2:**
```
Game mode: multi
Is host: false
Frame number: 0 (ou > 0)
Connection status: { connected: true, reconnecting: false, reconnectAttempts: 0 }
```

---

### **Step 3: Verifica WebSocket**
```javascript
console.log('=== WEBSOCKET CHECK ===');
console.log('Session manager exists:', !!sessionManager);
console.log('Multiplayer session exists:', !!sessionManager?.multiplayerSession);
console.log('Is connected:', sessionManager?.getIsConnected?.());
console.log('Remote players:', sessionManager?.getRemotePlayers?.());
```

**Esperado:**
```
Session manager exists: true
Multiplayer session exists: true
Is connected: true
Remote players: Array(1) [ { id: "abc...", name: "Player", isHost: false/true, ... } ]
```

---

### **Step 4: Testa Input**
```javascript
console.log('=== INPUT CHECK ===');
sessionManager.updateInput(1, 0, false);
console.log('Input updated: x=1, y=0, fire=false');
sessionManager.sendInput();
console.log('Input sent to server');
```

**Console deve mostrar:**
```
[Input] Validation: 1/1 inputs valid
Input updated: x=1, y=0, fire=false
Input sent to server
```

---

### **Step 5: Testa State Sync**
```javascript
console.log('=== STATE SYNC CHECK ===');
if (sessionManager?.getIsHost()) {
  const snapshot = {
    frameNumber: 1,
    timestamp: Date.now(),
    players: [{index: 0, pos: {x: 100, y: 100}, health: 5, alive: true, cooldown: 0}],
    boss: {pos: {x: 50, y: 50}, hp: 100, hpMax: 100},
    bulletsCount: 0
  };
  sessionManager.sendGameState(snapshot);
  console.log('State snapshot sent:', snapshot);
} else {
  console.log('Not host, skipping state send');
}
```

---

## Problemas Específicos

### Problema: "Room ID não aparece na URL"

```javascript
// Check 1: A função generateRoomId funciona?
console.log('Generated room ID:', 'ABCDEF'.substring(0, 6).toUpperCase());

// Check 2: updateUrlRoom foi chamado?
window.history  // Procure por entries com ?room=

// Check 3: URL mudou mas desapareceu?
// Browser pode ter recarregado a página limpa
```

**Ação Corretiva:**
```javascript
// Force update URL
const url = new URL(window.location.href);
url.searchParams.set('room', 'TEST123');
url.searchParams.set('nivel', '1');
window.history.pushState(null, '', url.toString());
console.log('New URL:', window.location.href);
```

---

### Problema: "Player 2 não vê a sala"

```javascript
// Check: Room ID é lido em Player 2?
console.log('Room ID:', getRoomIdFromUrl());

// Deveria retornar: ABC123
// Se retornar: null
```

**Causas Possíveis:**
1. URL foi copiada errada (sem ?room=)
2. Browser removeu parâmetros
3. Vercel reescreveu URLs

**Teste:**
```javascript
// Copie manualmente a URL com room ID:
const url = window.location.href;
console.log('Copy this:', url);

// Abra em nova aba e rode:
console.log('Received room ID:', getRoomIdFromUrl());
```

---

### Problema: "Servidor não encontra a sala"

```javascript
// Ver logs do servidor:
// No terminal onde Railway/server roda:
console.log('[WS] New connection attempt - Room: ABC123');
console.log('[WS] Player xyz joining room: ABC123');

// Se não vir "joining room", significa:
// 1. Room ID não chegou até o servidor
// 2. Servidor não recebeu URL query params
```

**Debug Cliente:**
```javascript
// Verificar o que está sendo enviado para servidor
console.log('WebSocket URL:', 
  `wss://boss-attack-production.up.railway.app?room=${getRoomIdFromUrl()}`
);

// Deveria ser: wss://boss-attack-production.up.railway.app?room=ABC123
```

---

### Problema: "Dois jogadores em salas diferentes"

```javascript
// Player 1
console.log('Player 1 - Room:', getRoomIdFromUrl());  // ABC123
console.log('Player 1 - isHost:', sessionManager.getIsHost());  // true

// Player 2 (abra console DELE)
console.log('Player 2 - Room:', getRoomIdFromUrl());  // Deve ser ABC123 tb!
console.log('Player 2 - isHost:', sessionManager.getIsHost());  // false

// Se diferentes → Player 2 gerou novo ID
// Causa: getRoomIdFromUrl() retornou null no Player 2
```

**Solução:**
```javascript
// Verify URL foi passada corretamente:
const originalURL = 'https://boss-strike.vercel.app/?room=ABC123&nivel=1';
const url = new URL(originalURL);
console.log('Room:', url.searchParams.get('room'));  // ABC123
```

---

### Problema: "Desync (cada um vê coisa diferente)"

```javascript
// Player 1 (Host - deve enviar estado)
console.log('Host connected:', sessionManager.getIsConnected());
console.log('Host sending state:', sessionManager.getIsHost());

// Player 2 (Client - deve receber estado)
console.log('Client connected:', sessionManager.getIsConnected());
console.log('Client is host:', sessionManager.getIsHost());  // false

// Se ambos dizem isHost=true → ERROR!
// Causa: Servidor determinou mal quem é host
```

**Debug Server:**
```javascript
// No server/index.js, procure:
console.log(`[WS] Player ${playerId} - isHost: ${room.hostId === playerId}`);

// Player 1: isHost: true
// Player 2: isHost: false
```

---

## Checklist Completo de Debug

### Browser do Player 1

```javascript
console.log('=== PLAYER 1 DEBUG ===');

// 1. URL
const room1 = getRoomIdFromUrl();
console.log('✓ Room ID:', room1);
console.assert(room1, '❌ Room ID is null!');

// 2. Session
console.log('✓ Game mode:', sessionManager?.getGameMode());
console.assert(sessionManager?.getGameMode() === 'multi', '❌ Not multiplayer!');

// 3. Host
console.log('✓ Is Host:', sessionManager?.getIsHost());
console.assert(sessionManager?.getIsHost() === true, '❌ Not host!');

// 4. Connection
const conn1 = sessionManager?.getConnectionStatus();
console.log('✓ Connected:', conn1?.connected);
console.assert(conn1?.connected, '❌ Not connected!');

// 5. Esperando Player 2
setTimeout(() => {
  const remote1 = sessionManager?.getRemotePlayers?.();
  console.log('✓ Remote players:', remote1?.length);
  console.assert(remote1?.length > 0, '❌ No remote players!');
}, 2000);
```

### Browser do Player 2

```javascript
console.log('=== PLAYER 2 DEBUG ===');

// 1. URL (CRÍTICO - deve ser igual ao Player 1)
const room2 = getRoomIdFromUrl();
console.log('✓ Room ID:', room2);
console.assert(room2, '❌ Room ID is null!');
console.assert(room2 === 'ABC123', '❌ Wrong room ID!');  // Substitute ABC123

// 2. Session
console.log('✓ Game mode:', sessionManager?.getGameMode());
console.assert(sessionManager?.getGameMode() === 'multi', '❌ Not multiplayer!');

// 3. Host (deve ser FALSE)
console.log('✓ Is Host:', sessionManager?.getIsHost());
console.assert(sessionManager?.getIsHost() === false, '❌ Should not be host!');

// 4. Connection
const conn2 = sessionManager?.getConnectionStatus();
console.log('✓ Connected:', conn2?.connected);
console.assert(conn2?.connected, '❌ Not connected!');

// 5. Vendo Player 1
const remote2 = sessionManager?.getRemotePlayers?.();
console.log('✓ Remote players:', remote2?.length);
console.assert(remote2?.length > 0, '❌ No remote players!');
```

---

## Teste de Ponta a Ponta

Siga EXATAMENTE:

### Setup
```
Terminal 1: npm run dev
Abra: http://localhost:5173
```

### Player 1
```
1. Cole no console:
console.clear();
console.log('=== PLAYER 1 START ===');

2. Click "Multiplayer"
3. Aguarde 2 segundos
4. Verifique:
console.log(window.location.href);  // Deve ter ?room=
```

### Copy Link
```
5. Cole no console:
const link = window.location.href;
console.log('SHARE THIS:', link);

6. Copie o link (Cmd+C no console output)
```

### Player 2
```
7. Nova aba: Ctrl+T
8. Cola URL
9. Console mostra mesmo room ID?
console.log(getRoomIdFromUrl());

10. Compara:
// Player 1: ABC123
// Player 2: ABC123
```

### Ambos Conectados?
```
Player 1 console:
sessionManager.getRemotePlayers().length  // 1?

Player 2 console:
sessionManager.getRemotePlayers().length  // 1?
```

---

## Relatório para Enviar

Se algo der errado, copie TUDO daqui e envie:

```
ERRO ENCONTRADO:
================

Player 1 URL: 
Player 2 URL: 

Player 1 Room ID: 
Player 2 Room ID: 

Player 1 isHost: 
Player 2 isHost: 

Player 1 Connected: 
Player 2 Connected: 

Console Errors:
[Copie aqui]

Esperado vs Actual:
[Descreva]

Steps to Reproduce:
[Exatamente o que fez]
```

---

## Dicas Finais

1. **Always refresh antes de testar**
   - Ctrl+Shift+R (hard refresh)
   - Ou limpe cache do browser

2. **Check both consoles**
   - Player 1 console
   - Player 2 console
   - Server logs

3. **Timestamps help**
   - Compare server log timestamps
   - Com browser console timestamps

4. **Network tab**
   - Abra DevTools → Network → WS
   - Veja conexão WebSocket
   - Check messages sendo enviados

5. **Copy exatamente**
   - Não modifique URL manual
   - Use "Copy Room Link" ou console
   - Cole sem modificações

