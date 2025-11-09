import type { GameState } from '../core/types';
import { colors, getSkinData } from '../core/assets';
import { LOGICAL_W, LOGICAL_H } from '../core/config';
import { renderPlayer } from '../components/PlayerRenderer';

const FONT_XS = '6px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_XXS = '4px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_SM = '8px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_MD = '12px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_LG = '16px "Press Start 2P", "Pixelify Sans", monospace';
const FONT_XL = '20px "Press Start 2P", "Pixelify Sans", monospace';

export function renderSystem(ctx: CanvasRenderingContext2D, state: GameState, isPaused: boolean = false): void {
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

  // Boss (with optional shake)
  const bossIsShaking = state.bossShakeTimer > 0;
  const shouldRenderBoss = state.boss.hp > 0 && state.pixelParticles.length === 0;

  if (shouldRenderBoss) {
    const shakeMagnitude = bossIsShaking ? 1 + (state.bossShakeTimer / 2) * 2 : 0;
    const shakeOffsetX = bossIsShaking ? Math.sin(state.time * 80) * shakeMagnitude : 0;
    const shakeOffsetY = bossIsShaking ? Math.cos(state.time * 95) * shakeMagnitude : 0;

    ctx.save();
    if (bossIsShaking) {
      ctx.translate(shakeOffsetX, shakeOffsetY);
    }

    ctx.fillStyle = colors.boss;
    ctx.fillRect(state.boss.pos.x, state.boss.pos.y, state.boss.w, state.boss.h);
    
    ctx.fillStyle = colors.bossWeakSpot;
    ctx.fillRect(state.boss.weakSpot.x, state.boss.weakSpot.y, state.boss.weakSpot.w, state.boss.weakSpot.h);
    
    ctx.fillStyle = colors.bossArm;
    for (const arm of state.boss.arms) {
      ctx.fillRect(arm.pos.x, arm.pos.y, arm.w, arm.h);
    }
    ctx.restore();
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
    
    // Posição
    const x = Math.floor(damageNumber.pos.x);
    const y = Math.floor(damageNumber.pos.y);
    
    const isCritical = damageNumber.isCritical || false;
    
    // Tamanhos diferentes baseados no valor e tipo
    const baseSize = isCritical ? 8 : 7;
    const valueMultiplier = Math.min(1.5, 1 + (damageNumber.value / 100)); // Aumenta com dano
    const fontSize = Math.max(4, Math.floor(baseSize * scale * valueMultiplier));
    
    ctx.font = `bold ${fontSize}px 'Pixelify Sans', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Efeitos de brilho diferentes
    if (isCritical) {
      // Glow intenso pulsante para crítico
      const pulse = 0.7 + Math.sin(state.time * 8) * 0.3;
      const glowIntensity = pulse * alpha;
      
      // Múltiplas camadas de glow roxo/dourado
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = (glowIntensity * 0.3) / i;
        ctx.fillStyle = i === 3 ? '#9333ea' : (i === 2 ? '#fbbf24' : '#ffffff');
        ctx.fillText('Critical!', x, y - fontSize - 2);
        ctx.fillText(damageNumber.value.toString(), x, y);
      }
      
      // Glow externo mais suave
      ctx.globalAlpha = glowIntensity * 0.2;
      ctx.fillStyle = '#9333ea';
      for (let offset = 1; offset <= 4; offset++) {
        ctx.fillText('Critical!', x + offset, y - fontSize - 2);
        ctx.fillText('Critical!', x - offset, y - fontSize - 2);
        ctx.fillText('Critical!', x, y - fontSize - 2 + offset);
        ctx.fillText('Critical!', x, y - fontSize - 2 - offset);
        ctx.fillText(damageNumber.value.toString(), x + offset, y);
        ctx.fillText(damageNumber.value.toString(), x - offset, y);
        ctx.fillText(damageNumber.value.toString(), x, y + offset);
        ctx.fillText(damageNumber.value.toString(), x, y - offset);
      }
      
      // Contorno preto
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('Critical!', x, y - fontSize - 2);
      ctx.strokeText(damageNumber.value.toString(), x, y);
      
      // Texto principal roxo/dourado
      ctx.fillStyle = '#9333ea';
      ctx.fillText('Critical!', x, y - fontSize - 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(damageNumber.value.toString(), x, y);
    } else {
      // Glow suave amarelo para dano normal
      const glowIntensity = alpha * 0.4;
      
      // Glow externo
      ctx.globalAlpha = glowIntensity;
      ctx.fillStyle = '#ffff00';
      for (let offset = 1; offset <= 2; offset++) {
        ctx.fillText(damageNumber.value.toString(), x + offset, y);
        ctx.fillText(damageNumber.value.toString(), x - offset, y);
        ctx.fillText(damageNumber.value.toString(), x, y + offset);
        ctx.fillText(damageNumber.value.toString(), x, y - offset);
      }
      
      // Contorno preto
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(damageNumber.value.toString(), x, y);
      
      // Texto principal amarelo
      ctx.fillStyle = '#ffff00';
      ctx.fillText(damageNumber.value.toString(), x, y);
    }
    
    ctx.restore();
  }

  // Bomb Trail (renderizar antes do foguete) - Fumaça cinza escura
  if (state.bombTrailParticles.length > 0) {
    for (const particle of state.bombTrailParticles) {
      const lifeProgress = particle.life / particle.maxLife;
      const alpha = lifeProgress * 0.7; // Fade away gradual
      const size = 2 + (1 - lifeProgress) * 1; // Cresce ligeiramente ao desaparecer
      
      // Cinza escuro (fumaça) que fica mais claro e transparente ao desaparecer
      const grayValue = Math.floor(40 + (1 - lifeProgress) * 20); // 40-60 (escuro para mais claro)
      ctx.fillStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;
      ctx.fillRect(
        Math.floor(particle.pos.x - size / 2),
        Math.floor(particle.pos.y - size / 2),
        Math.max(1, Math.floor(size)),
        Math.max(1, Math.floor(size))
      );
    }
  }

  // Bomb (Rocket)
  if (state.bomb) {
    const bomb = state.bomb;
    const bobOffset = bomb.state === 'carried' ? 0 : Math.sin(bomb.floatTimer * 4) * 1.5;
    const renderX = Math.floor(bomb.pos.x);
    const renderY = Math.floor(bomb.pos.y + bobOffset);
    const centerX = renderX + bomb.w / 2;
    const centerY = renderY + bomb.h / 2;
    
    // Rotação baseada no estado (quando voando, aponta na direção do movimento)
    let rotation = 0;
    if (bomb.state === 'thrown') {
      // A direção do movimento é (cos(aimAngle), -sin(aimAngle))
      // O foguete está desenhado apontando para cima (ponta em y=-4, que é -π/2 no canvas)
      // Calculamos o ângulo da direção do movimento e ajustamos para o foguete apontar corretamente
      const dx = Math.cos(bomb.aimAngle);
      const dy = -Math.sin(bomb.aimAngle);
      const movementAngle = Math.atan2(dy, dx);
      // O foguete aponta para cima quando rotation=0, que é -π/2 no sistema do canvas
      // Então rotacionamos: movementAngle - (-π/2) = movementAngle + π/2
      rotation = movementAngle + Math.PI / 2;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    
    // Chama na parte traseira quando está voando
    if (bomb.state === 'thrown') {
      const flameTime = state.time * 25;
      const flameIntensity = 0.7 + Math.sin(flameTime) * 0.3;
      const flameSize = 2 + Math.sin(flameTime * 1.5) * 1;
      
      // Chama externa (laranja/amarelo)
      ctx.fillStyle = `rgba(255, ${Math.floor(100 + flameIntensity * 50)}, 0, ${flameIntensity})`;
      ctx.fillRect(-2, 4, 4, Math.floor(flameSize + 1));
      
      // Chama interna (amarelo brilhante)
      ctx.fillStyle = `rgba(255, ${Math.floor(200 + flameIntensity * 30)}, 0, ${flameIntensity * 0.9})`;
      ctx.fillRect(-1, 5, 2, Math.floor(flameSize));
    }
    
    // Aletas/estabilizadores na base
    ctx.fillStyle = '#cc4400';
    ctx.fillRect(-4, 2, 2, 2); // Aleta esquerda
    ctx.fillRect(2, 2, 2, 2);  // Aleta direita
    
    // Corpo principal do foguete (laranja/vermelho)
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-2, -3, 4, 6);
    
    // Detalhes do corpo (faixas)
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-2, -1, 4, 1);
    ctx.fillRect(-2, 1, 4, 1);
    
    // Ponta afiada do foguete
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-2, -2);
    ctx.lineTo(2, -2);
    ctx.closePath();
    ctx.fill();
    
    // Janela/olho do foguete
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(-1, -2, 2, 1);
    
    ctx.restore();

    if (bomb.state === 'carried') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const lineLength = 42;
      const aimX = centerX + Math.cos(bomb.aimAngle) * lineLength;
      const aimY = centerY - Math.sin(bomb.aimAngle) * lineLength;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Scorch marks from bomb explosions
  for (const mark of state.scorchMarks) {
    const fade = Math.max(0, Math.min(1, mark.life / mark.maxLife));
    const alpha = 0.35 * fade;
    const size = Math.max(4, Math.floor(mark.size));
    const x = Math.floor(mark.pos.x - (size - mark.size) / 2);
    const y = Math.floor(mark.pos.y - (size - mark.size) / 2);

    ctx.fillStyle = `rgba(60, 40, 20, ${alpha})`;
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = `rgba(30, 20, 10, ${alpha * 1.2})`;
    ctx.fillRect(x + 1, y + 1, Math.max(1, size - 2), Math.max(1, size - 2));
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

  // Pixel particles (boss explosion)
  for (const pixel of state.pixelParticles) {
    const alpha = pixel.life / pixel.maxLife;
    const size = pixel.size * alpha;
    
    ctx.save();
    ctx.translate(pixel.pos.x, pixel.pos.y);
    ctx.rotate(pixel.rotation);
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = pixel.color;
    ctx.fillRect(
      Math.floor(-size / 2),
      Math.floor(-size / 2),
      Math.max(1, Math.floor(size)),
      Math.max(1, Math.floor(size))
    );
    
    ctx.restore();
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

  // Shield Hits Remaining Display (quadrado azul à direita dos quadrados de vida)
  if (state.player.shieldHits > 0) {
    const healthEndX = 4 + state.player.maxHealth * 6;
    const shieldX = healthEndX + 8;
    
    // Quadrado azul do escudo
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(shieldX, LOGICAL_H - 8, 4, 4);
    
    // Número do escudo com fonte reduzida
    ctx.fillStyle = '#00aaff';
    ctx.font = '3px "Press Start 2P", "Pixelify Sans", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.player.shieldHits}`, shieldX + 6, LOGICAL_H - 7);
  }

  // Victory Overlay - Removido, agora é um componente React separado
  // O modal de vitória é renderizado como componente HTML sobreposto

  // Show pause indicator (não mostrar se o modal de vitória estiver visível)
  if (isPaused && !(state.status === 'won' && state.victoryTimer <= 0)) {
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
