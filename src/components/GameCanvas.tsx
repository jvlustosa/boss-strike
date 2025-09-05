import { useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../game/core/types';
import { createInitialState } from '../game/core/state';
import { LOGICAL_W, LOGICAL_H } from '../game/core/config';
import { createGameLoop } from '../game/engine/loop';
import { registerInput } from '../game/engine/input';
import { playerSystem } from '../game/systems/playerSystem';
import { bossSystem } from '../game/systems/bossSystem';
import { bulletSystem } from '../game/systems/bulletSystem';
import { collisionSystem } from '../game/systems/collisionSystem';
import { heartSystem } from '../game/systems/heartSystem';
import { renderSystem } from '../game/systems/renderSystem';
import { getLevelFromUrl, updateUrlLevel } from '../game/core/urlParams';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(getLevelFromUrl()));
  const restartTimerRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    
    // Pixel-perfect scaling
    const scale = Math.floor(Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H));
    canvas.width = LOGICAL_W * scale;
    canvas.height = LOGICAL_H * scale;
    scaleRef.current = scale;
    
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);
    
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvas(canvas);
    const state = stateRef.current;

    // Input setup
    const cleanupInput = registerInput(state.keys);

    // Game loop
    const update = (dt: number) => {
      if (state.status === 'playing') {
        state.time += dt;
        playerSystem(state, dt);
        bossSystem(state, dt);
        bulletSystem(state, dt);
        heartSystem(state, dt);
        collisionSystem(state);
      } else if (state.status === 'lost') {
        // Auto-restart after 2 seconds when player loses
        restartTimerRef.current += dt;
        if (restartTimerRef.current >= 2) {
          // Reset game state, mantendo o mesmo nível
          const next = createInitialState(state.level);
          
          // Preservar a referência do objeto keys para não quebrar o input
          const keysRef = state.keys;
          Object.assign(state, next);
          state.keys = keysRef;
          
          // Limpar qualquer tecla pressionada
          for (const key in keysRef) {
            keysRef[key] = false;
          }
          
          restartTimerRef.current = 0;
        }
      }
    };

    const render = () => {
      renderSystem(ctx, state);
    };

    const cleanupLoop = createGameLoop(update, render);

    // Resize handler
    const handleResize = () => {
      setupCanvas(canvas);
    };
    window.addEventListener('resize', handleResize);

    // Click handling for next level button
    const onClick = (e: MouseEvent) => {
      if (state.status !== 'won') return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleRef.current;
      const y = (e.clientY - rect.top) / scaleRef.current;
      const btn = (state as any)._nextBtn as { x: number; y: number; w: number; h: number } | undefined;
      if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        // Avançar para próxima fase
        const nextLevel = state.level + 1;
        updateUrlLevel(nextLevel);
        const next = createInitialState(nextLevel);
        
        // Preservar a referência do objeto keys para não quebrar o input
        const keysRef = state.keys;
        Object.assign(state, next);
        state.keys = keysRef;
        
        // Limpar qualquer tecla pressionada
        for (const key in keysRef) {
          keysRef[key] = false;
        }
        
        restartTimerRef.current = 0;
      }
    };
    canvas.addEventListener('click', onClick);

    return () => {
      cleanupInput();
      cleanupLoop();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', onClick);
    };
  }, [setupCanvas]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: '2px solid #333',
        display: 'block',
      }}
    />
  );
}
