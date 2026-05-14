// ============================================================
// SUSPICION ENGINE — Análise comportamental em tempo real
// ============================================================

import type { RoomState } from "./stateManager";

export interface SuspicionEvent {
  type:
    | "vote_against_innocent"  // votou em inocente confirmado
    | "vote_switch"            // mudou voto (não aplicável ainda, futuro)
    | "silent"                 // ficou quieto durante a discussão
    | "early_accuser"          // acusou sem base no início
    | "near_crime"             // estava próximo da última morte (futuro: mapa)
    | "chat_flood"             // mandou muitas msgs rápido
    | "defensive"              // se defendeu quando não era alvo
    | "helped_killer"          // votou no mesmo alvo que o killer depois revelado
    | "investigated_clean"     // foi investigado e era inocente (reduz suspeita)
    | "saved_life"             // médico salvou alguém (reduz suspeita do médico)
    ;
  playerId: string;
  round: number;
  details?: string;
}

const SUSPICION_DELTAS: Record<SuspicionEvent["type"], number> = {
  vote_against_innocent: +12,
  vote_switch:           +8,
  silent:                +10,
  early_accuser:         +15,
  near_crime:            +20,
  chat_flood:            +5,
  defensive:             +8,
  helped_killer:         +18,
  investigated_clean:    -20,
  saved_life:            -15,
};

export function applySuspicion(room: RoomState, event: SuspicionEvent): void {
  const delta = SUSPICION_DELTAS[event.type] ?? 0;
  const current = room.suspicionProfiles.get(event.playerId) ?? 0;
  const next = Math.min(100, Math.max(0, current + delta));
  room.suspicionProfiles.set(event.playerId, next);

  room.matchEvents.push({
    type: "ability",
    actorId: event.playerId,
    targetId: undefined,
    description: buildSuspicionDescription(event),
    round: event.round,
    phase: "DAY",
    timestamp: Date.now(),
    isPublic: false,
  } as unknown as import("../../lib/game.types").MatchEvent);
}

function buildSuspicionDescription(event: SuspicionEvent): string {
  switch (event.type) {
    case "silent":          return "Ficou em silêncio suspeito durante a discussão.";
    case "early_accuser":   return "Fez acusações sem evidência logo no início.";
    case "vote_against_innocent": return "Votou num inocente confirmado.";
    case "chat_flood":      return "Mandou muitas mensagens rapidamente.";
    case "defensive":       return "Se defendeu quando ninguém estava acusando.";
    case "helped_killer":   return "Votou no mesmo alvo que o assassino (revelado depois).";
    case "investigated_clean": return "Foi investigado e é inocente.";
    case "saved_life":      return "Salvou uma vida — reduz suspeita.";
    default:                return event.type;
  }
}

// Analisa votos após revelação do resultado — quem ajudou o assassino?
export function analyzeVotesPostRound(
  room: RoomState,
  killerIds: Set<string>,
  roundVotes: Record<string, string>,
  eliminatedId: string | null,
  round: number,
): void {
  for (const [voterId, targetId] of Object.entries(roundVotes)) {
    const voter = room._players.get(voterId);
    if (!voter) continue;

    const target = room._players.get(targetId);
    if (!target) continue;

    const targetIsKiller = killerIds.has(targetId);
    const targetIsEliminated = targetId === eliminatedId;

    // Se votou em inocente eliminado: +suspeita
    if (targetIsEliminated && !targetIsKiller) {
      applySuspicion(room, { type: "vote_against_innocent", playerId: voterId, round });
    }

    // Se votou junto com killers no mesmo alvo
    const killerVoteTargets = Object.entries(roundVotes)
      .filter(([id]) => killerIds.has(id))
      .map(([, t]) => t);
    if (killerVoteTargets.includes(targetId) && !killerIds.has(voterId)) {
      applySuspicion(room, { type: "helped_killer", playerId: voterId, round });
    }
  }
}

// Detecta jogadores silenciosos no chat
export function analyzeSilentPlayers(room: RoomState, round: number): void {
  for (const [id] of room._players.entries()) {
    const player = room._players.get(id);
    if (!player?.isAlive) continue;
    const msgCount = room.chatCount[id] ?? 0;
    if (msgCount < 2) {
      applySuspicion(room, { type: "silent", playerId: id, round });
    }
    if (msgCount > 12) {
      applySuspicion(room, { type: "chat_flood", playerId: id, round });
    }
  }
}

// Retorna top 3 mais suspeitos (para UI)
export function getTopSuspects(room: RoomState, count = 3): Array<{ playerId: string; score: number }> {
  const alive = Array.from(room._players.values())
    .filter((p) => p.isAlive)
    .map((p) => ({ playerId: p.id, score: room.suspicionProfiles.get(p.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);
  return alive.slice(0, count);
}
