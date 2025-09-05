import type { GameState } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from './boss';

export function checkCollisions(state: GameState): void {
  const { bullets, boss, player } = state;

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

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (bullet.from === 'player') {
      // Check collision with boss weak spot
      if (aabbCollision(toAABB(bullet), boss.weakSpot)) {
        damageBoss(boss, 1);
        bullets.splice(i, 1);
        
        if (boss.hp <= 0) {
          state.status = 'won';
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
  
  if (state.player.health <= 0) {
    state.player.alive = false;
    state.status = 'lost';
  }
}
