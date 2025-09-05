import type { Boss, Bullet, Player, LevelConfig, BulletPattern } from '../core/types';
import { LOGICAL_H, LOGICAL_W } from '../core/config';

export function updateBoss(boss: Boss, dt: number, bullets: Bullet[], player: Player, levelConfig: LevelConfig): void {
  // Atualizar movimento do boss (a partir do nível 4)
  if (levelConfig.bossMovement) {
    updateBossMovement(boss, dt, levelConfig);
  }
  
  // Atualizar posição do weak spot relativo ao boss
  boss.weakSpot.x = boss.pos.x + boss.w / 2 - boss.weakSpot.w / 2;
  boss.weakSpot.y = boss.pos.y + boss.h / 2 - boss.weakSpot.h / 2;
  
  // Atualizar timers
  boss.shootTimer += dt;
  boss.patternPhase += dt;
  
  // Atualizar braços
  for (let i = 0; i < boss.arms.length; i++) {
    const arm = boss.arms[i];
    
    // Movimento oscilatório dos braços
    arm.angle += arm.moveSpeed * dt;
    const oscillation = Math.sin(arm.angle) * levelConfig.armAmplitude;
    
    // Se o boss se move, as mãos seguem o boss
    if (levelConfig.bossMovement) {
      // Braço esquerdo
      if (i === 0) {
        arm.pos.x = boss.pos.x - 8;
        arm.pos.y = boss.pos.y + boss.h / 2 + oscillation;
      }
      // Braço direito  
      else if (i === 1) {
        arm.pos.x = boss.pos.x + boss.w + 2;
        arm.pos.y = boss.pos.y + boss.h / 2 + oscillation;
      }
    } else {
      // Posição original para boss estático
      arm.pos.y = boss.pos.y + boss.h / 2 + oscillation;
    }
    
    // Cooldown dos tiros
    arm.shootCooldown -= dt;
    
    // Atirar periodicamente
    if (arm.shootCooldown <= 0 && player.alive) {
      arm.shootCooldown = levelConfig.armShootCooldown;
      
      // Calcular direção para o jogador
      const armCenterX = arm.pos.x + arm.w / 2;
      const armCenterY = arm.pos.y + arm.h;
      
      // Criar projéteis baseados no padrão do nível
      createBulletsFromPattern(
        bullets,
        levelConfig.bulletPattern,
        { x: armCenterX, y: armCenterY },
        player,
        levelConfig.bossBulletSpeed,
        boss
      );
    }
  }
}

function updateBossMovement(boss: Boss, dt: number, levelConfig: LevelConfig): void {
  const movement = levelConfig.bossMovement!;
  boss.moveTimer += dt;
  
  const centerX = LOGICAL_W / 2 - boss.w / 2;
  const centerY = 8; // posição Y inicial
  
  switch (movement.type) {
    case 'horizontal':
      boss.pos.x = centerX + Math.sin(boss.moveTimer * movement.speed! / 10) * movement.amplitude!;
      break;
      
    case 'vertical':
      boss.pos.y = centerY + Math.sin(boss.moveTimer * movement.speed! / 10) * movement.amplitude! * 0.3;
      break;
      
    case 'circular':
      const radius = movement.amplitude! * 0.5;
      boss.pos.x = centerX + Math.cos(boss.moveTimer * movement.speed! / 10) * radius;
      boss.pos.y = centerY + Math.sin(boss.moveTimer * movement.speed! / 10) * radius * 0.5;
      break;
      
    case 'figure8':
      const t = boss.moveTimer * movement.speed! / 10;
      boss.pos.x = centerX + Math.sin(t) * movement.amplitude! * 0.8;
      boss.pos.y = centerY + Math.sin(2 * t) * movement.amplitude! * 0.3;
      break;
  }
  
  // Manter o boss dentro dos limites da tela
  boss.pos.x = Math.max(0, Math.min(LOGICAL_W - boss.w, boss.pos.x));
  boss.pos.y = Math.max(0, Math.min(LOGICAL_H * 0.4, boss.pos.y));
}

function createBulletsFromPattern(
  bullets: Bullet[],
  pattern: BulletPattern,
  origin: { x: number; y: number },
  player: Player,
  speed: number,
  boss: Boss
): void {
  const playerCenterX = player.pos.x + player.w / 2;
  const playerCenterY = player.pos.y + player.h / 2;
  
  const deltaX = playerCenterX - origin.x;
  const deltaY = playerCenterY - origin.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const baseAngle = Math.atan2(deltaY, deltaX);
  
  switch (pattern.type) {
    case 'single':
      bullets.push(createBullet(origin, baseAngle, speed));
      break;
      
    case 'double':
      const spread = (pattern.spread * Math.PI) / 180;
      bullets.push(createBullet(origin, baseAngle, speed));
      bullets.push(createBullet(origin, baseAngle + spread / 4, speed));
      break;
      
    case 'spread':
      const spreadAngle = (pattern.spreadAngle * Math.PI) / 180;
      const angleStep = spreadAngle / (pattern.numBullets - 1);
      const startAngle = baseAngle - spreadAngle / 2;
      
      for (let i = 0; i < pattern.numBullets; i++) {
        bullets.push(createBullet(origin, startAngle + i * angleStep, speed));
      }
      break;
      
    case 'circular':
      const angleStepCircular = (2 * Math.PI) / pattern.numBullets;
      const rotationOffset = boss.shootTimer * 2; // rotação contínua
      for (let i = 0; i < pattern.numBullets; i++) {
        bullets.push(createBullet(origin, i * angleStepCircular + rotationOffset, speed));
      }
      break;
      
    case 'burst':
      bullets.push(createBullet(origin, baseAngle, speed));
      break;
      
    case 'alternating':
      const currentPattern = boss.patternPhase % 2 < 1 ? 'single' : 'spread';
      if (currentPattern === 'single') {
        bullets.push(createBullet(origin, baseAngle, speed));
      } else {
        const altSpreadAngle = ((pattern.spreadAngle || 45) * Math.PI) / 180;
        for (let i = 0; i < 3; i++) {
          const angle = baseAngle + (i - 1) * altSpreadAngle / 3;
          bullets.push(createBullet(origin, angle, speed));
        }
      }
      break;
      
    case 'wave':
      const wavePhase = boss.shootTimer * 3;
      for (let i = 0; i < (pattern.waveCount || 3); i++) {
        const waveAngle = baseAngle + Math.sin(wavePhase + i) * 0.5;
        bullets.push(createBullet(origin, waveAngle, speed));
      }
      break;
      
    case 'multi':
      const patterns = pattern.patterns || ['single', 'spread'];
      const currentMultiPattern = patterns[Math.floor(boss.patternPhase / 2) % patterns.length];
      
      if (currentMultiPattern === 'circular') {
        const circularStep = (2 * Math.PI) / 6;
        for (let i = 0; i < 6; i++) {
          bullets.push(createBullet(origin, i * circularStep + boss.shootTimer, speed));
        }
      } else if (currentMultiPattern === 'spread') {
        for (let i = 0; i < 5; i++) {
          const angle = baseAngle + (i - 2) * 0.3;
          bullets.push(createBullet(origin, angle, speed));
        }
      } else {
        bullets.push(createBullet(origin, baseAngle, speed));
      }
      break;
      
    case 'ultimate':
      const phases = pattern.phases || [];
      const phaseIndex = Math.floor(boss.patternPhase / 3) % phases.length;
      const currentPhase = phases[phaseIndex];
      
      if (currentPhase.type === 'circular') {
        const ultimateStep = (2 * Math.PI) / (currentPhase.numBullets || 8);
        for (let i = 0; i < (currentPhase.numBullets || 8); i++) {
          bullets.push(createBullet(origin, i * ultimateStep + boss.shootTimer * 2, speed));
        }
      } else if (currentPhase.type === 'spread') {
        const ultSpreadAngle = ((currentPhase.spreadAngle || 90) * Math.PI) / 180;
        const ultAngleStep = ultSpreadAngle / ((currentPhase.numBullets || 5) - 1);
        const ultStartAngle = baseAngle - ultSpreadAngle / 2;
        
        for (let i = 0; i < (currentPhase.numBullets || 5); i++) {
          bullets.push(createBullet(origin, ultStartAngle + i * ultAngleStep, speed));
        }
      } else if (currentPhase.type === 'burst') {
        for (let i = 0; i < (currentPhase.burstCount || 3); i++) {
          const burstAngle = baseAngle + (Math.random() - 0.5) * 0.4;
          bullets.push(createBullet(origin, burstAngle, speed * 1.2));
        }
      }
      break;
      
    default:
      bullets.push(createBullet(origin, baseAngle, speed));
  }
}

function createBullet(origin: { x: number; y: number }, angle: number, speed: number): Bullet {
  return {
    pos: { x: origin.x - 1, y: origin.y },
    w: 2,
    h: 4,
    vel: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    from: 'boss',
  };
}

export function damageBoss(boss: Boss, damage: number): void {
  boss.hp = Math.max(0, boss.hp - damage);
}
