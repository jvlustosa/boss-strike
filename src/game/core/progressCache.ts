import type { GameState } from './types';
import { getMaxLevel } from './levelLoader';
import { supabase } from '../../utils/supabase';
import { checkAndUnlockSkins } from '../../utils/skins';

export interface GameProgress {
  level: number;
  timestamp: number;
  victories: number;
}

const PROGRESS_KEY = 'bossStrikeProgress';
const VICTORIES_KEY = 'bossStrikeVictories';

// Helper to get user ID - accepts optional userId parameter to use context when available
async function getCurrentUserId(userId?: string | null): Promise<string | null> {
  // If userId is provided (from context), use it
  if (userId) {
    return userId;
  }
  // Fallback: try to get from localStorage (set by AuthContext)
  const storedUserId = localStorage.getItem('supabase_user_id');
  if (storedUserId) {
    return storedUserId;
  }
  // Last resort: query Supabase directly (should rarely be needed)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function saveProgress(gameState: GameState): Promise<void> {
  const maxLevel = getMaxLevel();
  const reachedFinalLevel = gameState.status === 'won' && gameState.level >= maxLevel;
  const levelToSave = reachedFinalLevel
    ? 1
    : Math.max(
        1,
        Math.min(
          gameState.status === 'won' ? gameState.level + 1 : gameState.level,
          maxLevel,
        ),
      );

  const progress: GameProgress = {
    level: levelToSave,
    timestamp: Date.now(),
    victories: parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10)
  };
  
  // Save to localStorage (fallback)
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  
  // Sync to Supabase if user is logged in
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const { error } = await supabase
        .from('game_progress')
        .upsert({
          user_id: userId,
          level: progress.level,
          victories: progress.victories,
          last_played_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.warn('Failed to save progress to Supabase:', error);
      } else {
        // Check and unlock skins based on current progress
        checkAndUnlockSkins(userId, progress.level, progress.victories)
          .then((unlockedSkins) => {
            if (unlockedSkins.length > 0) {
              window.dispatchEvent(new CustomEvent('skinsUnlocked', { detail: unlockedSkins }));
            }
          })
          .catch(err => {
            console.warn('Error checking skin unlocks:', err);
          });
      }
    } catch (error) {
      console.warn('Error syncing progress to Supabase:', error);
    }
  }
}

export async function loadProgress(): Promise<GameProgress | null> {
  // Try to load from Supabase first if user is logged in
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('level, victories, last_played_at')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        const progress: GameProgress = {
          level: data.level,
          timestamp: new Date(data.last_played_at || Date.now()).getTime(),
          victories: data.victories,
        };
        
        // Sync to localStorage
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        localStorage.setItem(VICTORIES_KEY, progress.victories.toString());
        
        return progress;
      }
    } catch (error) {
      console.warn('Error loading progress from Supabase:', error);
    }
  }
  
  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;
    
    const progress: GameProgress = JSON.parse(saved);
    
    // Verificar se o progresso não é muito antigo (opcional: 30 dias)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
    if (Date.now() - progress.timestamp > maxAge) {
      await clearProgress();
      return null;
    }
    
    return progress;
  } catch (error) {
    console.warn('Erro ao carregar progresso:', error);
    return null;
  }
}

export async function clearProgress(): Promise<void> {
  localStorage.removeItem(PROGRESS_KEY);
  
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      await supabase
        .from('game_progress')
        .update({ level: 1, victories: 0 })
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Error clearing progress in Supabase:', error);
    }
  }
}

export async function hasProgress(): Promise<boolean> {
  const progress = await loadProgress();
  return progress !== null;
}

export async function getLastLevel(): Promise<number> {
  const progress = await loadProgress();
  return progress?.level || 1;
}

export async function getNextLevel(): Promise<number> {
  const progress = await loadProgress();
  if (!progress) return 1;
  const maxLevel = getMaxLevel();
  // progress.level is the last completed level, so next is progress.level + 1
  return Math.min(Math.max(progress.level + 1, 1), maxLevel);
}

export async function saveVictory(level: number): Promise<void> {
  // Só dar vitória a cada 5 níveis (5, 10, 15, etc.)
  if (level % 5 === 0) {
    const current = parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10);
    const newVictories = current + 1;
    localStorage.setItem(VICTORIES_KEY, newVictories.toString());
    
    // Sync to Supabase
    const userId = await getCurrentUserId();
    if (userId) {
      try {
        // First, get current progress to preserve level
        const { data: existingProgress } = await supabase
          .from('game_progress')
          .select('level')
          .eq('user_id', userId)
          .single();
        
        const currentLevel = existingProgress?.level || level;
        
        // Use upsert to ensure record exists, preserving level and updating victories
        const { error } = await supabase
          .from('game_progress')
          .upsert({
            user_id: userId,
            level: currentLevel,
            victories: newVictories,
            last_played_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Error saving victory to Supabase:', error);
        } else {
          // Check and unlock skins based on updated victories
          checkAndUnlockSkins(userId, currentLevel, newVictories)
            .then((unlockedSkins) => {
              if (unlockedSkins.length > 0) {
                window.dispatchEvent(new CustomEvent('skinsUnlocked', { detail: unlockedSkins }));
              }
            })
            .catch(err => {
              console.warn('Error checking skin unlocks:', err);
            });
        }
      } catch (error) {
        console.error('Error saving victory to Supabase:', error);
      }
    }
  }
}

export async function getVictoryCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const { data } = await supabase
        .from('game_progress')
        .select('victories')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        const count = data.victories;
        localStorage.setItem(VICTORIES_KEY, count.toString());
        return count;
      }
    } catch (error) {
      console.warn('Error loading victory count from Supabase:', error);
    }
  }
  
  return parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10);
}

export async function clearVictories(): Promise<void> {
  localStorage.removeItem(VICTORIES_KEY);
  
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      await supabase
        .from('game_progress')
        .update({ victories: 0 })
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Error clearing victories in Supabase:', error);
    }
  }
}