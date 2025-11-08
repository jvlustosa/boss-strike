import type { GameState } from './types';
import { getMaxLevel } from './levelLoader';
import { supabase } from '../../utils/supabase';

export interface GameProgress {
  level: number;
  timestamp: number;
  victories: number;
}

const PROGRESS_KEY = 'bossStrikeProgress';
const VICTORIES_KEY = 'bossStrikeVictories';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function saveProgress(gameState: GameState): Promise<void> {
  const progress: GameProgress = {
    level: gameState.level,
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
  
  // Retorna a próxima fase após a última vencida, mas não além do máximo
  const nextLevel = progress.level + 1;
  const maxLevel = getMaxLevel();
  return Math.min(nextLevel, maxLevel);
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
        await supabase
          .from('game_progress')
          .update({ victories: newVictories })
          .eq('user_id', userId);
      } catch (error) {
        console.warn('Error saving victory to Supabase:', error);
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