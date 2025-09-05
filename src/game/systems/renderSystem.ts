import type { GameState } from '../core/types';
import { colors } from '../core/assets';
import { LOGICAL_W, LOGICAL_H } from '../core/config';

export function renderSystem(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Clear screen
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Player
  if (state.player.alive) {
    ctx.fillStyle = colors.player;
    ctx.fillRect(state.player.pos.x, state.player.pos.y, state.player.w, state.player.h);
  }

  // Boss
  ctx.fillStyle = colors.boss;
  ctx.fillRect(state.boss.pos.x, state.boss.pos.y, state.boss.w, state.boss.h);
  
  // Boss arms
  ctx.fillStyle = colors.bossArm;
  for (const arm of state.boss.arms) {
    ctx.fillRect(arm.pos.x, arm.pos.y, arm.w, arm.h);
  }
  
  // Boss weak spot
  ctx.fillStyle = colors.bossWeakSpot;
  ctx.fillRect(state.boss.weakSpot.x, state.boss.weakSpot.y, state.boss.weakSpot.w, state.boss.weakSpot.h);

  // Bullets
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.from === 'player' ? colors.playerBullet : colors.bossBullet;
    ctx.fillRect(bullet.pos.x, bullet.pos.y, bullet.w, bullet.h);
  }

  // Boss HP Bar
  const hpBarW = 40;
  const hpBarH = 4;
  const hpBarX = (LOGICAL_W - hpBarW) / 2;
  const hpBarY = 4;
  
  // HP Background
  ctx.fillStyle = '#333';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  
  // HP Fill
  const hpPercent = state.boss.hp / state.boss.hpMax;
  ctx.fillStyle = hpPercent > 0.3 ? '#0f0' : '#f00';
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

  // Player Health Display
  ctx.fillStyle = '#0f0';
  for (let i = 0; i < state.player.health; i++) {
    ctx.fillRect(4 + i * 6, LOGICAL_H - 8, 4, 4);
  }
  
  // Empty health slots
  ctx.fillStyle = '#333';
  for (let i = state.player.health; i < state.player.maxHealth; i++) {
    ctx.fillRect(4 + i * 6, LOGICAL_H - 8, 4, 4);
  }
}
