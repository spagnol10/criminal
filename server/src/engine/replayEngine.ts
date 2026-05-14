// ============================================================
// REPLAY ENGINE — Timeline completa da partida
// ============================================================

import type { PlayerRole, GamePhase } from "../../lib/game.types";

export interface ReplayEvent {
  ts: number;           // timestamp absoluto
  round: number;
  phase: GamePhase;
  type: ReplayEventType;
  actorId?: string;
  actorNickname?: string;
  targetId?: string;
  targetNickname?: string;
  meta?: Record<string, unknown>;
}

export type ReplayEventType =
  | "phase_change"
  | "player_killed"
  | "player_saved"
  | "player_eliminated"
  | "player_voted"
  | "night_action"
  | "ability_used"
  | "event_triggered"
  | "evidence_found"
  | "role_revealed"
  | "game_started"
  | "game_ended";

export interface ReplayTimeline {
  matchId: string;
  startedAt: number;
  endedAt?: number;
  winner?: string;
  finalRoles: Record<string, PlayerRole>;
  events: ReplayEvent[];
}

// ── Em memória (seria Redis/DB em prod) ──────────────────────

const replays = new Map<string, ReplayTimeline>();

export function initReplay(matchId: string): void {
  replays.set(matchId, {
    matchId,
    startedAt: Date.now(),
    finalRoles: {},
    events: [],
  });
}

export function recordReplayEvent(matchId: string, event: ReplayEvent): void {
  const replay = replays.get(matchId);
  if (!replay) return;
  replay.events.push(event);
}

export function finalizeReplay(
  matchId: string,
  winner: string,
  finalRoles: Record<string, PlayerRole>,
): ReplayTimeline | null {
  const replay = replays.get(matchId);
  if (!replay) return null;
  replay.endedAt = Date.now();
  replay.winner = winner;
  replay.finalRoles = finalRoles;
  return replay;
}

export function getReplay(matchId: string): ReplayTimeline | null {
  return replays.get(matchId) ?? null;
}
