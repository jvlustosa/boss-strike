import { useState, useCallback, useRef } from 'react';
import type { Skin } from '../utils/supabase-structure';

export function useSkinUnlock() {
  const [currentAnimation, setCurrentAnimation] = useState<Skin | null>(null);
  const queueRef = useRef<Skin[]>([]);

  const addUnlockedSkins = useCallback((skins: Skin[]) => {
    if (skins.length === 0) return;
    
    queueRef.current = [...queueRef.current, ...skins];
    
    // Start animation for first skin if none is currently showing
    if (!currentAnimation && queueRef.current.length > 0) {
      setCurrentAnimation(queueRef.current[0]);
      queueRef.current = queueRef.current.slice(1);
    }
  }, [currentAnimation]);

  const completeAnimation = useCallback(() => {
    if (queueRef.current.length > 0) {
      // Show next skin animation
      setCurrentAnimation(queueRef.current[0]);
      queueRef.current = queueRef.current.slice(1);
    } else {
      // All animations complete
      setCurrentAnimation(null);
    }
  }, []);

  return {
    currentAnimation,
    addUnlockedSkins,
    completeAnimation,
  };
}

