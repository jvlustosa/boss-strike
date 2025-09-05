import type { GameState } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from './boss';
import { audioManager } from '../core/audio';
import { createBossExplosion } from '../systems/explosionSystem';

export function checkCollisions(state: GameState): void {
  const { bullets, boss, player, hearts } = state;

  // Helper para converter entidades com { pos, w, h } em AABB plano { x, y, w, h }
  const toAABB = (o: { pos: { x: number; y: number }; w: number; h: number }) => ({
    x: o.pos.x,
    y: o.pos.y,
    w: o.w,
    h: o.h,
  });

  // Verificar colisão player com braços do boss
  if (player.alive) {
    for (const arm of boss.arms) {
      if (aabbCollision(toAABB(player), toAABB(arm))) {
        damagePlayer(state);
        return;
      }
    }
  }

  // Verificar colisão player com corações
  if (player.alive && player.health < player.maxHealth) {
    for (const heart of hearts) {
      if (!heart.collected && aabbCollision(toAABB(player), toAABB(heart))) {
        heart.collected = true;
        player.health++;
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (bullet.from === 'player') {
      // Check collision with boss weak spot
      if (aabbCollision(toAABB(bullet), boss.weakSpot)) {
        damageBoss(boss, 1);
        bullets.splice(i, 1);
        
        if (boss.hp <= 0) {
          // Create explosion animation at boss current position and start victory timer
          createBossExplosion(state, boss.pos.x, boss.pos.y, boss.w, boss.h);
          state.victoryTimer = 1.5; // 1.5 seconds delay before victory screen
        }
      }
    } else if (bullet.from === 'boss') {
      // Boss bullets vs player collision
      if (player.alive && aabbCollision(toAABB(bullet), toAABB(player))) {
        damagePlayer(state);
        bullets.splice(i, 1);
      }
    }
  }
}

function damagePlayer(state: GameState): void {
  state.player.health--;
  
  // Play hit sound effect with random pitch variation
  audioManager.playRandomPitch('hit', 0.4, 0.8, 1.2);
  
  if (state.player.health <= 0) {
    state.player.alive = false;
    state.status = 'lost';
  }
}
