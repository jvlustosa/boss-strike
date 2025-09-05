import type { GameState } from '../core/types';
import { updateBoss } from '../entities/boss';

export function bossSystem(state: GameState, dt: number): void {
  updateBoss(state.boss, dt, state.bullets, state.player, state.levelConfig);
}
