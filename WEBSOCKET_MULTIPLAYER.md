# WebSocket Multiplayer Setup

Guia completo para configurar e usar o multiplayer via WebSocket.

## Arquitetura

O sistema usa um servidor WebSocket dedicado que:
- Gerencia salas (rooms) por ID de URL
- Sincroniza inputs entre jogadores
- Transmite estado do jogo do host para os clientes

## Como Funciona

1. **Host (Jogador 1)**:
   - Cria uma sala ao abrir o jogo em modo multiplayer
   - Recebe um ID de sala único na URL
   - Executa a simulação do jogo
   - Envia estado do jogo para outros jogadores

2. **Client (Jogador 2)**:
   - Conecta à mesma sala usando o link compartilhado
   - Recebe estado do jogo do host
   - Envia inputs localmente

3. **Sincronização**:
   - Host envia estado completo a cada 100ms
   - Todos os jogadores enviam inputs a cada 16ms (~60fps)
   - Client recebe e aplica estado do host

## Configuração

### 1. Servidor WebSocket

```bash
cd server
npm install
npm start
```

O servidor roda em `ws://localhost:8080` por padrão.

### 2. Cliente

Configure a variável de ambiente:

```bash
# .env
VITE_WS_SERVER_URL=ws://localhost:8080
```

Para produção, use `wss://` (WebSocket seguro):

```bash
VITE_WS_SERVER_URL=wss://your-server.com
```

### 3. Deploy do Servidor

O servidor pode ser deployado em:
- **Node.js hosting**: Heroku, Railway, Render, etc.
- **VPS**: DigitalOcean, AWS EC2, etc.
- **Serverless**: Adapte para AWS Lambda + API Gateway

**Exemplo Railway**:
1. Conecte seu repositório
2. Configure `PORT` (Railway usa variável automática)
3. Deploy automático

## Uso

1. Inicie o servidor WebSocket
2. Abra o jogo em dois navegadores/dispositivos
3. Clique em "Multiplayer" no primeiro
4. Copie o link da URL (contém `?room=ABC123`)
5. Cole o link no segundo navegador
6. Aguarde ambos conectarem (2/2 jogadores)
7. Jogue!

## Troubleshooting

### Erro de Conexão

- Verifique se o servidor está rodando
- Confirme que `VITE_WS_SERVER_URL` está correto
- Verifique firewall/CORS se necessário

### Jogadores Não Conectam

- Certifique-se de que ambos usam o mesmo link
- Verifique console do navegador para erros
- Confirme que o servidor está acessível

### Lag/Desincronização

- Host deveria ter boa conexão (executa simulação)
- Reduza frequência de envio de estado se necessário
- Considere aumentar intervalo de envio de estado

## Melhorias Futuras

- [ ] Predição de movimento (client-side prediction)
- [ ] Interpolação de estado
- [ ] Reconexão automática
- [ ] Compressão de estado
- [ ] Suporte para mais de 2 jogadores
- [ ] Lobby com lista de salas

