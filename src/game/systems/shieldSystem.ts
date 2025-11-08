import type { GameState, Shield, ShieldFragment } from '../core/types';
import { LOGICAL_W, LOGICAL_H } from '../core/config';
import { random } from '../engine/math';

export function shieldSystem(state: GameState, dt: number): void {
  // Atualizar cooldown do escudo
  if (state.shieldCooldown > 0) {
    state.shieldCooldown -= dt;
  }
  
  // Spawn escudos aleatoriamente (chance baixa por segundo)
  // Máximo definido por nível, máximo 1 simultâneo no mapa, esperar 6 seg após pegar
  if (state.maxShieldsThisLevel > 0 &&
      state.shieldCooldown <= 0 &&
      Math.random() < 0.15 * dt && 
      state.shields.length === 0 && 
      state.shieldsSpawnedThisLevel < state.maxShieldsThisLevel) {
    spawnShield(state);
  }
  
  // Remover escudos coletados
  state.shields = state.shields.filter(shield => !shield.collected);
}

function spawnShield(state: GameState): void {
  // Evitar spawnar muito perto do jogador, boss ou nas bordas
  const margin = 16;
  const playerX = state.player.pos.x + state.player.w / 2;
  const playerY = state.player.pos.y + state.player.h / 2;
  const bossX = state.boss.pos.x + state.boss.w / 2;
  const bossY = state.boss.pos.y + state.boss.h / 2;
  
  let attempts = 0;
  let x, y;
  
  do {
    x = random(margin, LOGICAL_W - margin - 8);
    y = random(margin + 20, LOGICAL_H - margin - 8);
    attempts++;
  } while (
    attempts < 10 && (
      Math.abs(x - playerX) < 20 || Math.abs(y - playerY) < 20 ||
      Math.abs(x - bossX) < 30 || Math.abs(y - bossY) < 25
    )
  );
  
  const shield: Shield = {
    pos: { x, y },
    w: 8,
    h: 8,
    collected: false,
  };
  
  state.shields.push(shield);
  state.shieldsSpawnedThisLevel++;
}

export function createShieldFragments(state: GameState, x: number, y: number): void {
  const fragmentCount = 20;
  
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.3;
    const speed = 10 + Math.random() * 15;
    
    const fragment: ShieldFragment = {
      pos: { x, y },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      life: 2.0,
      maxLife: 2.0,
      size: 1 + Math.random() * 1,
    };
    
    state.shieldFragments.push(fragment);
  }
}

export function updateShieldFragments(state: GameState, dt: number): void {
  for (let i = state.shieldFragments.length - 1; i >= 0; i--) {
    const fragment = state.shieldFragments[i];
    
    // Atualizar posição
    fragment.pos.x += fragment.vel.x * dt;
    fragment.pos.y += fragment.vel.y * dt;
    
    // Aplicar desaceleração
    fragment.vel.x *= 0.95;
    fragment.vel.y *= 0.95;
    
    // Atualizar vida
    fragment.life -= dt;
    
    // Remover fragmentos mortos
    if (fragment.life <= 0) {
      state.shieldFragments.splice(i, 1);
    }
  }
}

