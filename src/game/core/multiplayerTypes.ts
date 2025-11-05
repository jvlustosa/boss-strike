// Production-ready multiplayer types

export interface PlayerInput {
  x: number; // -1, 0, 1
  y: number; // -1, 0, 1
  fire: boolean;
  timestamp: number;
}

export interface RemotePlayer {
  id: string;
  name: string;
  isHost: boolean;
  index: number; // 0 or 1
  lastInputTime: number;
  lastStateUpdateTime: number;
  isConnected: boolean;
  latency: number;
}

export interface MultiplayerGameState {
  roomId: string;
  playerId: string;
  players: Map<string, RemotePlayer>;
  localPlayerIndex: number;
  isHost: boolean;
  frameNumber: number;
  serverTime: number;
  clientTime: number;
  timeDrift: number;
}

export interface NetworkMessage {
  type: 'join' | 'input' | 'state' | 'ping' | 'pong' | 'error';
  payload: any;
  timestamp: number;
  frameNumber?: number;
}

export interface GameStateSnapshot {
  frameNumber: number;
  timestamp: number;
  players: Array<{
    index: number;
    pos: { x: number; y: number };
    health: number;
    alive: boolean;
    cooldown: number;
  }>;
  boss: {
    pos: { x: number; y: number };
    hp: number;
    hpMax: number;
  };
  bulletsCount: number;
}

export interface InputSnapshot {
  playerId: string;
  input: PlayerInput;
  frameNumber: number;
  timestamp: number;
}

