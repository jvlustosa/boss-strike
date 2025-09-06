import type { GameState } from './types';
import { getMaxLevel } from './levelLoader';

export interface GameProgress {
  level: number;
  timestamp: number;
  victories: number;
}

const PROGRESS_KEY = 'bossStrikeProgress';
const VICTORIES_KEY = 'bossStrikeVictories';

export function saveProgress(gameState: GameState): void {
  const progress: GameProgress = {
    level: gameState.level,
    timestamp: Date.now(),
    victories: parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10)
  };
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadProgress(): GameProgress | null {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;
    
    const progress: GameProgress = JSON.parse(saved);
    
    // Verificar se o progresso não é muito antigo (opcional: 30 dias)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
    if (Date.now() - progress.timestamp > maxAge) {
      clearProgress();
      return null;
    }
    
    return progress;
  } catch (error) {
    console.warn('Erro ao carregar progresso:', error);
    return null;
  }
}

export function clearProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
}

export function hasProgress(): boolean {
  return loadProgress() !== null;
}

export function getLastLevel(): number {
  const progress = loadProgress();
  return progress?.level || 1;
}

export function getNextLevel(): number {
  const progress = loadProgress();
  if (!progress) return 1;
  
  // Retorna a próxima fase após a última vencida, mas não além do máximo
  const nextLevel = progress.level + 1;
  const maxLevel = getMaxLevel();
  return Math.min(nextLevel, maxLevel);
}

export function saveVictory(): void {
  const current = parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10);
  localStorage.setItem(VICTORIES_KEY, (current + 1).toString());
}

export function getVictoryCount(): number {
  return parseInt(localStorage.getItem(VICTORIES_KEY) || '0', 10);
}
