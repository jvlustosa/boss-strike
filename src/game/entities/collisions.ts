import type { GameState } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from './boss';

export function checkCollisions(state: GameState): void {
  const { bullets, boss, player } = state;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (bullet.from === 'player') {
      // Check collision with boss weak spot
      if (aabbCollision(bullet, boss.weakSpot)) {
        damageBoss(boss, 1);
        bullets.splice(i, 1);
        
        if (boss.hp <= 0) {
          state.status = 'won';
        }
      }
    }
    // TODO: boss bullets vs player collision (v2)
  }
}
