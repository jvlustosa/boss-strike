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
import { saveProgress, saveVictory } from '../game/core/progressCache';
import { MobileControlsLayout } from './MobileControlsLayout';
import { MobileCredits } from './MobileCredits';
import { DesktopControls } from './DesktopControls';
import { DesktopCredits } from './DesktopCredits';

interface GameCanvasProps {
  isPaused: boolean;
  onGameStateChange?: (gameState: GameState) => void;
  isMultiplayer?: boolean;
}

export function GameCanvas({ isPaused, onGameStateChange, isMultiplayer = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get initial level from URL with error handling
  const getInitialLevel = () => {
    try {
      const level = getLevelFromUrl();
      // Debug logs disabled for production
      return level;
    } catch (error) {
      console.warn('🎮 GameCanvas Debug - Error getting level from URL, defaulting to 1:', error);
      return 1;
    }
  };
  
  const initialLevel = getInitialLevel();
  const stateRef = useRef<GameState>(createInitialState(initialLevel, isMultiplayer)); // Start with level from URL
  const scaleRef = useRef<number>(1);
  const isTransitioningRef = useRef(false);

  // Start the game when component mounts
  React.useEffect(() => {
    // Recriar estado se o nível mudou na URL
    const currentLevel = getLevelFromUrl();
    if (stateRef.current.level !== currentLevel) {
      console.log('🎮 GameCanvas Debug - Level changed in URL, recreating state from', stateRef.current.level, 'to', currentLevel);
      stateRef.current = createInitialState(currentLevel, isMultiplayer);
    }
    
    if (stateRef.current.status === 'menu') {
      stateRef.current.status = 'playing';
    }
    
    // For multiplayer mode, the PlayroomSessionScreen will handle waiting for 2 players
    // and call onSessionReady() when ready, so we can start immediately here
    if (onGameStateChange) {
      onGameStateChange(stateRef.current);
    }
  }, [onGameStateChange, isMultiplayer]);

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
        // Save progress when pausing
        if (state.status === 'playing') {
          saveProgress(state);
        }
        // Toggle pause - this will be handled by the parent component
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
            // Save victory and progress
            saveVictory();
            saveProgress(state);
          }
        }
      } else if (state.status === 'lost') {
        // Auto-restart after 2 seconds when player loses
        state.restartTimer += dt;
        if (state.restartTimer >= 2) {
          console.log('Game: Restarting game...');
          
          // Reset game state, mantendo o mesmo nível
          const next = createInitialState(state.level, isMultiplayer);
          
          // Preservar a referência do objeto keys para não quebrar o input
          const keysRef = state.keys;
          
          // Aplicar novo estado - atualizar propriedades específicas
          state.time = next.time;
          state.level = next.level;
          state.levelConfig = next.levelConfig;
          state.player = next.player;
          state.boss = next.boss;
          state.heartsSpawnedThisLevel = next.heartsSpawnedThisLevel;
          state.status = next.status;
          state.victoryTimer = next.victoryTimer;
          state.restartTimer = next.restartTimer;
          state.keys = keysRef;
          
          // Atualizar moveSpeed dos braços do boss com a nova configuração
          for (let i = 0; i < state.boss.arms.length; i++) {
            state.boss.arms[i].moveSpeed = state.levelConfig.armMoveSpeed;
          }
          
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
          
          // Notify parent component of state changes to update level title
          if (onGameStateChange) {
            onGameStateChange(state);
          }
          
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
      const currentState = stateRef.current;
      if (currentState.status !== 'won' || isTransitioningRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleRef.current;
      const y = (e.clientY - rect.top) / scaleRef.current;
      const btn = (currentState as any)._nextBtn as { x: number; y: number; w: number; h: number } | undefined;
      if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        isTransitioningRef.current = true;
        console.log('Game: Transitioning to next level...');
        
        // Avançar para próxima fase
        const nextLevel = currentState.level + 1;
        console.log('🎮 Level Transition Debug - Moving from level', currentState.level, 'to level', nextLevel);
        updateUrlLevel(nextLevel);
        
        // Criar novo estado completamente
        const newState = createInitialState(nextLevel, isMultiplayer);
        console.log('🎮 Level Transition Debug - New state created with config:', newState.levelConfig);
        
        // Preservar apenas o que é necessário
        const keysRef = currentState.keys;
        
        // Limpar estado atual
        currentState.bullets.length = 0;
        currentState.hearts.length = 0;
        currentState.explosionParticles.length = 0;
        currentState.smokeParticles.length = 0;
        
        // Aplicar novo estado - atualizar propriedades específicas
        currentState.time = newState.time;
        currentState.level = newState.level;
        currentState.levelConfig = { ...newState.levelConfig }; // Create new object
        currentState.player = newState.player;
        currentState.boss = newState.boss;
        currentState.heartsSpawnedThisLevel = newState.heartsSpawnedThisLevel;
        currentState.status = newState.status;
        currentState.victoryTimer = newState.victoryTimer;
        currentState.restartTimer = newState.restartTimer;
        currentState.keys = keysRef;
        
        // Atualizar moveSpeed dos braços do boss com a nova configuração
        for (let i = 0; i < currentState.boss.arms.length; i++) {
          currentState.boss.arms[i].moveSpeed = currentState.levelConfig.armMoveSpeed;
        }
        
        // Limpar qualquer tecla pressionada
        for (const key in keysRef) {
          keysRef[key] = false;
        }
        
        // Force joystick cleanup on level transition
        forceJoystickCleanup();
        
        // Reset timers
        currentState.restartTimer = 0;
        currentState.victoryTimer = 0;
        currentState.time = 0;
        
        // Garantir que o status seja 'playing'
        currentState.status = 'playing';
        
        // Notify parent component of state changes to update level title FIRST
        if (onGameStateChange) {
          console.log('GameCanvas: Notifying level change to', currentState.level, 'with config:', currentState.levelConfig?.name);
          // Create a new object to ensure React detects the change
          const stateToNotify = {
            ...currentState,
            levelConfig: { ...currentState.levelConfig }
          };
          onGameStateChange(stateToNotify);
        }
        
        // Forçar uma atualização do canvas
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderSystem(ctx, currentState, isPaused);
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
    
    // Reinitialize input system after Playroom session has restarted
    setTimeout(() => {
      if ((window as any).forceReinitInput) {
        (window as any).forceReinitInput();
      }
    }, 200); // Increased delay to ensure Playroom session is ready
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
      <DesktopControls />
      <DesktopCredits />
      {/* <PlayroomDebug /> */}
      {/* <SubtleLogger enabled={true} position="bottom-right" maxLogs={2} /> */}
    </>
  );
}
