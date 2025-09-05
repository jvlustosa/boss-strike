export type Vec2 = { x: number; y: number };

export type Player = {
  pos: Vec2;
  w: number;
  h: number;
  speed: number;
  cooldown: number;
  alive: boolean;
};

export type Boss = {
  pos: Vec2;
  w: number;
  h: number;
  weakSpot: { x: number; y: number; w: number; h: number };
  hp: number;
  hpMax: number;
};

export type Bullet = {
  pos: Vec2;
  w: number;
  h: number;
  vel: Vec2;
  from: 'player' | 'boss';
};

export type GameState = {
  time: number;
  player: Player;
  boss: Boss;
  bullets: Bullet[];
  keys: Record<string, boolean>;
  status: 'playing' | 'won' | 'lost';
};
