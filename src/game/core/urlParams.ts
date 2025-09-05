import { getMaxLevel } from './levelLoader';

export function getLevelFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  const levelParam = params.get('nivel');
  
  if (levelParam) {
    const level = parseInt(levelParam, 10);
    if (!isNaN(level) && level >= 1 && level <= getMaxLevel()) {
      return level;
    }
  }
  
  return 1;
}

export function updateUrlLevel(level: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('nivel', level.toString());
  window.history.pushState(null, '', url.toString());
}
