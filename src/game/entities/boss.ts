import type { Boss, Bullet, Player, LevelConfig, BulletPattern } from '../core/types';
import { LOGICAL_H } from '../core/config';

export function updateBoss(boss: Boss, dt: number, bullets: Bullet[], player: Player, levelConfig: LevelConfig): void {
  // Atualizar posição do weak spot relativo ao boss
  boss.weakSpot.x = boss.pos.x + boss.w / 2 - boss.weakSpot.w / 2;
  boss.weakSpot.y = boss.pos.y + boss.h / 2 - boss.weakSpot.h / 2;
  
  // Atualizar braços
  for (const arm of boss.arms) {
    // Movimento oscilatório dos braços
    arm.angle += arm.moveSpeed * dt;
    const oscillation = Math.sin(arm.angle) * levelConfig.armAmplitude;
    arm.pos.y = boss.pos.y + boss.h / 2 + oscillation;
    
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
        levelConfig.bossBulletSpeed
      );
    }
  }
}

function createBulletsFromPattern(
  bullets: Bullet[],
  pattern: BulletPattern,
  origin: { x: number; y: number },
  player: Player,
  speed: number
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
      // Dois tiros: um direto ao jogador e outro levemente desviado
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
      for (let i = 0; i < pattern.numBullets; i++) {
        bullets.push(createBullet(origin, i * angleStepCircular, speed));
      }
      break;
      
    case 'burst':
      // Para burst, criamos apenas um tiro por chamada, mas com delay reduzido
      bullets.push(createBullet(origin, baseAngle, speed));
      break;
      
    default:
      // Fallback para single
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
