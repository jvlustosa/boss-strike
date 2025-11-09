import type { GameState } from '../core/types';

/**
 * Atualiza os números de dano (movimento e fade out)
 */
export function updateDamageNumbers(state: GameState, dt: number): void {
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const damageNumber = state.damageNumbers[i];
    
    // Atualizar posição
    damageNumber.pos.x += damageNumber.vel.x * dt;
    damageNumber.pos.y += damageNumber.vel.y * dt;
    
    // Reduzir velocidade vertical (gravidade leve)
    damageNumber.vel.y += 20 * dt;
    
    // Reduzir velocidade horizontal (fricção)
    damageNumber.vel.x *= 0.95;
    
    // Reduzir vida
    damageNumber.life -= dt;
    
    // Remover números mortos
    if (damageNumber.life <= 0) {
      state.damageNumbers.splice(i, 1);
    }
  }
}

