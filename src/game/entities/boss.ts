import type { Boss } from '../core/types';

export function updateBoss(boss: Boss, dt: number): void {
  // MVP: boss estático, só recebe dano
  // Atualizar posição do weak spot relativo ao boss
  boss.weakSpot.x = boss.pos.x + boss.w / 2 - boss.weakSpot.w / 2;
  boss.weakSpot.y = boss.pos.y + boss.h / 2 - boss.weakSpot.h / 2;
}

export function damageBoss(boss: Boss, damage: number): void {
  boss.hp = Math.max(0, boss.hp - damage);
}
