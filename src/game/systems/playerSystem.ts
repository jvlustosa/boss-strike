import type { GameState } from '../core/types';
import { updatePlayer, firePlayerBullet } from '../entities/player';

export function playerSystem(state: GameState, dt: number): void {
  updatePlayer(state.player, state.keys, dt);
  firePlayerBullet(state);
}
