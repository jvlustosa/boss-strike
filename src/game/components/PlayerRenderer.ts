import type { Player } from '../core/types';
import { colors, getSkinData } from '../core/assets';

/**
 * Componente dedicado para renderizar o player no canvas
 * Aplica estilos completos das skins incluindo gradientes, bordas, sombras e animações
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player
): void {
  if (!player.alive) {
    return;
  }

  // Obter dados da skin do sistema de assets
  const skinData = getSkinData();
  
  // Debug: log dos dados da skin
  if (skinData.textureName) {
    console.log('PlayerRenderer - Skin data:', {
      textureName: skinData.textureName,
      effectName: skinData.effectName,
      playerColor: skinData.playerColor,
      playerGlow: skinData.playerGlow,
    });
  }
  
  // Usar cor da skin se disponível, senão usar cor padrão
  const playerColor = skinData.playerColor || colors.player;
  const playerGlow = skinData.playerGlow || playerColor;

  const x = player.pos.x;
  const y = player.pos.y;
  const w = player.w;
  const h = player.h;

  ctx.save();

  // Aplicar estilos baseados no textureName PRIMEIRO
  if (skinData.textureName) {
    applySkinStyles(ctx, player, skinData, playerColor, playerGlow);
  } else {
    // Render padrão simples
    ctx.fillStyle = playerColor;
    ctx.fillRect(x, y, w, h);
  }

  // Aplicar efeitos adicionais DEPOIS (sobre os estilos da skin)
  if (skinData.effectName) {
    applyEffectStyles(ctx, player, skinData.effectName, playerColor, playerGlow);
  }

  // Aplicar brilho pulsante para skins lendárias e míticas
  if (skinData.rarity === 'legendary' || skinData.rarity === 'mythic') {
    applyRarityGlow(ctx, player, skinData.rarity, playerColor, playerGlow);
  }

  ctx.restore();
}

/**
 * Aplica estilos específicos da skin baseado no textureName
 */
function applySkinStyles(
  ctx: CanvasRenderingContext2D,
  player: Player,
  skinData: ReturnType<typeof getSkinData>,
  playerColor: string,
  playerGlow: string
): void {
  const x = player.pos.x;
  const y = player.pos.y;
  const w = player.w;
  const h = player.h;
  const time = Date.now() / 1000;
  const textureName = skinData.textureName!;

  console.log('applySkinStyles - textureName:', textureName, 'playerColor:', playerColor, 'playerGlow:', playerGlow);

  // Normalizar textureName para comparação
  const normalizedName = textureName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Fire Skin
  if (normalizedName.includes('fire')) {
    // Gradiente de fogo
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, playerGlow);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Brilho animado (flicker)
    const brightness = 1 + Math.sin(time * 10) * 0.1;
    ctx.globalAlpha = brightness;
    ctx.fillStyle = playerGlow;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Glow externo
    drawGlow(ctx, x, y, w, h, playerGlow, 2);
  }
  
  // Ice Skin
  else if (normalizedName.includes('ice')) {
    // Gradiente de gelo
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, playerGlow);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Shimmer animado
    const hue = (time * 30) % 360;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Borda e glow
    ctx.strokeStyle = playerGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    drawGlow(ctx, x, y, w, h, playerGlow, 1.5);
  }
  
  // Neon Skin
  else if (normalizedName.includes('neon')) {
    // Cor sólida neon
    ctx.fillStyle = playerColor;
    ctx.fillRect(x, y, w, h);
    
    // Borda neon
    ctx.strokeStyle = playerGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    // Glow intenso animado
    const glowIntensity = 0.5 + Math.sin(time * 8) * 0.3;
    drawGlow(ctx, x, y, w, h, playerGlow, 3 * glowIntensity);
    
    // Brilho interno
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = playerGlow;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = 1;
  }
  
  // Rainbow Skin
  else if (normalizedName.includes('rainbow')) {
    // Gradiente arco-íris animado
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    const hueOffset = (time * 60) % 360;
    gradient.addColorStop(0, `hsl(${(hueOffset + 0) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.25, `hsl(${(hueOffset + 60) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hueOffset + 120) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.75, `hsl(${(hueOffset + 180) % 360}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hueOffset + 240) % 360}, 100%, 50%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Glow branco
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.5)', 1);
  }
  
  // Gold Skin
  else if (normalizedName.includes('gold')) {
    // Gradiente dourado
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffed4e');
    gradient.addColorStop(1, '#ffd700');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Brilho animado
    const shine = 1 + Math.sin(time * 2) * 0.2;
    ctx.globalAlpha = shine;
    ctx.fillStyle = '#ffed4e';
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Borda e glow dourado
    ctx.strokeStyle = '#ffed4e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    drawGlow(ctx, x, y, w, h, '#ffd700', 2);
  }
  
  // Void Skin
  else if (normalizedName.includes('void')) {
    // Gradiente radial do vazio
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) / 2);
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, '#330066');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Pulso animado
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = playerGlow;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Borda e glow roxo
    ctx.strokeStyle = playerGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    drawGlow(ctx, x, y, w, h, playerGlow, 2.5);
  }
  
  // Basic Skins (blue, red, green)
  else if (normalizedName.includes('basic')) {
    // Cor sólida com borda
    ctx.fillStyle = playerColor;
    ctx.fillRect(x, y, w, h);
    
    // Borda sutil
    ctx.strokeStyle = playerGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
  
  // Mythic Rainbow Skins
  else if (normalizedName.includes('mythic')) {
    // Gradiente arco-íris complexo
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    const hueOffset = (time * 90) % 360;
    for (let i = 0; i <= 1; i += 0.1) {
      gradient.addColorStop(i, `hsl(${(hueOffset + i * 360) % 360}, 100%, 50%)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Múltiplos glows
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.6)', 2);
    drawGlow(ctx, x, y, w, h, 'rgba(255, 0, 255, 0.4)', 3);
    drawGlow(ctx, x, y, w, h, 'rgba(0, 255, 255, 0.3)', 4);
  }
  
  // Default - gradiente básico com borda e glow
  else {
    console.warn('Unknown textureName, using default style:', textureName);
    
    // Gradiente básico da cor para o glow
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, playerGlow);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // Borda
    ctx.strokeStyle = playerGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    // Glow sutil
    drawGlow(ctx, x, y, w, h, playerGlow, 1);
  }
  
  // Não fazer restore aqui - será feito no renderPlayer
}

/**
 * Aplica brilho pulsante para skins lendárias e míticas
 */
function applyRarityGlow(
  ctx: CanvasRenderingContext2D,
  player: Player,
  rarity: string,
  playerColor: string,
  playerGlow: string
): void {
  const x = player.pos.x;
  const y = player.pos.y;
  const w = player.w;
  const h = player.h;
  const time = Date.now() / 1000;
  
  // Intensidade do pulso baseada no tempo
  const pulseIntensity = 0.3 + Math.sin(time * 3) * 0.2; // Pulso entre 0.3 e 0.5
  const glowSize = 1.5 + Math.sin(time * 2.5) * 0.5; // Tamanho do glow varia
  
  ctx.save();
  
  if (rarity === 'mythic') {
    // Brilho mítico - múltiplas camadas coloridas pulsantes
    const colors = [
      'rgba(255, 255, 255, ' + pulseIntensity + ')',
      'rgba(255, 0, 255, ' + (pulseIntensity * 0.7) + ')',
      'rgba(0, 255, 255, ' + (pulseIntensity * 0.5) + ')',
      'rgba(255, 255, 0, ' + (pulseIntensity * 0.4) + ')',
    ];
    
    // Aplicar múltiplos glows em camadas
    for (let i = 0; i < colors.length; i++) {
      drawGlow(ctx, x, y, w, h, colors[i], glowSize + i * 0.5);
    }
    
    // Brilho interno pulsante
    ctx.globalAlpha = pulseIntensity * 0.4;
    const innerGradient = ctx.createRadialGradient(
      x + w / 2, y + h / 2, 0,
      x + w / 2, y + h / 2, Math.max(w, h) / 2
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    innerGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.4)');
    innerGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  } else if (rarity === 'legendary') {
    // Brilho lendário - glow dourado/amarelo pulsante
    const glowColor = `rgba(255, 215, 0, ${pulseIntensity})`;
    drawGlow(ctx, x, y, w, h, glowColor, glowSize * 1.2);
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, ' + (pulseIntensity * 0.6) + ')', glowSize * 0.8);
    
    // Brilho interno dourado
    ctx.globalAlpha = pulseIntensity * 0.3;
    const innerGradient = ctx.createRadialGradient(
      x + w / 2, y + h / 2, 0,
      x + w / 2, y + h / 2, Math.max(w, h) / 2
    );
    innerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    innerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
}

/**
 * Desenha um efeito de glow ao redor do player
 */
function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  intensity: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  
  // Múltiplas camadas para efeito de glow
  for (let i = 1; i <= intensity; i++) {
    ctx.globalAlpha = (0.3 / intensity) * (intensity - i + 1);
    ctx.fillRect(x - i, y - i, w + i * 2, h + i * 2);
  }
  
  ctx.restore();
}

/**
 * Aplica estilos de efeito ao player
 */
function applyEffectStyles(
  ctx: CanvasRenderingContext2D,
  player: Player,
  effectClass: string,
  playerColor: string,
  playerGlow: string
): void {
  const x = player.pos.x;
  const y = player.pos.y;
  const w = player.w;
  const h = player.h;

  const time = Date.now() / 1000;
  ctx.save();

  // Shiny Rare - adiciona brilho e sweep
  if (effectClass === 'effect-shiny-rare') {
    // Glow externo
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.4)', 2);
    
    // Sweep animado
    const sweepProgress = (time * 0.5) % 1;
    const sweepX = x + (w * sweepProgress);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(sweepX - 2, y, 4, h);
    ctx.globalAlpha = 1;
  }

  // Regular Holo - adiciona shimmer colorido
  if (effectClass === 'effect-regular-holo') {
    const hue = (time * 60) % 360;
    // Overlay colorido
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Glow pulsante
    const pulse = 0.5 + Math.sin(time * 3) * 0.3;
    drawGlow(ctx, x, y, w, h, `hsl(${hue}, 100%, 60%)`, 2 * pulse);
  }

  // V-Max - adiciona glow poderoso e pulso
  if (effectClass === 'effect-v-max') {
    const pulse = 1 + Math.sin(time * 4) * 0.2;
    drawGlow(ctx, x, y, w, h, playerGlow, 4 * pulse);
    
    // Brilho interno
    ctx.globalAlpha = 0.3 * pulse;
    ctx.fillStyle = playerGlow;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = 1;
  }

  // Shiny V - adiciona brilho intenso e múltiplos glows
  if (effectClass === 'effect-shiny-v') {
    // Múltiplos glows
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.5)', 2);
    drawGlow(ctx, x, y, w, h, playerGlow, 3);
    
    // Brilho interno pulsante
    const pulse = 0.6 + Math.sin(time * 6) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = 1;
  }

  // Secret Rare - adiciona glow especial e brilho
  if (effectClass === 'effect-secret-rare') {
    // Glow intenso
    const pulse = 1 + Math.sin(time * 2) * 0.3;
    drawGlow(ctx, x, y, w, h, playerGlow, 5 * pulse);
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.6)', 3 * pulse);
    
    // Brilho interno
    ctx.globalAlpha = 0.4 * pulse;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = 1;
  }

  // Rainbow Holo - adiciona shift de cores animado
  if (effectClass === 'effect-rainbow-holo') {
    const hue = (time * 120) % 360;
    // Overlay colorido animado
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Glow colorido
    drawGlow(ctx, x, y, w, h, `hsl(${hue}, 100%, 50%)`, 2);
  }

  // Radiant Holo - adiciona pulso radiante intenso
  if (effectClass === 'effect-radiant-holo') {
    const pulse = 0.7 + Math.sin(time * 2) * 0.3;
    // Glow pulsante
    drawGlow(ctx, x, y, w, h, playerGlow, 4 * pulse);
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.4)', 2 * pulse);
    
    // Brilho interno
    ctx.globalAlpha = pulse;
    ctx.fillStyle = playerGlow;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = 1;
  }

  // Cosmos Holo - adiciona efeito cósmico com partículas
  if (effectClass === 'effect-cosmos-holo') {
    // Glow cósmico
    drawGlow(ctx, x, y, w, h, 'rgba(255, 255, 255, 0.3)', 3);
    drawGlow(ctx, x, y, w, h, playerGlow, 2);
    
    // Efeito de estrelas/partículas
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      const particleX = x + (w * (0.2 + i * 0.3));
      const particleY = y + (h * 0.5);
      const particleTime = (time * 2 + i) % 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - particleTime})`;
      ctx.fillRect(particleX, particleY, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Reverse Holo - adiciona efeito reverso com linhas
  if (effectClass === 'effect-reverse-holo') {
    // Overlay escuro
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    
    // Linhas de scan
    const scanY = y + (h * ((time * 0.5) % 1));
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x, scanY, w, 1);
    ctx.globalAlpha = 1;
    
    // Glow sutil
    drawGlow(ctx, x, y, w, h, playerGlow, 1);
  }

  ctx.restore();
}

