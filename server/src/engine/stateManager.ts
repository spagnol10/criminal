// ============================================================
// STATE MANAGER — Servidor é SEMPRE autoritativo
// O cliente recebe apenas o que precisa ver (hidden state)
// ============================================================

import type { Player, PlayerRole, GamePhase, NightAction, Evidence, MatchEvent, GameMap } from "../../lib/game.types";

export interface HiddenPlayerState {
  id: string;
  role: PlayerRole;
  hasUsedAbility: boolean;
  abilityCooldown: number;
  isSpectator: boolean;
}

export interface VisiblePlayerState {
  id: string;
  nickname: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  votedFor: string | null;
  suspicionScore: number;
  // NÃO expõe: role, hasUsedAbility, abilityCooldown
}

export interface RoomState {
  code: string;
  hostId: string;
  // Estado completo — só servidor acessa
  _players: Map<string, Player & { role: PlayerRole }>;
  phase: GamePhase;
  round: number;
  maxPlayers: number;
  isPrivate: boolean;
  nightActions: NightAction[];
  votes: Record<string, string>;
  phaseTimer: NodeJS.Timeout | null;
  // v2 state
  evidence: Evidence[];
  suspicionProfiles: Map<string, number>; // playerId -> score
  matchEvents: MatchEvent[];
  map: GameMap | null;
  activeEventIds: string[];
  voteHistory: Record<string, string[]>; // playerId -> list of targets
  chatCount: Record<string, number>;     // playerId -> message count
  roundStartedAt: number;
  lastActionTimes: Map<string, number>;  // playerId -> timestamp (anti-cheat)
  reconnectTokens: Map<string, string>;
}

// ── Projeção segura para o cliente ───────────────────────────

export function projectVisibleState(room: RoomState): VisiblePlayerState[] {
  return Array.from(room._players.values()).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    isAlive: p.isAlive,
    isHost: p.isHost,
    isConnected: p.isConnected,
    votedFor: p.votedFor ?? null,
    suspicionScore: room.suspicionProfiles.get(p.id) ?? 0,
  }));
}

export function projectMyState(room: RoomState, playerId: string): (VisiblePlayerState & HiddenPlayerState) | null {
  const p = room._players.get(playerId);
  if (!p) return null;
  return {
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    isAlive: p.isAlive,
    isHost: p.isHost,
    isConnected: p.isConnected,
    votedFor: p.votedFor ?? null,
    suspicionScore: room.suspicionProfiles.get(p.id) ?? 0,
    // Só o próprio jogador vê seu estado oculto
    role: p.role,
    hasUsedAbility: p.hasUsedAbility,
    abilityCooldown: p.abilityCooldown,
    isSpectator: p.isSpectator,
  };
}

// ── Helpers de acesso ─────────────────────────────────────────

export function getAlivePlayers(room: RoomState): (Player & { role: PlayerRole })[] {
  return Array.from(room._players.values()).filter((p) => p.isAlive && !p.isSpectator);
}

export function createPlayer(socketId: string, nickname: string, avatar: string, isHost: boolean): Player & { role: PlayerRole } {
  return {
    id: socketId, nickname, avatar, role: "citizen",
    isAlive: true, isHost, isConnected: true, votedFor: null,
    suspicionScore: 0, isSpectator: false,
    hasUsedAbility: false, abilityCooldown: 0,
  };
}
