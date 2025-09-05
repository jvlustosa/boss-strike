import type { LevelConfig } from './types';

// Configurações hardcoded baseadas no YAML para evitar dependências externas
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    name: "Primeiro Contato",
    bossHp: 20,
    armMoveSpeed: 1.5,
    armAmplitude: 3,
    armShootCooldown: 1.5,
    bossBulletSpeed: 50,
    bulletPattern: { type: 'single' }
  },
  2: {
    name: "Duplo Perigo",
    bossHp: 25,
    armMoveSpeed: 2.0,
    armAmplitude: 4,
    armShootCooldown: 1.2,
    bossBulletSpeed: 55,
    bulletPattern: { type: 'double', spread: 10 }
  },
  3: {
    name: "Rajada Veloz",
    bossHp: 30,
    armMoveSpeed: 2.5,
    armAmplitude: 5,
    armShootCooldown: 1.0,
    bossBulletSpeed: 78, // 60 * 1.3 = 78 (aumento de 30%)
    bulletPattern: { type: 'burst', burstCount: 3, burstDelay: 0.1 }
  },
  4: {
    name: "Spread Mortal",
    bossHp: 26,
    armMoveSpeed: 2.1,
    armAmplitude: 4.5,
    armShootCooldown: 1.6,
    bossBulletSpeed: 41,
    bulletPattern: { type: 'spread', numBullets: 3, spreadAngle: 22 },
    bossMovement: { type: 'horizontal', speed: 3, amplitude: 40 }
  },
  5: {
    name: "Círculo de Fogo",
    bossHp: 40,
    armMoveSpeed: 3.0,
    armAmplitude: 4,
    armShootCooldown: 1.1,
    bossBulletSpeed: 70,
    bulletPattern: { type: 'circular', numBullets: 8 },
    bossMovement: { type: 'vertical', speed: 20, amplitude: 30 }
  },
  6: {
    name: "Fúria Alternada",
    bossHp: 45,
    armMoveSpeed: 3.2,
    armAmplitude: 7,
    armShootCooldown: 0.9,
    bossBulletSpeed: 113,
    bulletPattern: { type: 'alternating', patterns: ['single', 'spread'], spreadAngle: 45 },
    bossMovement: { type: 'circular', speed: 25, amplitude: 35 }
  },
  7: {
    name: "Tempestade",
    bossHp: 50,
    armMoveSpeed: 3.5,
    armAmplitude: 5,
    armShootCooldown: 0.8,
    bossBulletSpeed: 80,
    bulletPattern: { type: 'spread', numBullets: 2, spreadAngle: 60 },
    bossMovement: { type: 'figure8', speed: 6, amplitude: 45 }
  },
  8: {
    name: "Caos Controlado",
    bossHp: 55,
    armMoveSpeed: 3.8,
    armAmplitude: 8,
    armShootCooldown: 0.7,
    bossBulletSpeed: 85,
    bulletPattern: { type: 'wave', waveCount: 2, delayBetweenWaves: 0.3 },
    bossMovement: { type: 'horizontal', speed: 5, amplitude: 50 }
  },
  9: {
    name: "Inferno",
    bossHp: 60,
    armMoveSpeed: 4.0,
    armAmplitude: 6,
    armShootCooldown: 0.6,
    bossBulletSpeed: 90,
    bulletPattern: { type: 'multi', patterns: ['circular', 'spread', 'burst'], cycleDelay: 2.0 },
    bossMovement: { type: 'circular', speed: 5, amplitude: 60 }
  },
  10: {
    name: "Boss Final",
    bossHp: 75,
    armMoveSpeed: 4.5,
    armAmplitude: 10,
    armShootCooldown: 0.5,
    bossBulletSpeed: 82,
    bulletPattern: { 
      type: 'ultimate', 
      phases: [
        { type: 'circular', numBullets: 12 },
        { type: 'spread', numBullets: 7, spreadAngle: 90 },
        { type: 'burst', burstCount: 5, burstDelay: 0.05 }
      ]
    },
    bossMovement: { type: 'figure8', speed: 6, amplitude: 70 }
  }
};

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

export function getMaxLevel(): number {
  return Math.max(...Object.keys(LEVEL_CONFIGS).map(Number));
}
