import type { Bomb, GameState, LevelConfig } from './types';
import { LOGICAL_W, LOGICAL_H, PLAYER_W, PLAYER_H, BOSS_W, BOSS_H } from './config';
import { getLevelConfig } from './levelLoader';

function getMaxShieldsForLevel(level: number): number {
  // Configuração de escudos por nível
  const config: Record<number, { base: number; rare?: number }> = {
    1: { base: 0 },
    2: { base: 0 },
    3: { base: 1 },
    4: { base: 1 },
    5: { base: 0 },
    6: { base: 1, rare: 2 },
    7: { base: 1, rare: 2 },
    8: { base: 2 },
    9: { base: 3 },
    10: { base: 4 },
  };
  
  const levelConfig = config[level] || { base: 0 };
  
  // Se tem opção rara, 30% de chance de usar o número maior (determinado uma vez no início do nível)
  if (levelConfig.rare && Math.random() < 0.3) {
    return levelConfig.rare;
  }
  
  return levelConfig.base;
}

export function createBombForLevel(levelConfig: LevelConfig): Bomb | null {
  const fraction = levelConfig.bombDamageFraction;
  if (!fraction || fraction <= 0) {
    return null;
  }

  const size = 8;
  const safeMargin = 8;
  const minY = LOGICAL_H * 0.55;
  const maxY = LOGICAL_H - size - safeMargin;

  const bomb: Bomb = {
    pos: {
      x: safeMargin + Math.random() * (LOGICAL_W - size - safeMargin * 2),
      y: Math.max(minY, Math.min(maxY, minY + Math.random() * (maxY - minY))),
    },
    w: size,
    h: size,
    state: 'idle',
    speed: 70,
    damageFraction: fraction,
    floatTimer: 0,
    aimAngle: Math.PI / 4,
    aimDirection: 1,
  };

  return bomb;
}

export function createInitialState(level: number = 1): GameState {
  const levelConfig = getLevelConfig(level);
  const bombFraction = levelConfig.bombDamageFraction;
  const bombEnabled = !!bombFraction && bombFraction > 0;
  return {
    time: 0,
    level,
    levelConfig,
    player: {
      pos: { x: LOGICAL_W / 2 - PLAYER_W / 2, y: LOGICAL_H - PLAYER_H - 4 },
      w: PLAYER_W,
      h: PLAYER_H,
      speed: 60,
      cooldown: 0,
      alive: true,
      health: 5,
      maxHealth: 5,
      shieldHits: 0,
    },
    boss: {
      pos: { x: LOGICAL_W / 2 - BOSS_W / 2, y: 8 },
      w: BOSS_W,
      h: BOSS_H,
      weakSpot: { x: LOGICAL_W / 2 - 4, y: 12, w: 8, h: 8 },
      hp: levelConfig.bossHp,
      hpMax: levelConfig.bossHp,
      moveAngle: 0,
      moveTimer: 0,
      shootTimer: 0,
      patternPhase: 0,
      arms: [
        {
          pos: { x: LOGICAL_W / 2 - BOSS_W / 2 - 8, y: 16 },
          w: 6,
          h: 3,
          angle: 0,
          shootCooldown: 0,
          moveSpeed: levelConfig.armMoveSpeed,
        },
        {
          pos: { x: LOGICAL_W / 2 + BOSS_W / 2 + 2, y: 16 },
          w: 6,
          h: 3,
          angle: 0,
          shootCooldown: 0,
          moveSpeed: levelConfig.armMoveSpeed,
        },
      ],
    },
    bullets: [],
    hearts: [],
    heartsSpawnedThisLevel: 0,
    shields: [],
    shieldsSpawnedThisLevel: 0,
    maxShieldsThisLevel: getMaxShieldsForLevel(level),
    shieldCooldown: 0,
    explosionParticles: [],
    smokeParticles: [],
    shieldFragments: [],
    magicTrailParticles: [],
    damageNumbers: [],
    bomb: null,
    bombUsedThisLevel: !bombEnabled,
    bombSpawnTimer: 0,
    scorchMarks: [],
    bossShakeTimer: 0,
    keys: {},
    status: 'menu',
    victoryTimer: 0,
    restartTimer: 0,
  };
}
