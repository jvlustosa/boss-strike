import type { GameState } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from '../entities/boss';
import { audioManager } from '../core/audio';
import { createBulletExplosion } from './explosionSystem';
import { createBombForLevel } from '../core/state';

const BOMB_SPAWN_DELAY = 5; // seconds before bomb appears
const SCORCH_LIFETIME = 2; // seconds scorch remains

const PLAYER_AABB = (state: GameState) => ({
  x: state.player.pos.x,
  y: state.player.pos.y,
  w: state.player.w,
  h: state.player.h,
});

export function bombSystem(state: GameState, dt: number): void {
  if (state.status !== 'playing') {
    return;
  }

  const fraction = state.levelConfig.bombDamageFraction;
  if (!fraction || fraction <= 0) {
    return;
  }

  if (!state.bomb) {
    if (state.bombUsedThisLevel) {
      return;
    }

    state.bombSpawnTimer += dt;
    if (state.bombSpawnTimer >= BOMB_SPAWN_DELAY) {
      const newBomb = createBombForLevel(state.levelConfig);
      if (newBomb) {
        state.bomb = newBomb;
      } else {
        state.bombUsedThisLevel = true;
      }
      state.bombSpawnTimer = 0;
    }
    return;
  }

  const bomb = state.bomb;
  const boss = state.boss;
  const player = state.player;

  bomb.floatTimer += dt;

  // Player touches bomb -> activate homing
  if (bomb.state === 'idle' && player.alive) {
    const bombBox = { x: bomb.pos.x, y: bomb.pos.y, w: bomb.w, h: bomb.h };
    if (aabbCollision(PLAYER_AABB(state), bombBox)) {
      bomb.state = 'homing';
      audioManager.playSound('shoot', 0.3, 0.3);
    }
  }

  if (bomb.state === 'homing') {
    if (boss.hp <= 0) {
      state.bomb = null;
      state.bombUsedThisLevel = true;
      return;
    }

    const bombCenterX = bomb.pos.x + bomb.w / 2;
    const bombCenterY = bomb.pos.y + bomb.h / 2;
    const bossCenterX = boss.pos.x + boss.w / 2;
    const bossCenterY = boss.pos.y + boss.h / 2;

    const dirX = bossCenterX - bombCenterX;
    const dirY = bossCenterY - bombCenterY;
    const distance = Math.hypot(dirX, dirY);

    if (distance > 0) {
      const normalizedX = dirX / distance;
      const normalizedY = dirY / distance;
      const step = bomb.speed * dt;

      bomb.pos.x += normalizedX * step;
      bomb.pos.y += normalizedY * step;
    }

    // Check collision with boss body (weak spot or general hitbox)
    const bombBox = { x: bomb.pos.x, y: bomb.pos.y, w: bomb.w, h: bomb.h };
    const bossBox = { x: boss.pos.x, y: boss.pos.y, w: boss.w, h: boss.h };

    if (aabbCollision(bombBox, bossBox)) {
      applyBombDamage(state);
    }
  }
}

function applyBombDamage(state: GameState): void {
  const bomb = state.bomb;
  if (!bomb) return;

  const boss = state.boss;
  if (boss.hp <= 0) {
    state.bomb = null;
    state.bombUsedThisLevel = true;
    return;
  }

  const rawDamage = boss.hpMax * bomb.damageFraction;
  const damage = Math.max(1, Math.round(rawDamage));

  damageBoss(boss, damage, state, false);
  audioManager.playSound('boss_hit', 0.4, 0.3);
  createBulletExplosion(state, bomb.pos.x, bomb.pos.y, bomb.w, bomb.h);
  state.scorchMarks.push({
    pos: { x: bomb.pos.x, y: bomb.pos.y },
    size: bomb.w + 4,
    life: SCORCH_LIFETIME,
    maxLife: SCORCH_LIFETIME,
  });

  state.bomb = null;
  state.bombUsedThisLevel = true;
  state.bombSpawnTimer = 0;
}

