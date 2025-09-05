import type { GameState } from './types';
import { LOGICAL_W, LOGICAL_H, PLAYER_W, PLAYER_H, BOSS_W, BOSS_H, BOSS_HP } from './config';

export function createInitialState(): GameState {
  return {
    time: 0,
    player: {
      pos: { x: LOGICAL_W / 2 - PLAYER_W / 2, y: LOGICAL_H - PLAYER_H - 4 },
      w: PLAYER_W,
      h: PLAYER_H,
      speed: 60,
      cooldown: 0,
      alive: true,
    },
    boss: {
      pos: { x: LOGICAL_W / 2 - BOSS_W / 2, y: 8 },
      w: BOSS_W,
      h: BOSS_H,
      weakSpot: { x: LOGICAL_W / 2 - 4, y: 12, w: 8, h: 8 },
      hp: BOSS_HP,
      hpMax: BOSS_HP,
    },
    bullets: [],
    keys: {},
    status: 'playing',
  };
}
