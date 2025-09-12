import type { Player, GameState } from '../core/types';
import { LOGICAL_W, LOGICAL_H, PLAYER_SPEED, FIRE_COOLDOWN } from '../core/config';
import { clamp } from '../engine/math';
import { audioManager } from '../core/audio';

export function updatePlayer(player: Player, keys: Record<string, boolean>, dt: number): void {
  if (!player.alive) return;

  // Movimento horizontal
  let moveX = 0;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  player.pos.x += moveX * PLAYER_SPEED * dt;
  player.pos.x = clamp(player.pos.x, 0, LOGICAL_W - player.w);

  // Movimento vertical
  let moveY = 0;
  if (keys['w'] || keys['arrowup']) moveY -= 1;
  if (keys['s'] || keys['arrowdown']) moveY += 1;

  player.pos.y += moveY * PLAYER_SPEED * dt;
  player.pos.y = clamp(player.pos.y, 0, LOGICAL_H - player.h);

  // Cooldown do tiro
  if (player.cooldown > 0) {
    player.cooldown -= dt;
  }
}

export function canPlayerFire(player: Player, keys: Record<string, boolean>): boolean {
  return player.alive && player.cooldown <= 0 && (keys[' '] || keys['space']);
}

export function firePlayerBullet(state: GameState, playerIndex: number = 0): void {
  const player = state.players[playerIndex];
  if (!player || !canPlayerFire(player, state.keys)) return;

  state.bullets.push({
    pos: { x: player.pos.x + player.w / 2 - 1, y: player.pos.y },
    w: 2,
    h: 4,
    vel: { x: 0, y: -120 },
    from: 'player',
  });

  player.cooldown = FIRE_COOLDOWN;
  
  // Play shoot sound effect with random pitch variation
  audioManager.playSound('shoot', 0.3, 0.4);
}
