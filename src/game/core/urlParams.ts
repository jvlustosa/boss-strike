import { getMaxLevel } from './levelLoader';

export function getLevelFromUrl(): number {
  try {
    const params = new URLSearchParams(window.location.search);
    const levelParam = params.get('nivel');
    
    console.log('🔍 URL Debug - Current URL:', window.location.href);
    console.log('🔍 URL Debug - Search params:', window.location.search);
    console.log('🔍 URL Debug - Level param:', levelParam);
    
    if (levelParam) {
      const level = parseInt(levelParam, 10);
      const maxLevel = getMaxLevel();
      
      console.log('🔍 URL Debug - Parsed level:', level);
      console.log('🔍 URL Debug - Max level:', maxLevel);
      console.log('🔍 URL Debug - Is valid number:', !isNaN(level));
      console.log('🔍 URL Debug - Is in range:', level >= 1 && level <= maxLevel);
      
      if (!isNaN(level) && level >= 1 && level <= maxLevel) {
        console.log('✅ URL Debug - Valid level found:', level);
        return level;
      } else {
        console.log('❌ URL Debug - Level out of range or invalid, returning 1');
      }
    }
    
    console.log('❌ URL Debug - No valid level param, returning 1');
    return 1;
  } catch (error) {
    console.error('❌ URL Debug - Error parsing URL params:', error);
    return 1;
  }
}

export function updateUrlLevel(level: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('nivel', level.toString());
  window.history.pushState(null, '', url.toString());
}

