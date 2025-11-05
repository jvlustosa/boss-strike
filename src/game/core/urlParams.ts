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
      const maxLevel = getMaxLevel();
      
      if (DEBUG_LOGS) {
        console.log('🔍 URL Debug - Parsed level:', level);
        console.log('🔍 URL Debug - Max level:', maxLevel);
        console.log('🔍 URL Debug - Is valid number:', !isNaN(level));
        console.log('🔍 URL Debug - Is in range:', level >= 1 && level <= maxLevel);
      }
      
      if (!isNaN(level) && level >= 1 && level <= maxLevel) {
        if (DEBUG_LOGS) {
          console.log('✅ URL Debug - Valid level found:', level);
        }
        return level;
      } else {
        if (DEBUG_LOGS) {
          console.log('❌ URL Debug - Level out of range or invalid, returning 1');
        }
      }
    }
    
    if (DEBUG_LOGS) {
      console.log('❌ URL Debug - No valid level param, returning 1');
    }
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

export function getRoomIdFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || null;
  } catch (error) {
    console.error('Error getting room ID from URL:', error);
    return null;
  }
}

export function updateUrlRoom(roomId: string | null): void {
  const url = new URL(window.location.href);
  if (roomId) {
    url.searchParams.set('room', roomId);
  } else {
    url.searchParams.delete('room');
  }
  window.history.pushState(null, '', url.toString());
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

