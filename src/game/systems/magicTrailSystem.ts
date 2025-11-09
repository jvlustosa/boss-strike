import type { GameState, MagicTrailParticle } from '../core/types';
import { getSkinData } from '../core/assets';

let lastPlayerPos: { x: number; y: number } | null = null;
let trailCooldown = 0;

/**
 * Verifica se uma raridade é considerada rara (deve ter rastro)
 */
function isRareRarity(rarity: string | null): boolean {
  if (!rarity) return false;
  const rareRarities = ['rare', 'epic', 'legendary', 'mythic'];
  return rareRarities.includes(rarity.toLowerCase());
}

/**
 * Verifica se a skin é de arco-íris
 */
function isRainbowSkin(textureName: string | null): boolean {
  if (!textureName) return false;
  const normalized = textureName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.includes('rainbow') || normalized.includes('mythic');
}

/**
 * Verifica se a skin é smiley
 */
function isSmileySkin(textureName: string | null): boolean {
  if (!textureName) return false;
  const normalized = textureName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.includes('smiley') || normalized.includes('emoji');
}

/**
 * Retorna um emoji aleatório de smiley
 */
function getRandomSmileyEmoji(): string {
  const smileys = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'];
  return smileys[Math.floor(Math.random() * smileys.length)];
}

/**
 * Gera uma cor aleatória do espectro arco-íris
 */
function getRandomRainbowColor(): string {
  const rainbowColors = [
    '#ff0000', // Vermelho
    '#ff7f00', // Laranja
    '#ffff00', // Amarelo
    '#00ff00', // Verde
    '#0000ff', // Azul
    '#4b0082', // Índigo
    '#9400d3', // Violeta
    '#ff1493', // Rosa
  ];
  return rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
}

/**
 * Cria partículas de rastro quando o player se move (para skins raras)
 */
export function createMagicTrail(state: GameState): void {
  let skinData: ReturnType<typeof getSkinData>;
  try {
    skinData = getSkinData();
  } catch (error) {
    console.error('Error getting skin data in createMagicTrail:', error);
    lastPlayerPos = null;
    return;
  }
  
  // Verificar se é smiley skin (sempre tem rastro, independente da raridade)
  const isSmiley = isSmileySkin(skinData.textureName);
  
  // Apenas criar rastro se a skin for rara (rare, epic, legendary, mythic) ou smiley
  if (!skinData.textureName || (!isRareRarity(skinData.rarity) && !isSmiley)) {
    lastPlayerPos = null;
    return;
  }

  const player = state.player;
  const centerX = player.pos.x + player.w / 2;
  const centerY = player.pos.y + player.h / 2;

  // Se não há posição anterior, apenas armazenar a atual
  if (!lastPlayerPos) {
    lastPlayerPos = { x: centerX, y: centerY };
    return;
  }

  // Calcular distância movida
  const dx = centerX - lastPlayerPos.x;
  const dy = centerY - lastPlayerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Criar partículas apenas se o player se moveu significativamente
  if (distance > 0.5 && trailCooldown <= 0) {
    const isRainbow = isRainbowSkin(skinData.textureName);
    // Reuse isSmiley from above instead of recalculating
    
    // Para skins smiley, criar menos partículas (emojis) para evitar travamento
    // Para skins arco-íris, criar mais partículas
    const particleCount = isSmiley
      ? 1 + Math.floor(Math.random() * 1) // 1-2 emojis para smiley (reduzido)
      : isRainbow 
        ? 3 + Math.floor(Math.random() * 3) // 3-5 partículas para arco-íris
        : 2 + Math.floor(Math.random() * 2); // 2-3 partículas normais
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * player.w * 0.8;
      const offsetY = (Math.random() - 0.5) * player.h * 0.8;
      
      // Para skins arco-íris, usar cor aleatória do espectro
      // Para outras skins, usar a cor da skin
      const trailColor = isRainbow
        ? getRandomRainbowColor()
        : (skinData.playerGlow || skinData.playerColor || '#00ccff').trim();
      
      const particle: MagicTrailParticle = {
        pos: {
          x: lastPlayerPos.x + offsetX,
          y: lastPlayerPos.y + offsetY,
        },
        life: 0.8 + Math.random() * 0.4, // 0.8 a 1.2 segundos
        maxLife: 0.8 + Math.random() * 0.4,
        size: isSmiley
          ? 8 + Math.random() * 2 // 8-10 pixels para emojis (reduzido para performance)
          : isRainbow 
            ? 2 + Math.random() * 2 // 2-4 pixels para arco-íris (mais visível)
            : 1.5 + Math.random() * 1.5, // 1.5 a 3 pixels normais
        alpha: 0.6 + Math.random() * 0.3, // 0.6 a 0.9
        color: trailColor,
        emoji: isSmiley ? getRandomSmileyEmoji() : undefined,
      };
      
      state.magicTrailParticles.push(particle);
    }
    
    trailCooldown = isSmiley ? 0.1 : (isRainbow ? 0.03 : 0.05); // Menos frequente para smiley (reduzir travamento)
  }

  // Atualizar posição anterior
  lastPlayerPos = { x: centerX, y: centerY };
}

/**
 * Atualiza e remove partículas de rastro
 */
export function updateMagicTrail(state: GameState, dt: number): void {
  // Atualizar cooldown
  if (trailCooldown > 0) {
    trailCooldown -= dt;
  }

  // Atualizar partículas existentes
  for (let i = state.magicTrailParticles.length - 1; i >= 0; i--) {
    const particle = state.magicTrailParticles[i];
    
    // Reduzir vida
    particle.life -= dt;
    
    // Atualizar alpha (fade out)
    particle.alpha = (particle.life / particle.maxLife) * 0.8;
    
    // Reduzir tamanho gradualmente
    particle.size *= 0.98;
    
    // Remover partículas mortas ou muito pequenas
    if (particle.life <= 0 || particle.size < 0.5) {
      state.magicTrailParticles.splice(i, 1);
    }
  }
}

/**
 * Limpa o rastro (chamado quando a skin muda ou o jogo reinicia)
 */
export function clearMagicTrail(): void {
  lastPlayerPos = null;
  trailCooldown = 0;
}

