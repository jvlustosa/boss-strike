import type { Boss, Bullet, Player } from '../core/types';
import { LOGICAL_H } from '../core/config';

export function updateBoss(boss: Boss, dt: number, bullets: Bullet[], player: Player): void {
  // Atualizar posição do weak spot relativo ao boss
  boss.weakSpot.x = boss.pos.x + boss.w / 2 - boss.weakSpot.w / 2;
  boss.weakSpot.y = boss.pos.y + boss.h / 2 - boss.weakSpot.h / 2;
  
  // Atualizar braços
  for (const arm of boss.arms) {
    // Movimento oscilatório dos braços
    arm.angle += arm.moveSpeed * dt;
    const oscillation = Math.sin(arm.angle) * 3;
    arm.pos.y = boss.pos.y + boss.h / 2 + oscillation;
    
    // Cooldown dos tiros
    arm.shootCooldown -= dt;
    
    // Atirar periodicamente
    if (arm.shootCooldown <= 0 && player.alive) {
      arm.shootCooldown = 1.5; // Atirar a cada 1.5 segundos
      
      // Calcular direção para o jogador
      const armCenterX = arm.pos.x + arm.w / 2;
      const armCenterY = arm.pos.y + arm.h;
      const playerCenterX = player.pos.x + player.w / 2;
      const playerCenterY = player.pos.y + player.h / 2;
      
      const deltaX = playerCenterX - armCenterX;
      const deltaY = playerCenterY - armCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Normalizar e aplicar velocidade
      const speed = 50;
      const velX = (deltaX / distance) * speed;
      const velY = (deltaY / distance) * speed;
      
      // Criar projétil do braço mirando no jogador
      bullets.push({
        pos: { x: armCenterX - 1, y: armCenterY },
        w: 2,
        h: 4,
        vel: { x: velX, y: velY },
        from: 'boss',
      });
    }
  }
}

export function damageBoss(boss: Boss, damage: number): void {
  boss.hp = Math.max(0, boss.hp - damage);
}
