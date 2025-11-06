import type { LevelConfig } from './types';

// Configurações hardcoded baseadas no YAML para evitar dependências externas
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    name: "Primeiro Contato",
    bossHp: 20,
    armMoveSpeed: 0.75, // Reduced from 1.5 (50% slower)
    armAmplitude: 3,
    armShootCooldown: 1.5,
    bossBulletSpeed: 25, // Reduced from 50 (50% slower)
    bulletPattern: { type: 'single' }
  },
  2: {
    name: "Duplo Perigo",
    bossHp: 25,
    armMoveSpeed: 1.0, // Reduced from 2.0 (50% slower)
    armAmplitude: 4,
    armShootCooldown: 1.2,
    bossBulletSpeed: 28, // Reduced from 55 (50% slower)
    bulletPattern: { type: 'double', spread: 10 }
  },
  3: {
    name: "Rajada Veloz",
    bossHp: 30,
    armMoveSpeed: 1.25, // Reduced from 2.5 (50% slower)
    armAmplitude: 5,
    armShootCooldown: 1.0,
    bossBulletSpeed: 39, // Reduced from 78 (50% slower)
    bulletPattern: { type: 'burst', burstCount: 3, burstDelay: 0.1 }
  },
  4: {
    name: "Spread Mortal",
    bossHp: 26,
    armMoveSpeed: 1.05, // Reduced from 2.1 (50% slower)
    armAmplitude: 4.5,
    armShootCooldown: 1.6,
    bossBulletSpeed: 21, // Reduced from 41 (50% slower)
    bulletPattern: { type: 'spread', numBullets: 3, spreadAngle: 22 },
    bossMovement: { type: 'horizontal', speed: 1.5, amplitude: 40 } // Reduced from 3 (50% slower)
  },
  5: {
    name: "Círculo de Fogo",
    bossHp: 40,
    armMoveSpeed: 1.5, // Reduced from 3.0 (50% slower)
    armAmplitude: 4,
    armShootCooldown: 1.1,
    bossBulletSpeed: 35, // Reduced from 70 (50% slower)
    bulletPattern: { type: 'circular', numBullets: 8 },
    bossMovement: { type: 'vertical', speed: 10, amplitude: 30 } // Reduced from 20 (50% slower)
  },
  6: {
    name: "Fúria Alternada",
    bossHp: 45,
    armMoveSpeed: 1.6, // Reduced from 3.2 (50% slower)
    armAmplitude: 7,
    armShootCooldown: 0.9,
    bossBulletSpeed: 30, // Reduced from 60 (50% slower)
    bulletPattern: { type: 'alternating', patterns: ['single', 'spread'], spreadAngle: 45 },
    bossMovement: { type: 'circular', speed: 5, amplitude: 35 } // Reduced from 10 (50% slower)
  },
  7: {
    name: "Tempestade",
    bossHp: 50,
    armMoveSpeed: 1.75, // Reduced from 3.5 (50% slower)
    armAmplitude: 5,
    armShootCooldown: 0.8,
    bossBulletSpeed: 40, // Reduced from 80 (50% slower)
    bulletPattern: { type: 'spread', numBullets: 2, spreadAngle: 60 },
    bossMovement: { type: 'figure8', speed: 3, amplitude: 45 } // Reduced from 6 (50% slower)
  },
  8: {
    name: "Caos Controlado",
    bossHp: 55,
    armMoveSpeed: 1.9, // Reduced from 3.8 (50% slower)
    armAmplitude: 8,
    armShootCooldown: 0.7,
    bossBulletSpeed: 43, // Reduced from 85 (50% slower)
    bulletPattern: { type: 'wave', waveCount: 2, delayBetweenWaves: 0.3 },
    bossMovement: { type: 'horizontal', speed: 2.5, amplitude: 50 } // Reduced from 5 (50% slower)
  },
  9: {
    name: "Inferno",
    bossHp: 60,
    armMoveSpeed: 2.0, // Reduced from 4.0 (50% slower)
    armAmplitude: 6,
    armShootCooldown: 0.6,
    bossBulletSpeed: 45, // Reduced from 90 (50% slower)
    bulletPattern: { type: 'multi', patterns: ['circular', 'spread', 'burst'], cycleDelay: 2.0 },
    bossMovement: { type: 'circular', speed: 2.5, amplitude: 60 } // Reduced from 5 (50% slower)
  },
  10: {
    name: "Boss Final",
    bossHp: 75,
    armMoveSpeed: 2.25, // Reduced from 4.5 (50% slower)
    armAmplitude: 10,
    armShootCooldown: 0.5,
    bossBulletSpeed: 41, // Reduced from 82 (50% slower)
    bulletPattern: { 
      type: 'ultimate', 
      phases: [
        { type: 'circular', numBullets: 12 },
        { type: 'spread', numBullets: 7, spreadAngle: 90 },
        { type: 'burst', burstCount: 5, burstDelay: 0.05 }
      ]
    },
    bossMovement: { type: 'figure8', speed: 3, amplitude: 70 } // Reduced from 6 (50% slower)
  }
};

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

export function getMaxLevel(): number {
  return Math.max(...Object.keys(LEVEL_CONFIGS).map(Number));
}
