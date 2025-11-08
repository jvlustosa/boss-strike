import { getMaxLevel } from './levelLoader';

// Debug flag - set to false to disable logs in production
const DEBUG_LOGS = false;

export function getLevelFromUrl(): number {
  try {
    const params = new URLSearchParams(window.location.search);
    const levelParam = params.get('nivel');
    
    if (DEBUG_LOGS) {
      console.log('🔍 URL Debug - Current URL:', window.location.href);
      console.log('🔍 URL Debug - Search params:', window.location.search);
      console.log('🔍 URL Debug - Level param:', levelParam);
    }
    
    if (levelParam) {
      const level = parseInt(levelParam, 10);
      
      if (DEBUG_LOGS) {
        console.log('🔍 URL Debug - Parsed level:', level);
        console.log('🔍 URL Debug - Is valid number:', !isNaN(level));
        console.log('🔍 URL Debug - Is positive:', level >= 1);
      }
      
      // Permitir qualquer nível positivo (getLevelConfig fará fallback se não existir)
      if (!isNaN(level) && level >= 1) {
        if (DEBUG_LOGS) {
          console.log('✅ URL Debug - Valid level found:', level);
        }
        return level;
      } else {
        if (DEBUG_LOGS) {
          console.log('❌ URL Debug - Invalid level, returning 1');
        }
      }
    }
    
    if (DEBUG_LOGS) {
      console.log('❌ URL Debug - No valid level param, returning 1');
    }
    return 1;
  } catch (error) {
    console.error('Error parsing URL params:', error);
    return 1;
  }
}

export function updateUrlLevel(level: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('nivel', level.toString());
  window.history.pushState(null, '', url.toString());
}

export function isCheatActive(cheatName: string): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('cheat') === cheatName;
  } catch (error) {
    return false;
  }
}

export function isJoystickDisabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const joystickParam = params.get('joystick');
    return joystickParam === 'false' || joystickParam === '0' || params.has('nojoystick');
  } catch (error) {
    return false;
  }
}

