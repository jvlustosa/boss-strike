import type { GameState, ExplosionParticle, SmokeParticle, PixelParticle } from '../core/types';

export function createBossExplosion(state: GameState, bossX: number, bossY: number, bossW: number, bossH: number): void {
  // Create pixel explosion - many small square particles
  const pixelSize = 2;
  const pixelSpacing = 3;
  const bossColor = '#ff0000'; // Red boss color
  const bossArmColor = '#cc0000'; // Darker red for arms
  const weakSpotColor = '#ffff00'; // Yellow weak spot color
  
  // Calculate grid of pixels
  const cols = Math.floor(bossW / pixelSpacing);
  const rows = Math.floor(bossH / pixelSpacing);
  const centerX = bossX + bossW / 2;
  const centerY = bossY + bossH / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pixelX = bossX + col * pixelSpacing + pixelSpacing / 2;
      const pixelY = bossY + row * pixelSpacing + pixelSpacing / 2;
      
      // Check if pixel is in weak spot area
      const isWeakSpot = pixelX >= state.boss.weakSpot.x && 
                        pixelX <= state.boss.weakSpot.x + state.boss.weakSpot.w &&
                        pixelY >= state.boss.weakSpot.y && 
                        pixelY <= state.boss.weakSpot.y + state.boss.weakSpot.h;
      
      // Calculate direction from center
      const dx = pixelX - centerX;
      const dy = pixelY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Speed based on distance from center (farther = faster)
      const baseSpeed = 40 + (distance / Math.max(bossW, bossH)) * 60;
      const speed = baseSpeed + Math.random() * 30;
      
      // Life based on distance (farther pixels live longer)
      const life = 0.6 + (distance / Math.max(bossW, bossH)) * 0.8 + Math.random() * 0.4;
      
      const pixel: PixelParticle = {
        pos: { x: pixelX, y: pixelY },
        vel: {
          x: Math.cos(angle) * speed + (Math.random() - 0.5) * 20,
          y: Math.sin(angle) * speed + (Math.random() - 0.5) * 20,
        },
        life,
        maxLife: life,
        size: pixelSize + Math.random() * 2,
        color: isWeakSpot ? weakSpotColor : bossColor,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      };
      
      state.pixelParticles.push(pixel);
    }
  }
  
  // Create pixel particles for boss arms
  for (const arm of state.boss.arms) {
    const armCols = Math.floor(arm.w / pixelSpacing);
    const armRows = Math.floor(arm.h / pixelSpacing);
    
    for (let row = 0; row < armRows; row++) {
      for (let col = 0; col < armCols; col++) {
        const pixelX = arm.pos.x + col * pixelSpacing + pixelSpacing / 2;
        const pixelY = arm.pos.y + row * pixelSpacing + pixelSpacing / 2;
        
        const dx = pixelX - centerX;
        const dy = pixelY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const baseSpeed = 40 + (distance / Math.max(bossW, bossH)) * 60;
        const speed = baseSpeed + Math.random() * 30;
        const life = 0.6 + (distance / Math.max(bossW, bossH)) * 0.8 + Math.random() * 0.4;
        
        const pixel: PixelParticle = {
          pos: { x: pixelX, y: pixelY },
          vel: {
            x: Math.cos(angle) * speed + (Math.random() - 0.5) * 20,
            y: Math.sin(angle) * speed + (Math.random() - 0.5) * 20,
          },
          life,
          maxLife: life,
          size: pixelSize + Math.random() * 2,
          color: bossArmColor,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 10,
        };
        
        state.pixelParticles.push(pixel);
      }
    }
  }
  
  // Also create some fire explosion particles for extra effect
  const particleCount = 15;
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#ff4400', '#ffaa00'];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = 30 + Math.random() * 40;
    const life = 0.8 + Math.random() * 0.4;
    
    const particle: ExplosionParticle = {
      pos: {
        x: centerX + (Math.random() - 0.5) * bossW,
        y: centerY + (Math.random() - 0.5) * bossH,
      },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      life,
      maxLife: life,
      size: 1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    
    state.explosionParticles.push(particle);
  }
  
  // Create initial smoke particles
  createBossSmoke(state, bossX, bossY, bossW, bossH);
}

export function createBossSmoke(state: GameState, bossX: number, bossY: number, bossW: number, bossH: number): void {
  const smokeCount = 8;
  
  for (let i = 0; i < smokeCount; i++) {
    const smoke: SmokeParticle = {
      pos: {
        x: bossX + bossW / 2 + (Math.random() - 0.5) * bossW * 0.8,
        y: bossY + bossH / 2 + (Math.random() - 0.5) * bossH * 0.8,
      },
      vel: {
        x: (Math.random() - 0.5) * 10,
        y: -20 - Math.random() * 15,
      },
      life: 2.0 + Math.random() * 1.0,
      maxLife: 2.0 + Math.random() * 1.0,
      size: 2 + Math.random() * 3,
      alpha: 0.8,
      drift: Math.random() * 0.5,
    };
    
    state.smokeParticles.push(smoke);
  }
}

export function createBulletExplosion(state: GameState, bulletX: number, bulletY: number, bulletW: number, bulletH: number): void {
  const particleCount = 8;
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#ff4400', '#ffaa00'];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = 15 + Math.random() * 20;
    const life = 0.5 + Math.random() * 0.3;
    
    const particle: ExplosionParticle = {
      pos: {
        x: bulletX + bulletW / 2 + (Math.random() - 0.5) * bulletW,
        y: bulletY + bulletH / 2 + (Math.random() - 0.5) * bulletH,
      },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      life,
      maxLife: life,
      size: 0.5 + Math.random() * 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    
    state.explosionParticles.push(particle);
  }
}

export function updateExplosionSystem(state: GameState, dt: number): void {
  // Update pixel particles
  for (let i = state.pixelParticles.length - 1; i >= 0; i--) {
    const pixel = state.pixelParticles[i];
    
    // Update position
    pixel.pos.x += pixel.vel.x * dt;
    pixel.pos.y += pixel.vel.y * dt;
    
    // Apply gravity
    pixel.vel.y += 30 * dt;
    
    // Apply air resistance
    pixel.vel.x *= 0.98;
    pixel.vel.y *= 0.98;
    
    // Update rotation
    pixel.rotation += pixel.rotationSpeed * dt;
    
    // Update life
    pixel.life -= dt;
    
    // Remove dead particles
    if (pixel.life <= 0) {
      state.pixelParticles.splice(i, 1);
    }
  }
  
  // Update explosion particles
  for (let i = state.explosionParticles.length - 1; i >= 0; i--) {
    const particle = state.explosionParticles[i];
    
    // Update position
    particle.pos.x += particle.vel.x * dt;
    particle.pos.y += particle.vel.y * dt;
    
    // Apply gravity
    particle.vel.y += 20 * dt;
    
    // Update life
    particle.life -= dt;
    
    // Remove dead particles
    if (particle.life <= 0) {
      state.explosionParticles.splice(i, 1);
    }
  }
  
  // Update smoke particles
  for (let i = state.smokeParticles.length - 1; i >= 0; i--) {
    const smoke = state.smokeParticles[i];
    
    // Update position
    smoke.pos.x += smoke.vel.x * dt;
    smoke.pos.y += smoke.vel.y * dt;
    
    // Add drift effect
    smoke.vel.x += Math.sin(smoke.life * 3) * smoke.drift * dt;
    
    // Slow down over time
    smoke.vel.x *= 0.98;
    smoke.vel.y *= 0.99;
    
    // Update life and alpha
    smoke.life -= dt;
    smoke.alpha = (smoke.life / smoke.maxLife) * 0.8;
    
    // Grow in size over time
    smoke.size += 0.5 * dt;
    
    // Remove dead particles
    if (smoke.life <= 0) {
      state.smokeParticles.splice(i, 1);
    }
  }
  
  // Continue creating smoke during victory timer (boss death animation)
  if (state.victoryTimer > 0 && state.boss.hp <= 0) {
    // Create new smoke particles every 0.1 seconds
    if (Math.random() < 0.3) {
      createBossSmoke(state, state.boss.pos.x, state.boss.pos.y, state.boss.w, state.boss.h);
    }
  }
}
