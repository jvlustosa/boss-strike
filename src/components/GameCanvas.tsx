import React, { useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../game/core/types';
import { createInitialState } from '../game/core/state';
import { LOGICAL_W, LOGICAL_H } from '../game/core/config';
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
import { audioManager } from '../game/core/audio';
import { MobileControlsLayout } from './MobileControlsLayout';
import { MobileCredits } from './MobileCredits';
import { DesktopControls } from './DesktopControls';
import { DesktopCredits } from './DesktopCredits';
import type { SessionManager } from '../game/core/sessionManager';

interface GameCanvasProps {
  isPaused: boolean;
  onGameStateChange?: (gameState: GameState) => void;
  isMultiplayer?: boolean;
  sessionManager?: SessionManager | null;
}

export function GameCanvas({ 
  isPaused, 
  onGameStateChange, 
  isMultiplayer = false,
  sessionManager = null 
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(getLevelFromUrl(), isMultiplayer));
  const scaleRef = useRef<number>(1);

  // Initialize game state
  React.useEffect(() => {
    const currentLevel = getLevelFromUrl();
    if (stateRef.current.level !== currentLevel) {
      stateRef.current = createInitialState(currentLevel, isMultiplayer);
    }

    if (stateRef.current.status === 'menu') {
      stateRef.current.status = 'playing';
    }

    if (onGameStateChange) {
      onGameStateChange(stateRef.current);
    }
  }, [onGameStateChange, isMultiplayer]);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
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

    // Register keyboard input
    const cleanupInput = registerInput(state.keys);

    // Game loop
    const update = (dt: number) => {
      if (state.status === 'playing' && !isPaused) {
        // Multiplayer: host handles simulation, client receives state
        if (isMultiplayer && sessionManager?.isMultiplayer()) {
          if (!sessionManager.getIsHost()) {
            // Non-host: skip simulation, wait for state from host
            return;
          }

          // Host: get remote player input and apply
          const remoteInput = sessionManager.getRemotePlayerInput(1);
          if (remoteInput && state.players.length >= 2) {
            const player2 = state.players[1];
            if (player2 && player2.alive) {
              player2.pos.x += remoteInput.x * 100 * dt;
              player2.pos.y += remoteInput.y * 100 * dt;
              player2.pos.x = Math.max(0, Math.min(LOGICAL_W - player2.w, player2.pos.x));
              player2.pos.y = Math.max(0, Math.min(LOGICAL_H - player2.h, player2.pos.y));

              if (remoteInput.fire && player2.cooldown <= 0) {
                state.bullets.push({
                  pos: { x: player2.pos.x + player2.w / 2 - 1, y: player2.pos.y },
                  w: 2,
                  h: 4,
                  vel: { x: 0, y: -120 },
                  from: 'player',
                });
                player2.cooldown = 0.2;
              }
            }
          }
        }

        state.time += dt;
        playerSystem(state, dt);
        bossSystem(state, dt);
        bulletSystem(state, dt);
        heartSystem(state, dt);
        collisionSystem(state);

        // Victory timer
        if (state.victoryTimer > 0) {
          state.victoryTimer -= dt;
          if (state.victoryTimer <= 0) {
            state.status = 'won';
            saveVictory();
            saveProgress(state);
          }
        }
      } else if (state.status === 'lost') {
        // Auto-restart after 2 seconds
        state.restartTimer += dt;
        if (state.restartTimer >= 2) {
          const next = createInitialState(state.level, isMultiplayer);
          const keysRef = state.keys;

          state.time = next.time;
          state.level = next.level;
          state.levelConfig = next.levelConfig;
          state.player = next.player;
          state.players = next.players;
          state.boss = next.boss;
          state.heartsSpawnedThisLevel = next.heartsSpawnedThisLevel;
          state.status = next.status;
          state.victoryTimer = next.victoryTimer;
          state.restartTimer = next.restartTimer;
          state.keys = keysRef;

          for (let i = 0; i < state.boss.arms.length; i++) {
            state.boss.arms[i].moveSpeed = state.levelConfig.armMoveSpeed;
          }

          for (const key in keysRef) {
            keysRef[key] = false;
          }

          if (onGameStateChange) {
            onGameStateChange(state);
          }
        }
      }

      if (onGameStateChange) {
        onGameStateChange(state);
      }
    };

    // Handle ESC key for pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.status === 'playing') {
          saveProgress(state);
        }
        window.dispatchEvent(new CustomEvent('togglePause'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Render loop
    const render = (dt: number) => {
      renderSystem(ctx, state, isPaused);
      updateExplosionSystem(state, dt);
    };

    // Combined game and render loop
    let lastTime = performance.now();
    let frameCount = 0;
    const frameRate = 1000 / 60; // 60 FPS target

    const gameLoop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Cap dt to prevent large jumps
      const dt = Math.min(delta, 0.05);

      // Update game state
      update(dt);

      // Render
      render(dt);

      // Multiplayer: send input and state
      if (isMultiplayer && sessionManager?.isMultiplayer()) {
        const keys = state.keys;
        const x = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
        const y = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
        const fire = keys[' '] || keys['space'] || false;

        sessionManager.updateInput(x, y, fire);
        sessionManager.sendInput();

        // Host broadcasts state
        if (sessionManager.getIsHost()) {
          sessionManager.sendGameState({
            frameNumber: sessionManager.getFrameNumber(),
            timestamp: Date.now(),
            players: state.players.map((p, idx) => ({
              index: idx,
              pos: p.pos,
              health: p.health,
              alive: p.alive,
              cooldown: p.cooldown,
            })),
            boss: {
              pos: state.boss.pos,
              hp: state.boss.hp,
              hpMax: state.boss.hpMax,
            },
            bulletsCount: state.bullets.length,
          });
        }

        sessionManager.nextFrame();
      }

      frameCount++;
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cleanupInput();
    };
  }, [isPaused, isMultiplayer, sessionManager, setupCanvas, onGameStateChange]);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: 'pixelated',
          imageRendering: 'crisp-edges',
          border: '2px solid #fff',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        }}
      />
      {isMobile && (
        <>
          <MobileControlsLayout />
          <MobileCredits />
        </>
      )}
      {!isMobile && (
        <>
          <DesktopControls />
          <DesktopCredits />
        </>
      )}
    </>
  );
}
