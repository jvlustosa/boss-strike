import type { GameState } from '../core/types';
import { updatePlayer, firePlayerBullet } from '../entities/player';

export function playerSystem(state: GameState, dt: number): void {
  // Update all players
  for (const player of state.players) {
    updatePlayer(player, state.keys, dt);
  }
  
  // Fire bullets for all players
  for (let i = 0; i < state.players.length; i++) {
    firePlayerBullet(state, i);
  }
}
