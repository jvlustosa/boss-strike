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
  shieldHits: number; // Número de tiros que o escudo pode resistir (0 = sem escudo)
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

export type Shield = {
  pos: Vec2;
  w: number;
  h: number;
  collected: boolean;
};

export type BombState = 'idle' | 'homing';

export type Bomb = {
  pos: Vec2;
  w: number;
  h: number;
  state: BombState;
  speed: number;
  damageFraction: number;
  floatTimer: number;
};

export type ScorchMark = {
  pos: Vec2;
  size: number;
  life: number;
  maxLife: number;
};

export type ShieldFragment = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
};

export type ExplosionParticle = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

export type SmokeParticle = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  drift: number;
};

export type MagicTrailParticle = {
  pos: Vec2;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  color: string; // Cor da skin para o rastro
  emoji?: string; // Emoji para skins especiais (smiley, etc)
};

export type DamageNumber = {
  pos: Vec2;
  value: number;
  life: number;
  maxLife: number;
  vel: Vec2; // Velocidade para movimento (sobe e drift)
  isCritical?: boolean; // Se é um hit crítico
};

export type BulletPattern = 
  | { type: 'single' }
  | { type: 'double'; spread: number }
  | { type: 'burst'; burstCount: number; burstDelay: number; doubleSpeed?: number }
  | { type: 'spread'; numBullets: number; spreadAngle: number }
  | { type: 'circular'; numBullets: number }
  | { type: 'alternating'; patterns: string[]; spreadAngle?: number }
  | { type: 'wave'; waveCount: number; delayBetweenWaves: number }
  | { type: 'multi'; patterns: string[]; cycleDelay: number; spreadSpeed?: number; spreadAngle?: number; burstCount?: number }
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
  bombDamageFraction?: number;
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
  shields: Shield[];
  shieldsSpawnedThisLevel: number;
  maxShieldsThisLevel: number; // Máximo de escudos para este nível (determinado no início)
  shieldCooldown: number; // Tempo desde que pegou o último escudo
  explosionParticles: ExplosionParticle[];
  smokeParticles: SmokeParticle[];
  shieldFragments: ShieldFragment[];
  magicTrailParticles: MagicTrailParticle[];
  damageNumbers: DamageNumber[];
  bomb: Bomb | null;
  bombUsedThisLevel: boolean;
  bombSpawnTimer: number;
  scorchMarks: ScorchMark[];
  keys: Record<string, boolean>;
  status: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  victoryTimer: number;
  restartTimer: number;
};
