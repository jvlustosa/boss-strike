import type { GameState } from '../core/types';

export function updateScorchMarks(state: GameState, dt: number): void {
  const marks = state.scorchMarks;
  if (!marks.length) return;

  for (let i = marks.length - 1; i >= 0; i--) {
    const mark = marks[i];
    mark.life -= dt;
    if (mark.life <= 0) {
      marks.splice(i, 1);
    }
  }
}

