import type { GameState } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from '../entities/boss';
import { audioManager } from '../core/audio';
import { createBulletExplosion } from './explosionSystem';
import { createBombForLevel } from '../core/state';

const BOMB_SPAWN_DELAY = 5; // seconds before bomb appears
const SCORCH_LIFETIME = 2; // seconds scorch remains
const CARRIED_OFFSET_Y = 10;
const AIM_MIN = Math.PI / 4; // 45 degrees
const AIM_MAX = (3 * Math.PI) / 4; // 135 degrees
const AIM_SPEED = Math.PI * 0.64; // radians per second (additional 20% slower)

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

  // Player touches bomb -> start carrying
  if (bomb.state === 'idle' && player.alive) {
    const bombBox = { x: bomb.pos.x, y: bomb.pos.y, w: bomb.w, h: bomb.h };
    if (aabbCollision(PLAYER_AABB(state), bombBox)) {
      bomb.state = 'carried';
      bomb.floatTimer = 0;
      audioManager.playSound('shoot', 0.3, 0.3);
    }
  }

  if (bomb.state === 'carried') {
    const playerCenterX = player.pos.x + player.w / 2 - bomb.w / 2;
    const playerCenterY = player.pos.y - CARRIED_OFFSET_Y;
    bomb.pos.x = playerCenterX;
    bomb.pos.y = playerCenterY;

    bomb.aimAngle += bomb.aimDirection * AIM_SPEED * dt;
    if (bomb.aimAngle >= AIM_MAX) {
      bomb.aimAngle = AIM_MAX;
      bomb.aimDirection = -1;
    } else if (bomb.aimAngle <= AIM_MIN) {
      bomb.aimAngle = AIM_MIN;
      bomb.aimDirection = 1;
    }

    if (state.keys[' ']) {
      launchBomb(state, bomb);
    }

    // Allow collision with boss only after launch
    return;
  }

  if (bomb.state === 'thrown') {
    const step = bomb.speed * dt;
    bomb.pos.x += Math.cos(bomb.aimAngle) * step;
    bomb.pos.y -= Math.sin(bomb.aimAngle) * step;

    const bombBox = { x: bomb.pos.x, y: bomb.pos.y, w: bomb.w, h: bomb.h };
    const bossBox = { x: boss.pos.x, y: boss.pos.y, w: boss.w, h: boss.h };
    if (aabbCollision(bombBox, bossBox)) {
      applyBombDamage(state);
    }
  }
}

function launchBomb(state: GameState, bomb: NonNullable<GameState['bomb']>): void {
  bomb.state = 'thrown';
  bomb.speed = 140;
  audioManager.playSound('boss_shoot', 0.35, 0.2);
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
  state.bossShakeTimer = 2;

  state.bomb = null;
  state.bombUsedThisLevel = true;
  state.bombSpawnTimer = 0;
}

