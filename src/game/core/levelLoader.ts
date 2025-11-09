import type { LevelConfig } from './types';

// Configurações hardcoded baseadas no YAML para evitar dependências externas
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    name: "Primeiro Contato",
    bossHp: 200,
    armMoveSpeed: 1.5,
    armAmplitude: 3,
    armShootCooldown: 1.5,
    bossBulletSpeed: 50,
    bulletPattern: { type: 'single' },
    bombDamageFraction: 0.1
  },
  2: {
    name: "Duplo Perigo",
    bossHp: 250,
    armMoveSpeed: 2.0,
    armAmplitude: 4,
    armShootCooldown: 1.2,
    bossBulletSpeed: 55,
    bulletPattern: { type: 'double', spread: 30 },
    bombDamageFraction: 2 / 9
  },
  3: {
    name: "Rajada Veloz",
    bossHp: 300,
    armMoveSpeed: 2.5,
    armAmplitude: 5,
    armShootCooldown: 1.0,
    bossBulletSpeed: 87, // 78 * 1.11 = 86.58 (aumento de 11% para tiro único)
    bulletPattern: { type: 'burst', burstCount: 3, burstDelay: 0.1, doubleSpeed: 78 }, // doubleSpeed: velocidade para 2 tiros (velocidade antiga)
    bossMovement: { type: 'horizontal', speed: 1.2, amplitude: 40 }, // 40% da velocidade padrão (3 * 0.40 = 1.2)
    bombDamageFraction: 0.1
  },
  4: {
    name: "Spread Mortal",
    bossHp: 260,
    armMoveSpeed: 2.1,
    armAmplitude: 4.5,
    armShootCooldown: 1.0,
    bossBulletSpeed: 51, // 49 * 1.05 = 51.45 (aumento de 5%)
    bulletPattern: { type: 'spread', numBullets: 3, spreadAngle: 22 },
    bossMovement: { type: 'horizontal', speed: 3.6, amplitude: 40 }, // 3 * 1.2 = 3.6 (aumento de 20%)
    bombDamageFraction: 2 / 9
  },
  5: {
    name: "Círculo de Fogo",
    bossHp: 400,
    armMoveSpeed: 3.0,
    armAmplitude: 4,
    armShootCooldown: 1.1,
    bossBulletSpeed: 70,
    bulletPattern: { type: 'circular', numBullets: 8 },
    bossMovement: { type: 'vertical', speed: 20, amplitude: 30 },
    bombDamageFraction: 2 / 9
  },
  6: {
    name: "Fúria Alternada",
    bossHp: 450,
    armMoveSpeed: 3.2,
    armAmplitude: 7,
    armShootCooldown: 0.9,
    bossBulletSpeed: 101, // 92 * 1.10 = 101.2 (aumento de 10%)
    bulletPattern: { type: 'alternating', patterns: ['single', 'double'], spreadAngle: 45 },
    bossMovement: { type: 'circular', speed: 10, amplitude: 35 }, // Reduced by 60% (25 * 0.4 = 10)
    bombDamageFraction: 2 / 9
  },
  7: {
    name: "Tempestade",
    bossHp: 500,
    armMoveSpeed: 3.5,
    armAmplitude: 5,
    armShootCooldown: 1.0, // 1 segundo entre rajadas
    bossBulletSpeed: 73, // 62 * 1.17 = 72.54 (aumento de 17%)
    bulletPattern: { type: 'spread', numBullets: 3, spreadAngle: 30 },
    bossMovement: { type: 'figure8', speed: 6, amplitude: 45 },
    bombDamageFraction: 0.2
  },
  8: {
    name: "Caos Controlado",
    bossHp: 550,
    armMoveSpeed: 3.8,
    armAmplitude: 8,
    armShootCooldown: 0.7,
    bossBulletSpeed: 67, // 71 * 0.94 = 66.74 (redução de 6%)
    bulletPattern: { type: 'wave', waveCount: 2, delayBetweenWaves: 0.3 },
    bossMovement: { type: 'horizontal', speed: 5, amplitude: 50 },
    bombDamageFraction: 1 / 3
  },
  9: {
    name: "Inferno",
    bossHp: 600,
    armMoveSpeed: 4.0,
    armAmplitude: 6,
    armShootCooldown: 0.6,
    bossBulletSpeed: 90,
    bulletPattern: { type: 'multi', patterns: ['circular', 'spread', 'burst'], cycleDelay: 2.0, spreadSpeed: 79, spreadAngle: 0.6, burstCount: 2 }, // spreadSpeed: 90 * 0.88 = 79.2 (redução de 12%), spreadAngle aumentado para separar mais, burstCount: 2 tiros de cada braço
    bossMovement: { type: 'circular', speed: 5, amplitude: 60 },
    bombDamageFraction: 1 / 3
  },
  10: {
    name: "Boss Final",
    bossHp: 600,
    armMoveSpeed: 4.0,
    armAmplitude: 8,
    armShootCooldown: 0.7,
    bossBulletSpeed: 60,
    bulletPattern: { 
      type: 'ultimate', 
      phases: [
        { type: 'circular', numBullets: 10 },
        { type: 'spread', numBullets: 5, spreadAngle: 140 },
        { type: 'burst', burstCount: 3, burstDelay: 0.1 }
      ]
    },
    bossMovement: { type: 'figure8', speed: 3, amplitude: 45 },
    bombDamageFraction: 1 / 3
  }
};

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

export function getMaxLevel(): number {
  return Math.max(...Object.keys(LEVEL_CONFIGS).map(Number));
}
