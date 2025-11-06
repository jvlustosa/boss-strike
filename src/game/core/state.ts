import type { GameState } from './types';
import { LOGICAL_W, LOGICAL_H, PLAYER_W, PLAYER_H, BOSS_W, BOSS_H } from './config';
import { getLevelConfig } from './levelLoader';

export function createInitialState(level: number = 1, isMultiplayer: boolean = false): GameState {
  const levelConfig = getLevelConfig(level);
  
  const createPlayer = (x: number, y: number): Player => ({
    pos: { x, y },
    w: PLAYER_W,
    h: PLAYER_H,
    speed: 42, // Reduced from 60 (30% slower)
    cooldown: 0,
    alive: true,
    health: 5,
    maxHealth: 5,
  });

  const players = isMultiplayer ? [
    createPlayer(LOGICAL_W / 2 - PLAYER_W - 2, LOGICAL_H - PLAYER_H - 4), // Player 1 (left)
    createPlayer(LOGICAL_W / 2 + 2, LOGICAL_H - PLAYER_H - 4), // Player 2 (right)
  ] : [createPlayer(LOGICAL_W / 2 - PLAYER_W / 2, LOGICAL_H - PLAYER_H - 4)];

  return {
    time: 0,
    level,
    levelConfig,
    player: players[0], // Keep for backward compatibility
    players,
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
    explosionParticles: [],
    smokeParticles: [],
    keys: {},
    status: 'menu',
    victoryTimer: 0,
    restartTimer: 0,
    isMultiplayer,
  };
}
