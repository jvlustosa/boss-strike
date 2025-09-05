import type { Bullet } from '../core/types';
import { LOGICAL_W, LOGICAL_H } from '../core/config';

export function updateBullet(bullet: Bullet, dt: number): void {
  bullet.pos.x += bullet.vel.x * dt;
  bullet.pos.y += bullet.vel.y * dt;
}

export function isBulletOutOfBounds(bullet: Bullet): boolean {
  return (
    bullet.pos.x + bullet.w < 0 ||
    bullet.pos.x > LOGICAL_W ||
    bullet.pos.y + bullet.h < 0 ||
    bullet.pos.y > LOGICAL_H
  );
}

export function updateBullets(bullets: Bullet[], dt: number): void {
  for (let i = bullets.length - 1; i >= 0; i--) {
    updateBullet(bullets[i], dt);
    
    if (isBulletOutOfBounds(bullets[i])) {
      bullets.splice(i, 1);
    }
  }
}
