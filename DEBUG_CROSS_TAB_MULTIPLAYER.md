# 🔍 Debug: Por que Cross-Tab Não Funciona

## 1️⃣ Diagnosticar o Problema

Abra **ambas as abas** com F12 (DevTools) e procure por ESTES logs em AMBAS:

### Tab 1 (Cria sala)
```javascript
// Procure por TODOS estes logs:
[App] Initializing - Room ID: 
[WebSocketSessionScreen] Initializing session
[WebSocketSessionScreen] Room ID from URL: 
[Network] Connecting to 
[Network] Sending join message
[Network] Connected to 
[MultiplayerSession] Connected to server
[WebSocketSessionScreen] Player connected:
```

### Tab 2 (Cola link)
```javascript
// Procure por TODOS estes logs:
[App] Initializing - Room ID: ABC123  ← DEVE mostrar room ID!
[App] Auto Multiplayer detected - showing session screen  ← CRÍTICO!
[WebSocketSessionScreen] Room ID from URL: ABC123
[Network] Connecting to
[Network] Sending join message
```

---

## 2️⃣ Checklist de Diagnóstico

### ❌ Se NÃO aparecer em Tab 2:
```
[App] Initializing - Room ID: ABC123
```
**Problema:** URL não está sendo lida corretamente
```
Ações:
1. Verifique URL da aba: deve ter ?room=ABC123
2. Verifique console: procure por erro
3. Hard refresh: Ctrl+Shift+R
4. Copie URL novamente (pode estar truncada)
```

### ❌ Se não aparecer:
```
[App] Auto Multiplayer detected
```
**Problema:** `getRoomIdFromUrl()` retorna null/vazio
```
Debug:
1. Console: copiar e executar:
   console.log('URL:', window.location.href)
   console.log('Room:', getRoomIdFromUrl())
2. Verificar se getRoomIdFromUrl está no escopo global
```

### ❌ Se não aparecer:
```
[Network] Connected to
```
**Problema:** WebSocket não conectando
```
Debug:
1. Verificar se servidor está rodando: cd server && npm run dev
2. Verificar porta: 8080 (local) ou Railway (produção)
3. Verificar firewall/CORS
4. Checar console para erros de conexão
```

### ❌ Se não aparecer em Tab 1:
```
[WS] Broadcasting 'playerJoined'
```
**Problema:** Server não detectou Tab 2
```
Debug:
1. Verificar logs do server: deve aparecer
   [WS] Player joining room
   [Room] Player subscribed
2. Se não aparecer, server e client estão em rooms diferentes
3. Verificar hash de room ID
```

---

## 3️⃣ Teste Prático (Passo a Passo)

### Setup Completo
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Server
cd server && npm run dev

# Deixe ambos rodando
```

### Teste Manual
```
1. Abra DevTools em AMBAS as abas (F12)
2. Vá para Console em ambas
3. Limpe console em ambas (Ctrl+L ou cmd+K)
4. Aba 1: http://localhost:5173
5. Aba 1: LoginScreen → Digite qualquer nome → PLAY
6. Aba 1: MainMenu → Clique "Multiplayer"
7. Espere 3 segundos
8. Aba 1: Copie a URL completa (ctrl+L, ctrl+C)
9. Aba 2: Ctrl+T (nova aba)
10. Aba 2: Cola URL (ctrl+V, Enter)
```

### Verificação
```
Imediatamente após colar link em Aba 2:

✅ Console Aba 2 deve mostrar:
   [App] Initializing - Room ID: ...
   [App] Auto Multiplayer detected

✅ Console Aba 1 deve mostrar DENTRO DE 1 SEGUNDO:
   [WS] Broadcasting 'playerJoined'
   [MultiplayerSession] Remote player joined

✅ Ambas abas devem mostrar:
   "2/2 JOGADORES"
```

---

## 4️⃣ Problemas Comuns e Soluções

### Problema: "Tab 2 mostra branco"
```
Causas:
1. URL incorreta (não tem ?room=...)
2. JavaScript erro
3. App.tsx não carregou

Solução:
F12 → Console → procure por ERROS (vermelho)
Se tiver erro, compartilhe texto do erro
```

### Problema: "Tab 2 mostra MainMenu"
```
Causa:
getRoomIdFromUrl() retorna null

Solução:
1. Verifique URL: deve ter ?room=ABC123&nivel=1
2. Execute no console: console.log(getRoomIdFromUrl())
3. Se retorna null, problema em urlParams.ts
```

### Problema: "Tab 1 não detecta Tab 2"
```
Causa:
Server não vendo a conexão

Solução:
1. Verificar logs server: deve aparecer
   [WS] New connection attempt - Room:
2. Se não aparecer, Tab 2 não conseguiu conectar
3. Verifique console Tab 2 para erro de WebSocket
```

### Problema: "Timeout ou Connection Failed"
```
Causa:
Server offline ou port errado

Solução:
1. Terminal server: npm run dev
2. Verificar se aparece: listening on port 8080
3. Testar: curl http://localhost:8080/health
```

---

## 5️⃣ Logs Detalhados para Compartilhar

Quando tiver problema, copie TODOS estes logs:

### Console Tab 1:
```
[Paste aqui TODOS os logs de [App], [WebSocketSessionScreen], [Network]]
```

### Console Tab 2:
```
[Paste aqui TODOS os logs de [App], [WebSocketSessionScreen], [Network]]
```

### Terminal Server:
```
[Paste aqui TODOS os logs de [WS], [Room], [Network]]
```

### URL Tab 2:
```
[Copie a URL completa da barra de endereço]
```

---

## 6️⃣ Script de Debug (Cole no Console)

```javascript
// Copie e cole NO CONSOLE de AMBAS abas:

console.log('=== BROWSER STATE ===');
console.log('URL:', window.location.href);
console.log('localStorage boss_strike_user:', localStorage.getItem('boss_strike_user'));

// Se getRoomIdFromUrl existe:
try {
  console.log('Room ID:', getRoomIdFromUrl?.() || 'Function not found');
} catch(e) {
  console.log('getRoomIdFromUrl error:', e.message);
}

// Verificar SessionManager:
try {
  console.log('sessionManager exists:', !!window.sessionManager);
} catch(e) {
  console.log('sessionManager check error:', e.message);
}

console.log('=== FIM DEBUG ===');
```

---

## 7️⃣ Cenários de Sucesso vs Falha

### ✅ DEVE APARECER (Sucesso)
```
Tab 1:
[App] Auto Multiplayer detected - showing session screen
[WebSocketSessionScreen] Player connected: [nome]
Resultado: "1/2 JOGADORES"
URL: ?room=ABC123&nivel=1

Tab 2:
[App] Initializing - Room ID: ABC123, Auto Multiplayer: true
[App] Auto Multiplayer detected - showing session screen
[WebSocketSessionScreen] Room ID from URL: ABC123
[Network] Connected to ws://...
[WebSocketSessionScreen] Player connected: [nome]
Resultado: "1/2 JOGADORES"

Tab 1 (inst):
[WS] Broadcasting 'playerJoined' to 1 subscribed player(s)
[MultiplayerSession] Remote player joined: [nome]
Resultado: "2/2 JOGADORES"
```

### ❌ NÃO DEVE APARECER (Erro)
```
Tab 2:
[App] Initializing - Room ID: null  ← ❌ Problema!
MainMenu mostrado                    ← ❌ Deveria ser WebSocketSessionScreen!

OU

[Network] Connection timeout         ← ❌ Server offline!

OU

Branco/erro no console               ← ❌ Bug em código!
```

---

## 8️⃣ Próximos Passos

1. **Execute teste prático acima**
2. **Copie logs de AMBAS abas**
3. **Compartilhe:**
   - Console Tab 1 (completo)
   - Console Tab 2 (completo)
   - Terminal Server (completo)
   - URL que está tentando usar
4. **Direi exatamente qual é o problema**

---

**Urgência:** Por favor, execute os passos acima e compartilhe os logs para debug!

