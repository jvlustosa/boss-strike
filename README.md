# Boss Strike 🎮

Um jogo de batalha contra boss em estilo retro, desenvolvido com React + TypeScript + Vite.

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
- ✅ Sistema de níveis progressivos
- ✅ Sistema de pontuação e vitórias
- ✅ Efeitos sonoros
- ✅ Interface responsiva
- ✅ Pause/Resume
- ✅ Menu principal
- ✅ Logo pixel art personalizado
- ✅ Favicon SVG otimizado

## 🛠️ Desenvolvimento Local

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

## 📱 Compatibilidade

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Controles**: Teclado (desktop) + Touch (mobile)

## 🎮 Como Jogar

1. **Movimento**: WASD ou Arrow Keys
2. **Atirar**: Space
3. **Pausar**: ESC
4. **Objetivo**: Destrua o boss atirando no ponto fraco (amarelo)

## 🔧 Tecnologias

- React 18
- TypeScript
- Vite
- Playroom Kit (joystick mobile)
- Canvas API
- Web Audio API

## 📄 Licença

MIT License
