// ============================================================
// ANTI-CHEAT ENGINE
// Valida todas as ações antes de processar
// ============================================================

import type { PlayerRole } from "../../lib/game.types";
import type { RoomState } from "./stateManager";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

// Papéis que podem agir à noite
const NIGHT_ACTION_ROLES: PlayerRole[] = [
  "killer", "silentKiller", "doctor", "investigator",
  "hacker", "spy", "corruptCop",
];

// Papéis que podem usar habilidade ativa
const ABILITY_ROLES: PlayerRole[] = [
  "survivor", "informant", "ghost",
];

// Cooldown mínimo entre qualquer ação (ms) — detecta automação/macro
const MIN_ACTION_INTERVAL_MS = 200;

export function validateNightAction(
  room: RoomState,
  playerId: string,
  targetId: string,
): ValidationResult {
  if (room.phase !== "NIGHT") return { ok: false, reason: "Não é noite." };

  const actor = room._players.get(playerId);
  if (!actor) return { ok: false, reason: "Jogador não encontrado." };
  if (!actor.isAlive) return { ok: false, reason: "Jogador morto não pode agir." };
  if (actor.isSpectator) return { ok: false, reason: "Espectador não pode agir." };

  if (!NIGHT_ACTION_ROLES.includes(actor.role)) {
    return { ok: false, reason: `Papel ${actor.role} não age à noite.` };
  }

  const target = room._players.get(targetId);
  if (!target) return { ok: false, reason: "Alvo não encontrado." };
  if (!target.isAlive) return { ok: false, reason: "Alvo já está morto." };

  // Self-kill prevention
  if (playerId === targetId && actor.role === "killer") {
    return { ok: false, reason: "Não pode se auto-eliminar." };
  }

  // Rate limit — anti-automação
  const lastAction = room.lastActionTimes.get(playerId) ?? 0;
  if (Date.now() - lastAction < MIN_ACTION_INTERVAL_MS) {
    return { ok: false, reason: "Ação muito rápida. Possível automação detectada." };
  }

  return { ok: true };
}

export function validateVote(
  room: RoomState,
  voterId: string,
  targetId: string,
): ValidationResult {
  if (room.phase !== "VOTING") return { ok: false, reason: "Não é fase de votação." };

  const voter = room._players.get(voterId);
  if (!voter) return { ok: false, reason: "Votante não encontrado." };
  if (!voter.isAlive) return { ok: false, reason: "Morto não pode votar." };
  if (voter.isSpectator) return { ok: false, reason: "Espectador não pode votar." };

  const target = room._players.get(targetId);
  if (!target) return { ok: false, reason: "Alvo não encontrado." };
  if (!target.isAlive) return { ok: false, reason: "Não pode votar em morto." };
  if (voterId === targetId) return { ok: false, reason: "Não pode votar em si mesmo." };

  // Rate limit
  const lastAction = room.lastActionTimes.get(voterId) ?? 0;
  if (Date.now() - lastAction < MIN_ACTION_INTERVAL_MS) {
    return { ok: false, reason: "Ação muito rápida." };
  }

  return { ok: true };
}

export function validateChat(
  room: RoomState,
  playerId: string,
  type: "public" | "private" | "whisper" | "narrator" | "system",
): ValidationResult {
  const player = room._players.get(playerId);
  if (!player) return { ok: false, reason: "Jogador não encontrado." };

  // Flood protection — máx 20 msgs/fase
  const count = room.chatCount[playerId] ?? 0;
  if (count >= 20) return { ok: false, reason: "Limite de mensagens atingido." };

  if (type === "public" && room.phase !== "DAY") {
    return { ok: false, reason: "Chat público só durante o dia." };
  }

  if (type === "private") {
    if (room.phase !== "NIGHT") return { ok: false, reason: "Chat privado só à noite." };
    const killerRoles: PlayerRole[] = ["killer","accomplice","manipulator","silentKiller","corruptCop"];
    if (!killerRoles.includes(player.role)) {
      return { ok: false, reason: "Apenas assassinos podem usar chat privado." };
    }
  }

  return { ok: true };
}

export function validateAbility(
  room: RoomState,
  playerId: string,
): ValidationResult {
  if (room.phase !== "NIGHT") return { ok: false, reason: "Habilidades só à noite." };

  const player = room._players.get(playerId);
  if (!player) return { ok: false, reason: "Jogador não encontrado." };
  if (!player.isAlive) return { ok: false, reason: "Morto não usa habilidade." };

  if (!ABILITY_ROLES.includes(player.role)) {
    return { ok: false, reason: "Seu papel não tem habilidade ativa." };
  }

  if (player.hasUsedAbility) {
    return { ok: false, reason: "Habilidade já usada nesta partida." };
  }

  if (player.abilityCooldown > 0) {
    return { ok: false, reason: `Cooldown: ${player.abilityCooldown} rodada(s) restante(s).` };
  }

  return { ok: true };
}

// Detecta multi-tabs: mesmo nickname em múltiplos sockets
export function detectMultiTab(
  rooms: Map<string, RoomState>,
  nickname: string,
  currentSocketId: string,
): boolean {
  for (const room of rooms.values()) {
    for (const [id, player] of room._players.entries()) {
      if (id !== currentSocketId && player.nickname === nickname && player.isConnected) {
        return true;
      }
    }
  }
  return false;
}

// Decrementa cooldowns ao início de cada rodada
export function tickCooldowns(room: RoomState): void {
  for (const player of room._players.values()) {
    if (player.abilityCooldown > 0) player.abilityCooldown--;
    // Reset hasUsedAbility para roles com cooldown (não one-shot)
    if (player.abilityCooldown === 0 && player.role === "survivor") {
      player.hasUsedAbility = false;
    }
  }
}

export function recordAction(room: RoomState, playerId: string): void {
  room.lastActionTimes.set(playerId, Date.now());
}
