export type Vec2 = { x: number; y: number };

export type Player = {
  pos: Vec2;
  w: number;
  h: number;
  speed: number;
  cooldown: number;
  alive: boolean;
  health: number;
  maxHealth: number;
};

export type BossArm = {
  pos: Vec2;
  w: number;
  h: number;
  angle: number;
  shootCooldown: number;
  moveSpeed: number;
};

export type Boss = {
  pos: Vec2;
  w: number;
  h: number;
  weakSpot: { x: number; y: number; w: number; h: number };
  hp: number;
  hpMax: number;
  arms: BossArm[];
  moveAngle: number;
  moveTimer: number;
  shootTimer: number;
  patternPhase: number;
};

export type Bullet = {
  pos: Vec2;
  w: number;
  h: number;
  vel: Vec2;
  from: 'player' | 'boss';
};

export type Heart = {
  pos: Vec2;
  w: number;
  h: number;
  collected: boolean;
};

export type BulletPattern = 
  | { type: 'single' }
  | { type: 'double'; spread: number }
  | { type: 'burst'; burstCount: number; burstDelay: number }
  | { type: 'spread'; numBullets: number; spreadAngle: number }
  | { type: 'circular'; numBullets: number }
  | { type: 'alternating'; patterns: string[]; spreadAngle?: number }
  | { type: 'wave'; waveCount: number; delayBetweenWaves: number }
  | { type: 'multi'; patterns: string[]; cycleDelay: number }
  | { type: 'ultimate'; phases: Array<{ type: string; [key: string]: any }> };

export type LevelConfig = {
  name: string;
  bossHp: number;
  armMoveSpeed: number;
  armAmplitude: number;
  armShootCooldown: number;
  bossBulletSpeed: number;
  bulletPattern: BulletPattern;
  bossMovement?: {
    type: 'static' | 'horizontal' | 'vertical' | 'circular' | 'figure8';
    speed?: number;
    amplitude?: number;
  };
};

export type GameState = {
  time: number;
  level: number;
  levelConfig: LevelConfig;
  player: Player;
  boss: Boss;
  bullets: Bullet[];
  hearts: Heart[];
  heartsSpawnedThisLevel: number;
  keys: Record<string, boolean>;
  status: 'playing' | 'won' | 'lost';
};
