import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import { NativeTouchControls } from './NativeTouchControls';
import { MobileCredits } from './MobileCredits';
import { DesktopControls } from './DesktopControls';
import { DesktopCredits } from './DesktopCredits';
import { PlayerLegend } from './PlayerLegend';
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
  const [remotePlayerName, setRemotePlayerName] = useState<string>('Player 2');
  const [isHost, setIsHost] = useState<boolean>(false);

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

  // Track multiplayer session info
  React.useEffect(() => {
    if (isMultiplayer && sessionManager) {
      // Update host status
      setIsHost(sessionManager.getIsHost());

      // Get remote player name
      const remoteName = sessionManager.getRemotePlayerName();
      if (remoteName) {
        setRemotePlayerName(remoteName);
      }

      // Listen for player joined events
      const handlePlayerJoined = (playerId: string, playerName: string, isHostPlayer: boolean) => {
        console.log(`[GameCanvas] Player joined: ${playerName} (Host: ${isHostPlayer})`);
        setRemotePlayerName(playerName);
      };

      // Register callback if available
      if (sessionManager && typeof sessionManager.onPlayerJoined === 'function') {
        sessionManager.onPlayerJoined(handlePlayerJoined);
      }

      // Update remote name periodically
      const interval = setInterval(() => {
        const updated = sessionManager.getRemotePlayerName();
        if (updated) {
          setRemotePlayerName(updated);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isMultiplayer, sessionManager]);

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
        // Multiplayer: separate player control
        if (isMultiplayer && sessionManager?.isMultiplayer()) {
          if (!sessionManager.getIsHost()) {
            // Non-host: skip simulation, wait for state from host
            return;
          }

          // Host: apply inputs to each player separately
          // Player 1 (local) - use state.keys (keyboard input from this device)
          const player1 = state.players[0];
          if (player1 && player1.alive) {
            const keys = state.keys;
            let moveX = 0;
            if (keys['a'] || keys['arrowleft']) moveX -= 1;
            if (keys['d'] || keys['arrowright']) moveX += 1;
            player1.pos.x += moveX * 40 * dt;
            player1.pos.x = Math.max(0, Math.min(LOGICAL_W - player1.w, player1.pos.x));

            let moveY = 0;
            if (keys['w'] || keys['arrowup']) moveY -= 1;
            if (keys['s'] || keys['arrowdown']) moveY += 1;
            player1.pos.y += moveY * 40 * dt;
            player1.pos.y = Math.max(0, Math.min(LOGICAL_H - player1.h, player1.pos.y));

            if (player1.cooldown > 0) {
              player1.cooldown -= dt;
            }

            if ((keys[' '] || keys['space']) && player1.cooldown <= 0) {
              state.bullets.push({
                pos: { x: player1.pos.x + player1.w / 2 - 1, y: player1.pos.y },
                w: 2,
                h: 4,
                vel: { x: 0, y: -120 },
                from: 'player',
              });
              player1.cooldown = 0.2;
              audioManager.playSound('shoot', 0.3, 0.4);
            }
          }

          // Player 2 (remote) - use remote input from WebSocket
          const remoteInput = sessionManager.getRemotePlayerInput(1);
          const player2 = state.players[1];
          if (player2 && player2.alive && remoteInput) {
            player2.pos.x += remoteInput.x * 40 * dt;
            player2.pos.y += remoteInput.y * 40 * dt;
            player2.pos.x = Math.max(0, Math.min(LOGICAL_W - player2.w, player2.pos.x));
            player2.pos.y = Math.max(0, Math.min(LOGICAL_H - player2.h, player2.pos.y));

            if (player2.cooldown > 0) {
              player2.cooldown -= dt;
            }

            if (remoteInput.fire && player2.cooldown <= 0) {
              state.bullets.push({
                pos: { x: player2.pos.x + player2.w / 2 - 1, y: player2.pos.y },
                w: 2,
                h: 4,
                vel: { x: 0, y: -120 },
                from: 'player',
              });
              player2.cooldown = 0.2;
              audioManager.playSound('shoot', 0.3, 0.4);
            }
          }
        } else {
          // Single player: use normal playerSystem
          playerSystem(state, dt);
        }

        state.time += dt;
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
          imageRendering: 'crisp-edges',
          border: '2px solid #fff',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        }}
      />
      
      {/* Player Legend */}
      <PlayerLegend 
        isMultiplayer={isMultiplayer}
        remotePlayerName={remotePlayerName}
        isHost={isHost}
      />

      {isMobile && (
        <>
          <NativeTouchControls
            onMove={(x, y) => {
              if (window.handleJoystickMove) {
                window.handleJoystickMove(x, y);
              }
            }}
            onFire={() => {
              const keys = stateRef.current.keys;
              keys[' '] = true;
              keys['space'] = true;
              setTimeout(() => {
                keys[' '] = false;
                keys['space'] = false;
              }, 50);
            }}
          />
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
