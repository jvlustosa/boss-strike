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

/**
 * Extract room ID from URL path: /room/ABC123
 * Falls back to query param for backwards compatibility: ?room=ABC123
 */
export function getRoomIdFromUrl(): string | null {
  try {
    // Try path-based first: /room/ABC123
    const pathMatch = window.location.pathname.match(/\/room\/([a-zA-Z0-9]+)/);
    if (pathMatch && pathMatch[1]) {
      console.log('[URL] Room ID from path:', pathMatch[1]);
      return pathMatch[1];
    }

    // Fallback to query params for backwards compatibility: ?room=ABC123
    const params = new URLSearchParams(window.location.search);
    const roomQuery = params.get('room');
    if (roomQuery) {
      console.log('[URL] Room ID from query:', roomQuery);
      return roomQuery;
    }

    console.log('[URL] No room ID found in URL');
    return null;
  } catch (error) {
    console.error('Error getting room ID from URL:', error);
    return null;
  }
}

/**
 * Update URL with room ID using path-based routing: /room/ABC123
 * Preserves existing query parameters
 */
export function updateUrlRoom(roomId: string | null): void {
  try {
    const url = new URL(window.location.href);
    
    if (roomId) {
      // Use path-based routing: /room/ABC123
      const pathWithRoom = `/room/${roomId}`;
      
      // Preserve query params
      const newUrl = `${pathWithRoom}${url.search}`;
      
      console.log('[URL] Updating to:', newUrl);
      window.history.pushState(null, '', newUrl);
    } else {
      // Remove room from path
      const pathWithoutRoom = url.pathname.replace(/\/room\/[a-zA-Z0-9]+\/?/, '');
      const newUrl = `${pathWithoutRoom || '/'}${url.search}`;
      
      console.log('[URL] Removing room, updating to:', newUrl);
      window.history.pushState(null, '', newUrl);
    }
  } catch (error) {
    console.error('Error updating URL room:', error);
  }
}

/**
 * Generate a random room ID (6 uppercase alphanumeric)
 */
export function generateRoomId(): string {
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log('[URL] Generated new room ID:', id);
  return id;
}

