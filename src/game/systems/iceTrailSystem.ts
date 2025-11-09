import type { GameState, IceTrailParticle } from '../core/types';
import { getSkinData } from '../core/assets';

let lastPlayerPos: { x: number; y: number } | null = null;
let trailCooldown = 0;

/**
 * Cria partículas de rastro de gelo quando o player se move
 */
export function createIceTrail(state: GameState): void {
  const skinData = getSkinData();
  
  // Apenas criar rastro se a skin for de gelo
  if (!skinData.textureName || !skinData.textureName.toLowerCase().includes('ice')) {
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
    // Criar 2-3 partículas pequenas
    const particleCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * player.w * 0.8;
      const offsetY = (Math.random() - 0.5) * player.h * 0.8;
      
      const particle: IceTrailParticle = {
        pos: {
          x: lastPlayerPos.x + offsetX,
          y: lastPlayerPos.y + offsetY,
        },
        life: 0.8 + Math.random() * 0.4, // 0.8 a 1.2 segundos
        maxLife: 0.8 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 1.5, // 1.5 a 3 pixels
        alpha: 0.6 + Math.random() * 0.3, // 0.6 a 0.9
      };
      
      state.iceTrailParticles.push(particle);
    }
    
    trailCooldown = 0.05; // Criar partículas a cada 0.05 segundos
  }

  // Atualizar posição anterior
  lastPlayerPos = { x: centerX, y: centerY };
}

/**
 * Atualiza e remove partículas de rastro de gelo
 */
export function updateIceTrail(state: GameState, dt: number): void {
  // Atualizar cooldown
  if (trailCooldown > 0) {
    trailCooldown -= dt;
  }

  // Atualizar partículas existentes
  for (let i = state.iceTrailParticles.length - 1; i >= 0; i--) {
    const particle = state.iceTrailParticles[i];
    
    // Reduzir vida
    particle.life -= dt;
    
    // Atualizar alpha (fade out)
    particle.alpha = (particle.life / particle.maxLife) * 0.8;
    
    // Reduzir tamanho gradualmente
    particle.size *= 0.98;
    
    // Remover partículas mortas ou muito pequenas
    if (particle.life <= 0 || particle.size < 0.5) {
      state.iceTrailParticles.splice(i, 1);
    }
  }
}

/**
 * Limpa o rastro (chamado quando a skin muda ou o jogo reinicia)
 */
export function clearIceTrail(): void {
  lastPlayerPos = null;
  trailCooldown = 0;
}

