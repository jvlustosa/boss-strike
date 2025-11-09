/**
 * Sistema de hits críticos baseado em probabilidade
 * 1 em 30 chance de crítico (3.33%)
 */

const CRITICAL_PROBABILITY = 1 / 30; // 1 em 30 = 3.33%

/**
 * Verifica se um hit deve ser crítico baseado em probabilidade
 */
export function checkCriticalHit(): boolean {
  return Math.random() < CRITICAL_PROBABILITY;
}

/**
 * Função de compatibilidade (não faz nada, mantida para não quebrar código)
 */
export function resetHitCounter(): void {
  // Não precisa fazer nada com sistema de probabilidade
}

