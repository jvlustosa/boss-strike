# Como Configurar ngrok para WebSocket

## ⚠️ Problema Comum

Se você está rodando `ngrok http 3000`, está apontando para o **Vite dev server**, não para o **WebSocket server**.

## ✅ Solução Correta

### 1. Pare o ngrok atual
- Pressione `Ctrl+C` no terminal onde o ngrok está rodando

### 2. Inicie o ngrok apontando para a porta 8080

```bash
cd server
ngrok http 8080
```

Ou use o script:
```bash
cd server
npm run ngrok
```

### 3. Copie o URL do ngrok

Você verá algo como:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8080
```

### 4. Atualize o arquivo `.env`

Na raiz do projeto, crie/atualize o arquivo `.env`:

```env
VITE_WS_SERVER_URL=wss://abc123.ngrok-free.app
```

**IMPORTANTE**: 
- Converta `https://` para `wss://` (WebSocket seguro)
- Use o URL que o ngrok mostrar (não o localhost)

### 5. Reinicie o Vite dev server

```bash
# Pare o Vite atual (Ctrl+C)
npm run dev
```

Isso carregará o novo `.env` com o URL do ngrok.

## 🧪 Teste

1. Abra o jogo no navegador
2. Clique em "Multiplayer"
3. Deve conectar ao servidor WebSocket via ngrok

## 📝 Resumo

- **Vite dev server**: Porta 3000 (para desenvolvimento)
- **WebSocket server**: Porta 8080 (para multiplayer)
- **ngrok**: Deve apontar para **8080**, não 3000

