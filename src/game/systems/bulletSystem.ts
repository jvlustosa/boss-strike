import type { GameState } from '../core/types';
import { updateBullets } from '../entities/bullet';

export function bulletSystem(state: GameState, dt: number): void {
  updateBullets(state.bullets, dt);
}
