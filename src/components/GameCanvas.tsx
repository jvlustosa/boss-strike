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
import { shieldSystem, updateShieldFragments } from '../game/systems/shieldSystem';
import { bombSystem } from '../game/systems/bombSystem';
import { updateScorchMarks } from '../game/systems/scorchSystem';
import { renderSystem } from '../game/systems/renderSystem';
import { updateExplosionSystem } from '../game/systems/explosionSystem';
import { createMagicTrail, updateMagicTrail, clearMagicTrail } from '../game/systems/magicTrailSystem';
import { updateDamageNumbers } from '../game/systems/damageNumberSystem';
import { resetHitCounter } from '../game/systems/criticalHitSystem';
import { getLevelFromUrl, updateUrlLevel } from '../game/core/urlParams';
import { saveProgress, saveVictory } from '../game/core/progressCache';
import { MobileControlsLayout } from './MobileControlsLayout';
import { MobileCredits } from './MobileCredits';
import { DesktopControls } from './DesktopControls';
import { DesktopCredits } from './DesktopCredits';
import { useSkin } from '../hooks/useSkin';

interface GameCanvasProps {
  isPaused: boolean;
  onGameStateChange?: (gameState: GameState) => void;
}

export function GameCanvas({ isPaused, onGameStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stateRef = useRef<GameState | null>(null);
  const scaleRef = useRef<number>(1);
  const isTransitioningRef = useRef(false);
  const nextBtnHoverRef = useRef(false);
  const nextBtnPressedRef = useRef(false);
  
  // Hook loads and applies skin colors automatically
  useSkin();

  // Start the game when component mounts - initialize state from URL
  React.useEffect(() => {
    // Sempre ler o nível da URL ao montar/atualizar
    const currentLevel = getLevelFromUrl();
    
    // Inicializar ou atualizar estado se necessário
    if (!stateRef.current || stateRef.current.level !== currentLevel) {
      if (stateRef.current) {
      }
      stateRef.current = createInitialState(currentLevel);
    }
    
    if (stateRef.current.status === 'menu') {
      stateRef.current.status = 'playing';
    }
    
    // Notify parent component of initial state to show level title
    if (onGameStateChange && stateRef.current) {
      onGameStateChange(stateRef.current);
    }
  }, [onGameStateChange]);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLandscape = isMobile && window.innerHeight < window.innerWidth;
    
    // Pixel-perfect scaling - considerar espaço para header e outros elementos
    // Em mobile landscape, usar 100vh
    const availableHeight = isLandscape 
      ? window.innerHeight 
      : Math.min(window.innerHeight - 100, window.innerHeight * 0.9);
    const availableWidth = window.innerWidth;
    const scale = Math.floor(Math.min(availableWidth / LOGICAL_W, availableHeight / LOGICAL_H));
    canvas.width = LOGICAL_W * scale;
    canvas.height = LOGICAL_H * scale;
    scaleRef.current = scale;
    
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);
    
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;

    const ctx = setupCanvas(canvas);
    const state = stateRef.current;

    // Input setup
    const cleanupInput = registerInput(state.keys);

    // Handle ESC key for pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Save progress when pausing
        if (state.status === 'playing') {
          saveProgress(state).catch(console.error);
        }
        // Toggle pause - this will be handled by the parent component
        window.dispatchEvent(new CustomEvent('togglePause'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Game loop
    const update = (dt: number) => {
      // Always update explosion system (even when paused or during victory timer)
      updateExplosionSystem(state, dt);
      
      if (state.status === 'playing' && !isPaused) {
        state.time += dt;
        playerSystem(state, dt);
        createMagicTrail(state); // Criar rastro mágico se aplicável
        updateMagicTrail(state, dt); // Atualizar partículas de rastro
        updateDamageNumbers(state, dt); // Atualizar números de dano
        bossSystem(state, dt);
        bulletSystem(state, dt);
        heartSystem(state, dt);
        shieldSystem(state, dt);
        bombSystem(state, dt);
        updateShieldFragments(state, dt);
        if (state.bossShakeTimer > 0) {
          state.bossShakeTimer = Math.max(0, state.bossShakeTimer - dt);
        }
        collisionSystem(state);
        
        // Handle victory timer
        if (state.victoryTimer > 0) {
          state.victoryTimer -= dt;
          if (state.victoryTimer <= 0) {
            state.status = 'won';
            // Save victory (só se o nível for múltiplo de 5) and progress
            saveVictory(state.level).catch(console.error);
            saveProgress(state).catch(console.error);
          }
        }
      } else if (state.status === 'lost') {
        // Auto-restart after 2 seconds when player loses
        state.restartTimer += dt;
        if (state.restartTimer >= 2) {
          
          // Reset game state, mantendo o mesmo nível
          const next = createInitialState(state.level);
          
          // Preservar a referência do objeto keys para não quebrar o input
          const keysRef = state.keys;
          
          // Limpar rastro mágico e resetar contador de hits
          clearMagicTrail();
          resetHitCounter();
          
          // Aplicar novo estado - atualizar propriedades específicas
          state.time = next.time;
          state.level = next.level;
          state.levelConfig = next.levelConfig;
          state.player = next.player;
          state.boss = next.boss;
          state.heartsSpawnedThisLevel = next.heartsSpawnedThisLevel;
          state.shieldsSpawnedThisLevel = next.shieldsSpawnedThisLevel;
          state.maxShieldsThisLevel = next.maxShieldsThisLevel;
          state.shieldCooldown = next.shieldCooldown;
          state.bomb = next.bomb;
          state.bombUsedThisLevel = next.bombUsedThisLevel;
          state.bombSpawnTimer = next.bombSpawnTimer;
          state.shields.length = 0;
          state.shieldFragments.length = 0;
          state.explosionParticles.length = 0;
          state.smokeParticles.length = 0;
          state.pixelParticles.length = 0;
          state.magicTrailParticles.length = 0;
          state.damageNumbers.length = 0;
          state.scorchMarks.length = 0;
          state.scorchMarks = next.scorchMarks;
          state.status = next.status;
          state.victoryTimer = next.victoryTimer;
          state.restartTimer = next.restartTimer;
          state.bossShakeTimer = next.bossShakeTimer;
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
        }
      }

      updateScorchMarks(state, dt);
      
      // Notify parent component of state changes
      if (onGameStateChange) {
        onGameStateChange(state);
      }
    };

    const render = () => {
      renderSystem(ctx, state, isPaused, nextBtnHoverRef.current, nextBtnPressedRef.current);
    };

    const cleanupLoop = createGameLoop(update, render);

    // Resize handler
    const handleResize = () => {
      setupCanvas(canvas);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Mouse move handling for next level button hover
    const onMouseMove = (e: MouseEvent) => {
      const currentState = stateRef.current;
      if (!currentState || currentState.status !== 'won') {
        const wasHovering = nextBtnHoverRef.current;
        nextBtnHoverRef.current = false;
        if (wasHovering) {
          // Force re-render if hover state changed
          requestAnimationFrame(() => {
            if (stateRef.current) {
              renderSystem(ctx, stateRef.current, isPaused, nextBtnHoverRef.current, nextBtnPressedRef.current);
            }
          });
        }
        canvas.style.cursor = 'default';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleRef.current;
      const y = (e.clientY - rect.top) / scaleRef.current;
      const btn = (currentState as any)._nextBtn as { x: number; y: number; w: number; h: number } | undefined;
      const isHovering = !!(btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
      const wasHovering = nextBtnHoverRef.current;
      nextBtnHoverRef.current = isHovering;
      canvas.style.cursor = isHovering ? 'pointer' : 'default';
      
      // Force re-render if hover state changed
      if (wasHovering !== isHovering) {
        requestAnimationFrame(() => {
          if (stateRef.current) {
            renderSystem(ctx, stateRef.current, isPaused, nextBtnHoverRef.current, nextBtnPressedRef.current);
          }
        });
      }
    };

    const onMouseLeave = () => {
      nextBtnHoverRef.current = false;
      nextBtnPressedRef.current = false;
      canvas.style.cursor = 'default';
    };

    // Click handling for next level button
    const onClick = (e: MouseEvent) => {
      const currentState = stateRef.current;
      if (!currentState || currentState.status !== 'won' || isTransitioningRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleRef.current;
      const y = (e.clientY - rect.top) / scaleRef.current;
      const btn = (currentState as any)._nextBtn as { x: number; y: number; w: number; h: number } | undefined;
      if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        nextBtnPressedRef.current = true;
        // Force re-render to show pressed state
        setTimeout(() => {
          const ctx = canvas.getContext('2d');
          if (ctx && currentState) {
            renderSystem(ctx, currentState, isPaused, nextBtnHoverRef.current, nextBtnPressedRef.current);
          }
        }, 0);
        
        isTransitioningRef.current = true;
        // Avançar para próxima fase
        const nextLevel = currentState.level + 1;
        updateUrlLevel(nextLevel);
        
        // Criar novo estado completamente
        const newState = createInitialState(nextLevel);
        
        // Preservar apenas o que é necessário
        const keysRef = currentState.keys;
        
        // Limpar estado atual
        clearMagicTrail();
        resetHitCounter();
        currentState.bullets.length = 0;
        currentState.hearts.length = 0;
        currentState.shields.length = 0;
        currentState.shieldFragments.length = 0;
        currentState.explosionParticles.length = 0;
        currentState.smokeParticles.length = 0;
        currentState.pixelParticles.length = 0;
        currentState.magicTrailParticles.length = 0;
        currentState.damageNumbers.length = 0;
        currentState.scorchMarks.length = 0;
        
        // Aplicar novo estado - atualizar propriedades específicas
        currentState.time = newState.time;
        currentState.level = newState.level;
        currentState.levelConfig = { ...newState.levelConfig }; // Create new object
        currentState.player = newState.player;
        currentState.boss = newState.boss;
        currentState.heartsSpawnedThisLevel = newState.heartsSpawnedThisLevel;
        currentState.shieldsSpawnedThisLevel = newState.shieldsSpawnedThisLevel;
        currentState.maxShieldsThisLevel = newState.maxShieldsThisLevel;
        currentState.shieldCooldown = newState.shieldCooldown;
        currentState.status = newState.status;
        currentState.victoryTimer = newState.victoryTimer;
        currentState.restartTimer = newState.restartTimer;
        currentState.keys = keysRef;
        currentState.bomb = newState.bomb;
        currentState.bombUsedThisLevel = newState.bombUsedThisLevel;
        currentState.bombSpawnTimer = newState.bombSpawnTimer;
        currentState.scorchMarks = newState.scorchMarks;
        currentState.bossShakeTimer = newState.bossShakeTimer;
        
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
        
        if (currentState) {
          // Reset timers
          currentState.restartTimer = 0;
          currentState.victoryTimer = 0;
          currentState.time = 0;
          
          // Garantir que o status seja 'playing'
          currentState.status = 'playing';
          
          // Notify parent component of state changes to update level title FIRST
          if (onGameStateChange) {
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
              renderSystem(ctx, currentState, isPaused, nextBtnHoverRef.current, nextBtnPressedRef.current);
            }
          }
        }
        
        
        // Reset transition flag after a short delay
        setTimeout(() => {
          isTransitioningRef.current = false;
          nextBtnPressedRef.current = false;
        }, 100);
      }
      
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cleanupInput();
      cleanupLoop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [setupCanvas, isPaused]);

  const handleFire = () => {
    if ((window as any).handleTouchFire) {
      (window as any).handleTouchFire();
    }
  };

  // Clear input on game restart/level change
  const forceJoystickCleanup = () => {
    // Clear input first
    if ((window as any).forceClearInput) {
      (window as any).forceClearInput();
    }
    
    // Reinitialize input system
    setTimeout(() => {
      if ((window as any).forceReinitInput) {
        (window as any).forceReinitInput();
      }
    }, 100);
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = isMobile && window.innerHeight < window.innerWidth;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #333',
          display: 'block',
          maxWidth: '100vw',
          maxHeight: isLandscape ? '100vh' : 'calc(100vh - 100px)',
          height: isLandscape ? '100vh' : 'auto',
          objectFit: 'contain',
        }}
      />
      <MobileControlsLayout onFire={handleFire} />
      <MobileCredits visible={true} position="top-left" />
      <DesktopControls />
      <DesktopCredits />
      {/* <SubtleLogger enabled={true} position="bottom-right" maxLogs={2} /> */}
    </>
  );
}
