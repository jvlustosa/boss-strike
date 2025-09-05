import type { Player, GameState } from '../core/types';
import { LOGICAL_W, PLAYER_SPEED, FIRE_COOLDOWN } from '../core/config';
import { clamp } from '../engine/math';

export function updatePlayer(player: Player, keys: Record<string, boolean>, dt: number): void {
  if (!player.alive) return;

  // Movimento horizontal
  let moveX = 0;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  player.pos.x += moveX * PLAYER_SPEED * dt;
  player.pos.x = clamp(player.pos.x, 0, LOGICAL_W - player.w);

  // Cooldown do tiro
  if (player.cooldown > 0) {
    player.cooldown -= dt;
  }
}

export function canPlayerFire(player: Player, keys: Record<string, boolean>): boolean {
  return player.alive && player.cooldown <= 0 && (keys[' '] || keys['space']);
}

export function firePlayerBullet(state: GameState): void {
  const { player } = state;
  if (!canPlayerFire(player, state.keys)) return;

  state.bullets.push({
    pos: { x: player.pos.x + player.w / 2 - 1, y: player.pos.y },
    w: 2,
    h: 4,
    vel: { x: 0, y: -120 },
    from: 'player',
  });

  player.cooldown = FIRE_COOLDOWN;
}
