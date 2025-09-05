import type { GameState } from '../core/types';
import { checkCollisions } from '../entities/collisions';

export function collisionSystem(state: GameState): void {
  checkCollisions(state);
}
