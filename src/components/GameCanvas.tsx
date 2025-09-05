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
import { renderSystem } from '../game/systems/renderSystem';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    
    // Pixel-perfect scaling
    const scale = Math.floor(Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H));
    canvas.width = LOGICAL_W * scale;
    canvas.height = LOGICAL_H * scale;
    
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
      if (state.status !== 'playing') return;

      state.time += dt;
      playerSystem(state, dt);
      bossSystem(state, dt);
      bulletSystem(state, dt);
      collisionSystem(state);
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

    return () => {
      cleanupInput();
      cleanupLoop();
      window.removeEventListener('resize', handleResize);
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
