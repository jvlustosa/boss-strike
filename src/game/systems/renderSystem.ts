import type { GameState } from '../core/types';
import { colors } from '../core/assets';
import { LOGICAL_W, LOGICAL_H } from '../core/config';

export function renderSystem(ctx: CanvasRenderingContext2D, state: GameState): void {
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

  // Level Info
  ctx.fillStyle = '#fff';
  ctx.font = '6px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`Nível ${state.level}: ${state.levelConfig.name}`, 4, 4);

  // Boss HP Bar
  const hpBarW = 40;
  const hpBarH = 4;
  const hpBarX = (LOGICAL_W - hpBarW) / 2;
  const hpBarY = 16;
  
  // HP Background
  ctx.fillStyle = '#333';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  
  // HP Fill
  const hpPercent = state.boss.hp / state.boss.hpMax;
  ctx.fillStyle = hpPercent > 0.3 ? '#0f0' : '#f00';
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

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

  // Victory Overlay
  if (state.status === 'won') {
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
    ctx.font = '8px monospace';
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
    ctx.fillText('Próxima Fase', btnX + 8, btnY + 4);

    // Expor bounds do botão no estado para clique
    // @ts-ignore
    (state as any)._nextBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  } else {
    // @ts-ignore
    (state as any)._nextBtn = undefined;
  }
}
