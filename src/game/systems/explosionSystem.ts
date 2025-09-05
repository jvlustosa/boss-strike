import type { GameState, ExplosionParticle, SmokeParticle } from '../core/types';

export function createBossExplosion(state: GameState, bossX: number, bossY: number, bossW: number, bossH: number): void {
  const particleCount = 20;
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#ff4400', '#ffaa00'];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = 30 + Math.random() * 40;
    const life = 0.8 + Math.random() * 0.4;
    
    const particle: ExplosionParticle = {
      pos: {
        x: bossX + bossW / 2 + (Math.random() - 0.5) * bossW,
        y: bossY + bossH / 2 + (Math.random() - 0.5) * bossH,
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

export function updateExplosionSystem(state: GameState, dt: number): void {
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
