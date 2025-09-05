import type { GameState, Heart } from '../core/types';
import { LOGICAL_W, LOGICAL_H } from '../core/config';
import { random } from '../engine/math';

export function heartSystem(state: GameState, dt: number): void {
  // Spawn corações aleatoriamente (chance baixa por segundo)
  // Máximo 3 corações por nível e máximo 2 simultâneos no mapa
  if (Math.random() < 0.3 * dt && 
      state.hearts.length < 2 && 
      state.heartsSpawnedThisLevel < 3) {
    spawnHeart(state);
  }
  
  // Remover corações coletados
  state.hearts = state.hearts.filter(heart => !heart.collected);
}

function spawnHeart(state: GameState): void {
  // Evitar spawnar muito perto do jogador, boss ou nas bordas
  const margin = 16;
  const playerX = state.player.pos.x + state.player.w / 2;
  const playerY = state.player.pos.y + state.player.h / 2;
  const bossX = state.boss.pos.x + state.boss.w / 2;
  const bossY = state.boss.pos.y + state.boss.h / 2;
  
  let attempts = 0;
  let x, y;
  
  do {
    x = random(margin, LOGICAL_W - margin - 6);
    y = random(margin + 20, LOGICAL_H - margin - 6); // Evitar área do HUD
    attempts++;
  } while (
    attempts < 10 && (
      // Muito perto do jogador
      Math.abs(x - playerX) < 20 || Math.abs(y - playerY) < 20 ||
      // Muito perto do boss
      Math.abs(x - bossX) < 30 || Math.abs(y - bossY) < 25
    )
  );
  
  const heart: Heart = {
    pos: { x, y },
    w: 6,
    h: 6,
    collected: false,
  };
  
  state.hearts.push(heart);
  state.heartsSpawnedThisLevel++;
}
