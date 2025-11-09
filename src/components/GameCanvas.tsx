import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import { VictoryModal } from './VictoryModal';
import { useSkin } from '../hooks/useSkin';

interface GameCanvasProps {
  isPaused: boolean;
  onGameStateChange?: (gameState: GameState) => void;
  gameStarted?: boolean;
  gameState?: GameState | null;
}

export function GameCanvas({ isPaused, onGameStateChange, gameStarted = true, gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stateRef = useRef<GameState | null>(null);
  const scaleRef = useRef<number>(1);
  const isTransitioningRef = useRef(false);
  const lastNotifiedStatusRef = useRef<string | null>(null);
  
  // Hook loads and applies skin colors automatically
  useSkin();

  // Start the game when component mounts - initialize state from URL
  const mountedRef = useRef(false);
  React.useEffect(() => {
    // Only run once on mount
    if (mountedRef.current) return;
    mountedRef.current = true;
    
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
  }, [onGameStateChange]); // Now stable with useCallback

  // Force restart when gameStarted changes to true (after being false)
  React.useEffect(() => {
    if (gameStarted) {
      const currentLevel = getLevelFromUrl();
      // Force reset to the level from URL
      if (stateRef.current) {
        stateRef.current = createInitialState(currentLevel);
        stateRef.current.status = 'playing';
        stateRef.current.time = 0;
        stateRef.current.victoryTimer = 0;
        stateRef.current.restartTimer = 0;
        stateRef.current.bossShakeTimer = 0;
        lastNotifiedStatusRef.current = null;
        
        // Clear all particles and effects
        stateRef.current.bullets.length = 0;
        stateRef.current.explosionParticles.length = 0;
        stateRef.current.smokeParticles.length = 0;
        stateRef.current.pixelParticles.length = 0;
        stateRef.current.magicTrailParticles.length = 0;
        stateRef.current.damageNumbers.length = 0;
        stateRef.current.bombTrailParticles.length = 0;
        stateRef.current.shieldFragments.length = 0;
        stateRef.current.scorchMarks.length = 0;
        
        // Notify parent component
        if (onGameStateChange) {
          onGameStateChange(stateRef.current);
        }
      }
    }
  }, [gameStarted, onGameStateChange]);

  // Listen for level changes from URL (when user selects a level from /fases)
  React.useEffect(() => {
    const checkLevelChange = () => {
      const currentLevel = getLevelFromUrl();
      if (stateRef.current && stateRef.current.level !== currentLevel) {
        // Level changed, reset game state
        stateRef.current = createInitialState(currentLevel);
        stateRef.current.status = 'playing';
        
        // Reset all game timers and state
        stateRef.current.time = 0;
        stateRef.current.victoryTimer = 0;
        stateRef.current.restartTimer = 0;
        stateRef.current.bossShakeTimer = 0;
        lastNotifiedStatusRef.current = null;
        
        // Clear all particles and effects
        stateRef.current.bullets.length = 0;
        stateRef.current.explosionParticles.length = 0;
        stateRef.current.smokeParticles.length = 0;
        stateRef.current.pixelParticles.length = 0;
        stateRef.current.magicTrailParticles.length = 0;
        stateRef.current.damageNumbers.length = 0;
        stateRef.current.bombTrailParticles.length = 0;
        stateRef.current.shieldFragments.length = 0;
        stateRef.current.scorchMarks.length = 0;
        
        // Notify parent component
        if (onGameStateChange) {
          onGameStateChange(stateRef.current);
        }
      }
    };

    // Check immediately
    checkLevelChange();

    // Listen for popstate (back/forward) and custom level change events
    window.addEventListener('popstate', checkLevelChange);
    window.addEventListener('levelChange', checkLevelChange);
    
    // Also check periodically (in case URL changes without events)
    const interval = setInterval(checkLevelChange, 100);

    return () => {
      window.removeEventListener('popstate', checkLevelChange);
      window.removeEventListener('levelChange', checkLevelChange);
      clearInterval(interval);
    };
  }, [onGameStateChange, gameStarted]);

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

    // Safe error handler for production
    const handleError = (error: unknown) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Game error:', error);
      }
      // In production, silently fail - don't break the game
    };

    // Handle ESC key for pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Save progress when pausing
        if (state.status === 'playing') {
          saveProgress(state).catch(handleError);
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
      
      // Handle victory timer - must run regardless of pause/status to ensure modal appears
      if (state.victoryTimer > 0) {
        state.victoryTimer -= dt;
        if (state.victoryTimer <= 0) {
          state.status = 'won';
          // Save victory (só se o nível for múltiplo de 5) and progress
          saveVictory(state.level).catch(handleError);
          saveProgress(state).catch(handleError);
          // Mark that we need to notify about this status change
          lastNotifiedStatusRef.current = null;
        }
      }
      
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
          state.bombTrailParticles.length = 0;
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
          lastNotifiedStatusRef.current = null;
          
          // Notify parent component of state changes to update level title
          if (onGameStateChange) {
            onGameStateChange(state);
          }
        }
      }

      updateScorchMarks(state, dt);
      
      // Notify parent component only when status actually changes
      if (onGameStateChange && lastNotifiedStatusRef.current !== state.status) {
        if (state.status === 'won') {
          // Create new object for 'won' status to ensure React detects change
          onGameStateChange({
            ...state,
            status: 'won' as const,
            levelConfig: { ...state.levelConfig },
          });
        } else {
          onGameStateChange(state);
        }
        lastNotifiedStatusRef.current = state.status;
      }
    };

    const render = () => {
      // Modal de vitória agora é um componente React separado
      renderSystem(ctx, state, isPaused);
    };

    const cleanupLoop = createGameLoop(update, render);

    // Resize handler
    const handleResize = () => {
      setupCanvas(canvas);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cleanupInput();
      cleanupLoop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
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
  
  // Estado local para controlar visibilidade do modal
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryLevel, setVictoryLevel] = useState(1);
  const modalShownRef = useRef<{ level: number; status: string } | null>(null);

  // Monitorar mudanças no gameState para mostrar o modal - única fonte de verdade
  useEffect(() => {
    const currentStatus = gameState?.status;
    const currentLevel = gameState?.level;
    
    // Only update if status actually changed to 'won' and we haven't shown modal for this state
    if (currentStatus === 'won' && currentLevel !== undefined) {
      const lastShown = modalShownRef.current;
      
      // Show modal if we haven't shown it for this exact state
      if (!lastShown || lastShown.level !== currentLevel || lastShown.status !== currentStatus) {
        if (!isTransitioningRef.current) {
          setShowVictoryModal(true);
          setVictoryLevel(currentLevel);
          modalShownRef.current = { level: currentLevel, status: currentStatus };
        }
      }
    } else if (currentStatus !== 'won') {
      // Hide modal when status changes away from 'won'
      setShowVictoryModal((prev) => {
        if (prev) {
          modalShownRef.current = null;
          return false;
        }
        return prev;
      });
    }
  }, [gameState?.status, gameState?.level]);

  // Use memoized values to prevent unnecessary recalculations
  const victoryModalVisible = React.useMemo(() => {
    return showVictoryModal && !isTransitioningRef.current && gameState?.status === 'won';
  }, [showVictoryModal, gameState?.status]);
  
  const currentLevel = React.useMemo(() => {
    return victoryLevel || gameState?.level || stateRef.current?.level || 1;
  }, [victoryLevel, gameState?.level]);

  const handleNextPhase = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState || isTransitioningRef.current) {
      return;
    }

    // Esconder modal imediatamente e resetar tracking
    setShowVictoryModal(false);
    setVictoryLevel(0);
    modalShownRef.current = null;

    isTransitioningRef.current = true;
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
    currentState.bombTrailParticles.length = 0;
    currentState.scorchMarks.length = 0;

    // Aplicar novo estado
    Object.assign(currentState, newState);
    currentState.keys = keysRef;
    currentState.status = 'playing'; // Force status to playing
    currentState.victoryTimer = 0; // Reset victory timer
    currentState.restartTimer = 0; // Reset restart timer
    currentState.time = 0; // Reset time
    lastNotifiedStatusRef.current = null;

    // Atualizar moveSpeed dos braços do boss
    for (let i = 0; i < currentState.boss.arms.length; i++) {
      currentState.boss.arms[i].moveSpeed = currentState.levelConfig.armMoveSpeed;
    }

    // Limpar qualquer tecla pressionada
    for (const key in keysRef) {
      keysRef[key] = false;
    }

    // Force joystick cleanup
    forceJoystickCleanup();

    // Notify parent component with fresh state
    if (onGameStateChange) {
      onGameStateChange({
        ...currentState,
        status: 'playing' as const,
        levelConfig: { ...currentState.levelConfig },
      });
    }

    // Reset transition flag after a short delay
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 100);
  }, [onGameStateChange]);

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
          pointerEvents: 'auto',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
          position: 'relative',
        }}
      />
      {!victoryModalVisible && <MobileControlsLayout onFire={handleFire} />}
      {!victoryModalVisible && <MobileCredits visible={true} position="top-left" />}
      {!victoryModalVisible && <DesktopControls />}
      {!victoryModalVisible && <DesktopCredits />}
      <VictoryModal
        visible={victoryModalVisible}
        onNextPhase={handleNextPhase}
        level={currentLevel}
      />
      {/* <SubtleLogger enabled={true} position="bottom-right" maxLogs={2} /> */}
    </>
  );
}
