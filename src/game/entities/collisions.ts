import type { GameState, Bullet } from '../core/types';
import { aabbCollision } from '../engine/math';
import { damageBoss } from './boss';
import { audioManager } from '../core/audio';
import { createBossExplosion, createBulletExplosion } from '../systems/explosionSystem';
import { isCheatActive } from '../core/urlParams';
import { createShieldFragments } from '../systems/shieldSystem';

export function checkCollisions(state: GameState): void {
  const { bullets, boss, player, hearts, shields } = state;

  // Helper para converter entidades com { pos, w, h } em AABB plano { x, y, w, h }
  const toAABB = (o: { pos: { x: number; y: number }; w: number; h: number }) => ({
    x: o.pos.x,
    y: o.pos.y,
    w: o.w,
    h: o.h,
  });

  // Verificar colisão player com braços do boss
  if (player.alive) {
    for (const arm of boss.arms) {
      if (aabbCollision(toAABB(player), toAABB(arm))) {
        damagePlayer(state);
        return;
      }
    }
  }

  // Verificar colisão player com corações
  if (player.alive && player.health < player.maxHealth) {
    for (const heart of hearts) {
      if (!heart.collected && aabbCollision(toAABB(player), toAABB(heart))) {
        heart.collected = true;
        player.health++;
        audioManager.playCriticalSound('heal', 0.8);
      }
    }
  }

  // Verificar colisão player com escudos
  if (player.alive) {
    for (const shield of shields) {
      if (!shield.collected && aabbCollision(toAABB(player), toAABB(shield))) {
        shield.collected = true;
        player.shieldHits = 10; // Escudo pode resistir 10 tiros
        state.shieldCooldown = 6.0; // Esperar 6 segundos antes de spawnar outro
        audioManager.playCriticalSound('shield', 0.8);
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (bullet.from === 'player') {
      // Ignore collisions with boss if already dead
      if (boss.hp <= 0) {
        // Remove player bullets that hit dead boss
        bullets.splice(i, 1);
        continue;
      }
      
      // Check collision with boss weak spot
      if (aabbCollision(toAABB(bullet), boss.weakSpot)) {
        damageBoss(boss, 1);
        bullets.splice(i, 1);
        
        if (boss.hp <= 0) {
          // Collect boss bullets first to avoid modifying array during iteration
          const bossBullets: Bullet[] = [];
          for (const bullet of bullets) {
            if (bullet.from === 'boss') {
              bossBullets.push(bullet);
            }
          }
          // Create explosions for all boss bullets
          for (const bullet of bossBullets) {
            createBulletExplosion(state, bullet.pos.x, bullet.pos.y, bullet.w, bullet.h);
          }
          // Remove all boss bullets
          for (let j = bullets.length - 1; j >= 0; j--) {
            if (bullets[j].from === 'boss') {
              bullets.splice(j, 1);
            }
          }
          // Create explosion animation at boss current position and start victory timer
          createBossExplosion(state, boss.pos.x, boss.pos.y, boss.w, boss.h);
          // Only start timer if not already started (to prevent delays from continued shooting)
          if (state.victoryTimer <= 0) {
            state.victoryTimer = 2.0; // 2 seconds delay before victory screen and button appears
          }
          return; // Exit early to avoid processing remaining bullets
        }
      }
    } else if (bullet.from === 'boss') {
      // Boss bullets vs player collision
      if (player.alive && aabbCollision(toAABB(bullet), toAABB(player))) {
        // Se tiver escudo, reduzir hits do escudo em vez de dano
        if (player.shieldHits > 0) {
          player.shieldHits--;
          bullets.splice(i, 1);
          
          // Se escudo quebrou, criar fragmentos
          if (player.shieldHits === 0) {
            createShieldFragments(state, player.pos.x + player.w / 2, player.pos.y + player.h / 2);
          }
        } else {
          damagePlayer(state);
          bullets.splice(i, 1);
        }
      }
    }
  }
}

function damagePlayer(state: GameState): void {
  // Check if immortality cheat is active
  if (isCheatActive('imortal')) {
    return;
  }
  
  state.player.health--;
  
  // Play hit sound effect with random pitch variation
  audioManager.playRandomPitch('hit', 0.4, 0.8, 1.2);
  
  if (state.player.health <= 0) {
    state.player.alive = false;
    state.status = 'lost';
  }
}
