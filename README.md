# Boss Strike 🎮

Um jogo de batalha contra boss em estilo retro, desenvolvido com React + TypeScript + Vite.

## 💖 História do Projeto

Este jogo foi **idealizado pelo meu irmãozinho Dudu Lustosa** e desenvolvido em apenas **1 dia**! 🚀

A versão inicial nasceu da criatividade e imaginação de uma criança, mostrando como ideias simples podem se transformar em projetos incríveis quando colocamos amor e dedicação.

### 👨‍👩‍👧‍👦 Para Famílias

**Se você também tem um irmãozinho, filho ou filha e quer incentivar ele ou ela, aproveite esse repositório!** 

Este projeto é um exemplo perfeito de como:
- Transformar ideias de crianças em realidade
- Ensinar programação de forma divertida
- Criar memórias especiais em família
- Mostrar que qualquer ideia pode virar um jogo real

Sinta-se à vontade para usar este código como base para criar jogos com as crianças da sua vida. A programação pode ser uma ferramenta incrível para dar vida aos sonhos! ✨

## 🚀 Deploy no Vercel

### Opção 1: Deploy via GitHub (Recomendado)

1. **Faça push do código para o GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Conecte ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub
   - Clique em "New Project"
   - Importe o repositório do GitHub
   - O Vercel detectará automaticamente as configurações

3. **Configurações automáticas:**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Opção 2: Deploy via Vercel CLI

1. **Instale o Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Faça login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

## 🎯 Funcionalidades

- ✅ Controles de teclado (WASD/Arrow Keys + Space)
- ✅ Controles touch para mobile (Playroom Joystick)
- ✅ **Modo Multiplayer** - Jogue com 2 jogadores simultaneamente!
  - **WebSocket Multiplayer**: Conecte jogadores pela mesma URL (room ID)
  - **Playroom Multiplayer**: Usando PlayroomKit (mobile)
- ✅ Sistema de níveis progressivos
- ✅ Sistema de pontuação e vitórias
- ✅ Efeitos sonoros
- ✅ Interface responsiva
- ✅ Pause/Resume
- ✅ Menu principal
- ✅ Logo pixel art personalizado
- ✅ Favicon SVG otimizado

## 🛠️ Desenvolvimento Local

### Cliente (Frontend)

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Servidor WebSocket (Multiplayer)

```bash
# Entrar na pasta do servidor
cd server

# Instalar dependências
npm install

# Executar servidor
npm start

# Ou em modo desenvolvimento (auto-reload)
npm run dev
```

O servidor roda na porta 8080 por padrão. Configure `VITE_WS_SERVER_URL` no arquivo `.env` para apontar para o servidor.

**Exemplo `.env`:**
```
VITE_WS_SERVER_URL=ws://localhost:8080
```

## 📱 Compatibilidade

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Controles**: Teclado (desktop) + Touch (mobile)

## 🎮 Como Jogar

### Modo Single Player
1. **Movimento**: WASD ou Arrow Keys
2. **Atirar**: Space
3. **Pausar**: ESC
4. **Objetivo**: Destrua o boss atirando no ponto fraco (amarelo)

### Modo Multiplayer (WebSocket)

1. **Inicie o servidor WebSocket**:
   ```bash
   cd server
   npm start
   ```

2. **Jogador 1 (Host)**:
   - Abra o jogo e clique em "Multiplayer"
   - Um código de sala será gerado (ex: `ABC123`)
   - Compartilhe o link da URL com o segundo jogador

3. **Jogador 2**:
   - Abra o mesmo link compartilhado pelo Jogador 1
   - Aguarde a conexão (2/2 jogadores)

4. **Controles**:
   - **Jogador 1**: WASD + Space (verde, esquerda)
   - **Jogador 2**: WASD + Space (vermelho, direita)
   - **Pausar**: ESC

5. **Objetivo**: Ambos os jogadores devem destruir o boss juntos!

**Nota**: O host executa a simulação do jogo e envia o estado para os outros jogadores. Todos os jogadores enviam seus inputs.

## 🔧 Tecnologias

- React 18
- TypeScript
- Vite
- Playroom Kit (joystick mobile)
- Canvas API
- Web Audio API

## 📄 Licença

MIT License
