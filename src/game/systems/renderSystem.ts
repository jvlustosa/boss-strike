import type { GameState } from '../core/types';
import { colors, getSkinData } from '../core/assets';
import { LOGICAL_W, LOGICAL_H } from '../core/config';
import { renderPlayer } from '../components/PlayerRenderer';

const FONT_XS = '6px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_SM = '8px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_MD = '12px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_LG = '16px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_XL = '20px "Press Start 2P", "Pixelify Sans", monospace';

export function renderSystem(ctx: CanvasRenderingContext2D, state: GameState, isPaused: boolean = false, nextBtnHover: boolean = false, nextBtnPressed: boolean = false): void {
  // Clear screen
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Magic Trail Particles - renderizar ANTES do player para ficar atrás
  // Usa a cor da skin para skins raras
  if (state.magicTrailParticles.length > 0) {
    // Converter cor hex para rgba com alpha (definir uma vez fora do loop)
    const hexToRgba = (color: string, alpha: number): string => {
      if (!color || typeof color !== 'string') {
        return `rgba(0, 204, 255, ${alpha})`;
      }
      
      // Se já é rgba/rgb, extrair valores
      if (color.startsWith('rgba') || color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
          return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
        }
      }
      
      // Se é hex (#rrggbb)
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
        }
        // Hex curto (#rgb)
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
        }
      }
      
      // Fallback: usar cor padrão azul
      return `rgba(0, 204, 255, ${alpha})`;
    };
    
    for (const trail of state.magicTrailParticles) {
      if (trail.emoji) {
        // Render emoji trail (for smiley skin)
        ctx.save();
        ctx.globalAlpha = trail.alpha;
        ctx.font = `${trail.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(trail.emoji, trail.pos.x, trail.pos.y);
        ctx.restore();
      } else {
        const alpha = trail.alpha * (trail.life / trail.maxLife);
        const size = Math.max(1, Math.floor(trail.size));
        
        // Validar que temos uma cor válida
        const trailColor = trail.color || '#00ccff';
        
        // Cor da skin com alpha
        ctx.fillStyle = hexToRgba(trailColor, alpha);
        ctx.fillRect(
          Math.floor(trail.pos.x - size / 2),
          Math.floor(trail.pos.y - size / 2),
          size,
          size
        );
        
        // Adicionar um brilho sutil ao redor (mais claro que a cor base)
        if (size > 1) {
          const glowAlpha = alpha * 0.3;
          ctx.fillStyle = hexToRgba(trailColor, glowAlpha);
          ctx.fillRect(
            Math.floor(trail.pos.x - size / 2 - 1),
            Math.floor(trail.pos.y - size / 2 - 1),
            size + 2,
            size + 2
          );
        }
      }
    }
  }

  // Player - usando componente dedicado
  renderPlayer(ctx, state.player);

  // Boss
  ctx.fillStyle = colors.boss;
  ctx.fillRect(state.boss.pos.x, state.boss.pos.y, state.boss.w, state.boss.h);
  
  // Boss weak spot (exposto na parte inferior, alinhado ao fundo)
  ctx.fillStyle = colors.bossWeakSpot;
  ctx.fillRect(state.boss.weakSpot.x, state.boss.weakSpot.y, state.boss.weakSpot.w, state.boss.weakSpot.h);
  
  // Boss arms
  ctx.fillStyle = colors.bossArm;
  for (const arm of state.boss.arms) {
    ctx.fillRect(arm.pos.x, arm.pos.y, arm.w, arm.h);
  }

  // Bullets
  let skinData: ReturnType<typeof getSkinData> | null = null;
  let textureName = '';
  
  // Only get skin data once if there are player bullets
  const hasPlayerBullets = state.bullets.some(b => b.from !== 'boss');
  if (hasPlayerBullets) {
    try {
      skinData = getSkinData();
      const originalTextureName = skinData?.textureName || '';
      textureName = originalTextureName.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      // Debug log (temporário)
      if (state.bullets.length > 0 && state.bullets[0].from === 'player') {
        console.log('[Bullet Render] Original textureName:', originalTextureName, 'Normalized:', textureName, 'Full skinData:', skinData);
      }
    } catch (error) {
      console.error('Error getting skin data:', error);
      textureName = '';
    }
  }
  
  for (const bullet of state.bullets) {
    if (bullet.from === 'boss') {
      ctx.fillStyle = colors.bossBullet;
      // Calcular ângulo do tiro baseado na velocidade
      // Adicionar 90 graus (π/2) para corrigir a orientação
      const angle = Math.atan2(bullet.vel.y, bullet.vel.x) + Math.PI / 2;
      const centerX = bullet.pos.x + bullet.w / 2;
      const centerY = bullet.pos.y + bullet.h / 2;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      // Desenhar quadrado rotacionado (centralizado)
      ctx.fillRect(-bullet.w / 2, -bullet.h / 2, bullet.w, bullet.h);
      
      ctx.restore();
    } else {
      // Player bullets - check for emoji skins
      const centerX = bullet.pos.x + bullet.w / 2;
      const centerY = bullet.pos.y + bullet.h / 2;
      
      // Check textureName for fire or ice
      const normalizedTextureName = textureName || '';
      
      if (normalizedTextureName.includes('fire')) {
        // Fire emoji bullet
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', centerX, centerY);
        ctx.restore();
      } else if (normalizedTextureName.includes('ice') || normalizedTextureName.includes('gelo')) {
        // Ice emoji bullet - usando ❄️ (snowflake) para gelo
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', centerX, centerY);
        ctx.restore();
      } else {
        // Default bullet
        ctx.fillStyle = colors.playerBullet;
        ctx.fillRect(bullet.pos.x, bullet.pos.y, bullet.w, bullet.h);
      }
    }
  }

  // Damage Numbers (renderizar depois dos bullets para ficar por cima)
  for (const damageNumber of state.damageNumbers) {
    const lifeProgress = damageNumber.life / damageNumber.maxLife;
    const alpha = Math.min(1, Math.max(0, lifeProgress * 2)); // Fade out na segunda metade
    const scale = 0.8 + lifeProgress * 0.4; // Começa menor e cresce
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Posição
    const x = Math.floor(damageNumber.pos.x);
    const y = Math.floor(damageNumber.pos.y);
    
    const isCritical = damageNumber.isCritical || false;
    
    // Escala do texto (menor para crítico)
    const fontSize = isCritical 
      ? Math.max(4, Math.floor(6 * scale)) // Menor para crítico
      : Math.max(5, Math.floor(7 * scale));
    ctx.font = `bold ${fontSize}px 'Pixelify Sans', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Cor e estilo diferentes para crítico
    if (isCritical) {
      // Contorno para crítico
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('Critical!', x, y - fontSize - 2);
      ctx.strokeText(damageNumber.value.toString(), x, y);
      
      // Texto roxo para crítico
      ctx.fillStyle = '#9333ea'; // Roxo vibrante para crítico
      ctx.fillText('Critical!', x, y - fontSize - 2);
      ctx.fillText(damageNumber.value.toString(), x, y);
    } else {
      // Contorno preto (outline) estilo Fortnite
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2; // Reduzido proporcionalmente
      ctx.strokeText(damageNumber.value.toString(), x, y);
      
      // Texto branco/amarelo
      ctx.fillStyle = '#ffff00'; // Amarelo como Fortnite
      ctx.fillText(damageNumber.value.toString(), x, y);
    }
    
    ctx.restore();
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
    ctx.font = FONT_XS;
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
    ctx.font = FONT_SM;
    ctx.textBaseline = 'top';
    ctx.fillText('VITÓRIA!', boxX + 8, boxY + 8);

    // Button
    const btnW = 96;
    const btnH = 16;
    const btnX = boxX + (boxW - btnW) / 2;
    const btnY = boxY + boxH - btnH - 8;
    
    // Button colors based on state
    const btnBgColor = nextBtnPressed ? '#0f0' : (nextBtnHover ? '#333' : '#222');
    const btnBorderColor = nextBtnPressed ? '#fff' : (nextBtnHover ? '#4f4' : '#0f0');
    const btnTextColor = nextBtnPressed ? '#000' : (nextBtnHover ? '#4f4' : '#0f0');
    
    ctx.fillStyle = btnBgColor;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = btnBorderColor;
    ctx.lineWidth = nextBtnHover || nextBtnPressed ? 2 : 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = btnTextColor;
    ctx.font = FONT_XS;
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
    ctx.font = FONT_MD;
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
    ctx.font = FONT_SM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GAME OVER', boxX + boxW / 2, boxY + 8);

    // Restart message
    ctx.fillStyle = '#fff';
    ctx.font = FONT_XS;
    ctx.fillText('Reiniciando em...', boxX + boxW / 2, boxY + 32);

    // Countdown based on restart timer
    const restartTime = 2.0; // 2 seconds from GameCanvas
    const timeLeft = Math.max(0, restartTime - state.restartTimer);
    const countdown = Math.ceil(timeLeft);
    
    ctx.fillStyle = '#ff0';
    ctx.font = FONT_SM;
    ctx.fillText(countdown.toString(), boxX + boxW / 2, boxY + 48);
  }
}
