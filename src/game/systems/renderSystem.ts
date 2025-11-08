import type { GameState } from '../core/types';
import { colors } from '../core/assets';
import { LOGICAL_W, LOGICAL_H } from '../core/config';
import { isDesktop } from '../core/environmentDetector';

export function renderSystem(ctx: CanvasRenderingContext2D, state: GameState, isPaused: boolean = false): void {
  // Clear screen
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Player
  if (state.player.alive) {
    ctx.fillStyle = colors.player;
    ctx.fillRect(state.player.pos.x, state.player.pos.y, state.player.w, state.player.h);
  }

  // Boss
  ctx.fillStyle = colors.boss;
  ctx.fillRect(state.boss.pos.x, state.boss.pos.y, state.boss.w, state.boss.h);
  
  // Boss arms
  ctx.fillStyle = colors.bossArm;
  for (const arm of state.boss.arms) {
    ctx.fillRect(arm.pos.x, arm.pos.y, arm.w, arm.h);
  }
  
  // Boss weak spot
  ctx.fillStyle = colors.bossWeakSpot;
  ctx.fillRect(state.boss.weakSpot.x, state.boss.weakSpot.y, state.boss.weakSpot.w, state.boss.weakSpot.h);

  // Bullets
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.from === 'player' ? colors.playerBullet : colors.bossBullet;
    ctx.fillRect(bullet.pos.x, bullet.pos.y, bullet.w, bullet.h);
  }

  // Hearts
  for (const heart of state.hearts) {
    if (!heart.collected) {
      ctx.fillStyle = colors.heart;
      // Desenhar coração pixelado simples
      const x = heart.pos.x;
      const y = heart.pos.y;
      
      // Forma de coração usando retângulos pequenos
      ctx.fillRect(x + 1, y, 2, 1);     // topo esquerdo
      ctx.fillRect(x + 4, y, 2, 1);     // topo direito
      ctx.fillRect(x, y + 1, 3, 1);     // meio esquerdo
      ctx.fillRect(x + 3, y + 1, 3, 1); // meio direito
      ctx.fillRect(x, y + 2, 6, 1);     // linha completa
      ctx.fillRect(x + 1, y + 3, 4, 1); // quase completa
      ctx.fillRect(x + 2, y + 4, 2, 1); // centro baixo
      ctx.fillRect(x + 2.5, y + 5, 1, 1); // ponta
    }
  }

  // Shields
  for (const shield of state.shields) {
    if (!shield.collected) {
      const x = shield.pos.x;
      const y = shield.pos.y;
      
      // Desenhar triângulo virado de cabeça para baixo (pontiagudo para cima)
      // Interior azul escuro
      ctx.fillStyle = '#003366';
      ctx.fillRect(x + 3, y + 1, 2, 1);       // linha do meio (interior)
      ctx.fillRect(x + 2, y + 2, 4, 1);       // linha abaixo do meio (interior)
      ctx.fillRect(x + 1, y + 3, 6, 1);       // linha acima da base (interior)
      ctx.fillRect(x + 2, y + 4, 4, 1);       // base (interior)
      
      // Bordas azuis claras
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(x + 4, y, 1, 1);           // ponta superior
      ctx.fillRect(x + 2, y + 1, 1, 1);      // borda esquerda linha 1
      ctx.fillRect(x + 5, y + 1, 1, 1);      // borda direita linha 1
      ctx.fillRect(x + 1, y + 2, 1, 1);       // borda esquerda linha 2
      ctx.fillRect(x + 6, y + 2, 1, 1);      // borda direita linha 2
      ctx.fillRect(x, y + 3, 1, 1);          // borda esquerda linha 3
      ctx.fillRect(x + 7, y + 3, 1, 1);      // borda direita linha 3
      ctx.fillRect(x + 1, y + 4, 1, 1);      // borda esquerda base
      ctx.fillRect(x + 6, y + 4, 1, 1);      // borda direita base
      ctx.fillRect(x + 3, y + 5, 2, 1);      // base inferior
    }
  }

  // Explosion particles
  for (const particle of state.explosionParticles) {
    const alpha = particle.life / particle.maxLife;
    const size = particle.size * alpha;
    
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      Math.floor(particle.pos.x - size / 2),
      Math.floor(particle.pos.y - size / 2),
      Math.max(1, Math.floor(size)),
      Math.max(1, Math.floor(size))
    );
  }

  // Smoke particles (pixelated)
  for (const smoke of state.smokeParticles) {
    const size = Math.floor(smoke.size);
    const alpha = smoke.alpha;
    
    // Create pixelated smoke effect with multiple small squares
    ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
    
    // Main smoke particle
    ctx.fillRect(
      Math.floor(smoke.pos.x - size / 2),
      Math.floor(smoke.pos.y - size / 2),
      size,
      size
    );
    
    // Add smaller particles around for more realistic smoke
    if (size > 2) {
      ctx.fillStyle = `rgba(120, 120, 120, ${alpha * 0.6})`;
      ctx.fillRect(
        Math.floor(smoke.pos.x - size / 2 - 1),
        Math.floor(smoke.pos.y - size / 2),
        1,
        1
      );
      ctx.fillRect(
        Math.floor(smoke.pos.x + size / 2),
        Math.floor(smoke.pos.y - size / 2),
        1,
        1
      );
      ctx.fillRect(
        Math.floor(smoke.pos.x - size / 2),
        Math.floor(smoke.pos.y + size / 2),
        1,
        1
      );
      ctx.fillRect(
        Math.floor(smoke.pos.x + size / 2),
        Math.floor(smoke.pos.y + size / 2),
        1,
        1
      );
    }
  }

  // Level Info removed from canvas - now displayed outside canvas

  // Boss HP Bar (always visible)
  const hpBarW = 32;
  const hpBarH = 2;
  const hpBarX = state.boss.pos.x + state.boss.w / 2 - hpBarW / 2;
  
  // Position HP bar above boss, but ensure it's always visible
  let hpBarY = state.boss.pos.y - 6;
  const minY = 2; // Minimum Y position to keep bar visible
  
  // If boss is too high, position bar at minimum Y
  if (hpBarY < minY) {
    hpBarY = minY;
  }
  
  // HP Background
  ctx.fillStyle = '#333';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  
  // HP Fill
  const hpPercent = state.boss.hp / state.boss.hpMax;
  ctx.fillStyle = hpPercent > 0.3 ? '#0f0' : '#f00';
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

  // Player Shield Visual (quando tiver escudo ativo)
  if (state.player.shieldHits > 0) {
    const shieldAlpha = 0.6 + (state.player.shieldHits / 10) * 0.4;
    const px = state.player.pos.x + state.player.w / 2;
    const py = state.player.pos.y + state.player.h / 2;
    const size = Math.max(state.player.w, state.player.h) + 4;
    
    // Desenhar triângulo virado de cabeça para baixo ao redor do player
    // Interior azul escuro
    ctx.fillStyle = `rgba(0, 51, 102, ${shieldAlpha})`;
    ctx.fillRect(px - 1, py - size / 2 + 1, 2, 1);           // linha do meio (interior)
    ctx.fillRect(px - 2, py - size / 2 + 2, 4, 1);         // linha abaixo do meio (interior)
    ctx.fillRect(px - 3, py - size / 2 + 3, 6, 1);         // linha acima da base (interior)
    ctx.fillRect(px - 2, py - size / 2 + 4, 4, 1);         // base (interior)
    
    // Bordas azuis claras
    ctx.fillStyle = `rgba(102, 204, 255, ${shieldAlpha})`;
    ctx.fillRect(px, py - size / 2, 1, 1);                 // ponta superior
    ctx.fillRect(px - 2, py - size / 2 + 1, 1, 1);         // borda esquerda linha 1
    ctx.fillRect(px + 1, py - size / 2 + 1, 1, 1);         // borda direita linha 1
    ctx.fillRect(px - 3, py - size / 2 + 2, 1, 1);         // borda esquerda linha 2
    ctx.fillRect(px + 2, py - size / 2 + 2, 1, 1);        // borda direita linha 2
    ctx.fillRect(px - 4, py - size / 2 + 3, 1, 1);         // borda esquerda linha 3
    ctx.fillRect(px + 3, py - size / 2 + 3, 1, 1);         // borda direita linha 3
    ctx.fillRect(px - 3, py - size / 2 + 4, 1, 1);         // borda esquerda base
    ctx.fillRect(px + 2, py - size / 2 + 4, 1, 1);         // borda direita base
    ctx.fillRect(px - 1, py - size / 2 + 5, 2, 1);         // base inferior
  }

  // Shield Fragments
  for (const fragment of state.shieldFragments) {
    const alpha = fragment.life / fragment.maxLife;
    ctx.fillStyle = `rgba(0, 170, 255, ${alpha})`;
    ctx.fillRect(
      Math.floor(fragment.pos.x - fragment.size / 2),
      Math.floor(fragment.pos.y - fragment.size / 2),
      Math.max(1, Math.floor(fragment.size)),
      Math.max(1, Math.floor(fragment.size))
    );
  }

  // Player Health Display
  ctx.fillStyle = '#0f0';
  for (let i = 0; i < state.player.health; i++) {
    ctx.fillRect(4 + i * 6, LOGICAL_H - 8, 4, 4);
  }
  
  // Empty health slots
  ctx.fillStyle = '#333';
  for (let i = state.player.health; i < state.player.maxHealth; i++) {
    ctx.fillRect(4 + i * 6, LOGICAL_H - 8, 4, 4);
  }

  // Shield Hits Remaining Display (canto esquerdo)
  if (state.player.shieldHits > 0) {
    ctx.fillStyle = '#00aaff';
    ctx.font = '6px "Pixelify Sans", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.player.shieldHits}`, 4, 20);
  }

  // Victory Overlay
  if (state.status === 'won' && state.victoryTimer <= 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Box
    const boxW = 120;
    const boxH = 60;
    const boxX = (LOGICAL_W - boxW) / 2;
    const boxY = (LOGICAL_H - boxH) / 2;
    ctx.fillStyle = '#111';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    ctx.fillStyle = '#0f0';
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('VITÓRIA!', boxX + 8, boxY + 8);

    // Button
    const btnW = 96;
    const btnH = 16;
    const btnX = boxX + (boxW - btnW) / 2;
    const btnY = boxY + boxH - btnH - 8;
    ctx.fillStyle = '#222';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#0f0';
    ctx.font = '6px "Pixelify Sans", monospace';
    ctx.fillText('Próxima Fase', btnX + 8, btnY + 4);

    // Expor bounds do botão no estado para clique
    // @ts-ignore
    (state as any)._nextBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  } else {
    // @ts-ignore
    (state as any)._nextBtn = undefined;
  }

  // Show pause indicator
  if (isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSADO', LOGICAL_W / 2, LOGICAL_H / 2);
  }


  // Game Over Screen
  if (state.status === 'lost') {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Game Over Box
    const boxW = 140;
    const boxH = 80;
    const boxX = (LOGICAL_W - boxW) / 2;
    const boxY = (LOGICAL_H - boxH) / 2;
    
    ctx.fillStyle = '#111';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Game Over Title
    ctx.fillStyle = '#f00';
    ctx.font = '16px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GAME OVER', boxX + boxW / 2, boxY + 8);

    // Restart message
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.fillText('Reiniciando em...', boxX + boxW / 2, boxY + 32);

    // Countdown based on restart timer
    const restartTime = 2.0; // 2 seconds from GameCanvas
    const timeLeft = Math.max(0, restartTime - state.restartTimer);
    const countdown = Math.ceil(timeLeft);
    
    ctx.fillStyle = '#ff0';
    ctx.font = '12px "Pixelify Sans", monospace';
    ctx.fillText(countdown.toString(), boxX + boxW / 2, boxY + 48);
  }
}
