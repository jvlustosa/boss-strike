import React, { useEffect, useRef, useCallback } from 'react';
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
import { updateExplosionSystem } from '../game/systems/explosionSystem';
import { getLevelFromUrl, updateUrlLevel } from '../game/core/urlParams';
import { MobileControlsLayout } from './MobileControlsLayout';
import { MobileCredits } from './MobileCredits';
import { SubtleLogger } from './SubtleLogger';

interface GameCanvasProps {
  isPaused: boolean;
  onGameStateChange?: (gameState: GameState) => void;
}

export function GameCanvas({ isPaused, onGameStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(1)); // Always start at level 1
  const scaleRef = useRef<number>(1);
  const isTransitioningRef = useRef(false);

  // Start the game when component mounts
  React.useEffect(() => {
    if (stateRef.current.status === 'menu') {
      stateRef.current.status = 'playing';
    }
  }, []);

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

    // Handle ESC key for pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Toggle pause - this will be handled by the parent component
        // We'll dispatch a custom event
        window.dispatchEvent(new CustomEvent('togglePause'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Game loop
    const update = (dt: number) => {
      if (state.status === 'playing' && !isPaused) {
        state.time += dt;
        playerSystem(state, dt);
        bossSystem(state, dt);
        bulletSystem(state, dt);
        heartSystem(state, dt);
        collisionSystem(state);
        
        // Handle victory timer
        if (state.victoryTimer > 0) {
          state.victoryTimer -= dt;
          if (state.victoryTimer <= 0) {
            state.status = 'won';
            // Increment victory count
            const currentVictories = parseInt(localStorage.getItem('bossStrikeVictories') || '0', 10);
            localStorage.setItem('bossStrikeVictories', (currentVictories + 1).toString());
          }
        }
      } else if (state.status === 'lost') {
        // Auto-restart after 2 seconds when player loses
        state.restartTimer += dt;
        if (state.restartTimer >= 2) {
          console.log('Game: Restarting game...');
          
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
          
          // Force joystick cleanup on restart
          forceJoystickCleanup();
          
          // Reset all timers and state
          state.restartTimer = 0;
          state.victoryTimer = 0;
          state.time = 0;
          state.status = 'playing';
          
          console.log('Game: Restart completed');
        }
      }
      
      // Notify parent component of state changes
      if (onGameStateChange) {
        onGameStateChange(state);
      }
    };

    const render = () => {
      renderSystem(ctx, state, isPaused);
    };

    const cleanupLoop = createGameLoop(update, render);

    // Resize handler
    const handleResize = () => {
      setupCanvas(canvas);
    };
    window.addEventListener('resize', handleResize);

    // Click handling for next level button
    const onClick = (e: MouseEvent) => {
      if (state.status !== 'won' || isTransitioningRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleRef.current;
      const y = (e.clientY - rect.top) / scaleRef.current;
      const btn = (state as any)._nextBtn as { x: number; y: number; w: number; h: number } | undefined;
      if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        isTransitioningRef.current = true;
        console.log('Game: Transitioning to next level...');
        
        // Avançar para próxima fase
        const nextLevel = state.level + 1;
        updateUrlLevel(nextLevel);
        
        // Criar novo estado completamente
        const newState = createInitialState(nextLevel);
        
        // Preservar apenas o que é necessário
        const keysRef = state.keys;
        
        // Limpar estado atual
        state.bullets.length = 0;
        state.hearts.length = 0;
        state.explosionParticles.length = 0;
        state.smokeParticles.length = 0;
        
        // Aplicar novo estado
        Object.assign(state, newState);
        state.keys = keysRef;
        
        // Limpar qualquer tecla pressionada
        for (const key in keysRef) {
          keysRef[key] = false;
        }
        
        // Force joystick cleanup on level transition
        forceJoystickCleanup();
        
        // Reset timers
        state.restartTimer = 0;
        state.victoryTimer = 0;
        state.time = 0;
        
        // Garantir que o status seja 'playing'
        state.status = 'playing';
        
        // Forçar uma atualização do canvas
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderSystem(ctx, state, isPaused);
          }
        }
        
        console.log(`Game: Transition to level ${nextLevel} completed`);
        
        // Reset transition flag after a short delay
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 100);
      }
      
      // Always update explosion system (even when game is won/lost)
      updateExplosionSystem(state, 0);
    };
    canvas.addEventListener('click', onClick);

    return () => {
      cleanupInput();
      cleanupLoop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', onClick);
    };
  }, [setupCanvas, isPaused]);

  const handlePlayroomFire = () => {
    if ((window as any).handleTouchFire) {
      (window as any).handleTouchFire();
    }
  };

  // Soft restart joystick on game restart/level change (keep session alive)
  const forceJoystickCleanup = () => {
    // Clear input first
    if ((window as any).forceClearInput) {
      (window as any).forceClearInput();
    }
    
    // Dispatch custom event for soft restart (keeps Playroom session alive)
    window.dispatchEvent(new CustomEvent('forceJoystickCleanup'));
    
    // Reinitialize input system after a short delay
    setTimeout(() => {
      if ((window as any).forceReinitInput) {
        (window as any).forceReinitInput();
      }
    }, 100); // Shorter delay since we're keeping session alive
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #333',
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      <MobileControlsLayout onFire={handlePlayroomFire} />
      <MobileCredits visible={true} position="top-left" />
      {/* <SubtleLogger enabled={true} position="bottom-right" maxLogs={2} /> */}
    </>
  );
}
