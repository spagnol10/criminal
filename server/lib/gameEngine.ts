// ============================================================
// GAME ENGINE — Lógica central do jogo
// ============================================================

import type {
  Player,
  PlayerRole,
  GamePhase,
  NightAction,
  NightResult,
  VoteResult,
  TeamWinner,
  RandomEvent,
} from "./game.types";

export const ROLE_NAMES: Record<PlayerRole, string> = {
  citizen: "Cidadão",
  doctor: "Médico",
  investigator: "Investigador",
  killer: "Assassino",
  accomplice: "Cúmplice",
};

export const ROLE_DESCRIPTIONS: Record<PlayerRole, string> = {
  citizen: "Você é um cidadão inocente. Sobreviva e ajude a encontrar o assassino.",
  doctor: "Você pode salvar uma pessoa por noite. Escolha com sabedoria.",
  investigator: "Você pode investigar um jogador por noite e descobrir se é culpado.",
  killer: "Você deve eliminar os inocentes sem ser descoberto.",
  accomplice: "Você apoia o assassino. Saiba quem ele é.",
};

export const ROLE_TEAM: Record<PlayerRole, "innocents" | "killers"> = {
  citizen: "innocents",
  doctor: "innocents",
  investigator: "innocents",
  killer: "killers",
  accomplice: "killers",
};

export const ROLE_ICONS: Record<PlayerRole, string> = {
  citizen: "👤",
  doctor: "🩺",
  investigator: "🔍",
  killer: "🔪",
  accomplice: "🕵️",
};

export const PHASE_NAMES: Record<GamePhase, string> = {
  WAITING: "Aguardando",
  STARTING: "Iniciando",
  NIGHT: "Noite",
  DAY: "Dia",
  VOTING: "Votação",
  RESULT: "Resultado",
  FINISHED: "Fim de Jogo",
};

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  WAITING: 0,
  STARTING: 5,
  NIGHT: 45,
  DAY: 60,
  VOTING: 30,
  RESULT: 10,
  FINISHED: 0,
};

// ---- Distribuição de Papéis ----
export function assignRoles(playerCount: number): PlayerRole[] {
  const roles: PlayerRole[] = [];
  const killerCount = playerCount >= 8 ? 2 : 1;
  const accompliceCount = playerCount >= 10 ? 1 : 0;
  const investigatorCount = playerCount >= 6 ? 1 : 0;
  const doctorCount = 1;
  const citizenCount =
    playerCount - killerCount - accompliceCount - investigatorCount - doctorCount;

  for (let i = 0; i < killerCount; i++) roles.push("killer");
  for (let i = 0; i < accompliceCount; i++) roles.push("accomplice");
  for (let i = 0; i < investigatorCount; i++) roles.push("investigator");
  for (let i = 0; i < doctorCount; i++) roles.push("doctor");
  for (let i = 0; i < Math.max(0, citizenCount); i++) roles.push("citizen");

  return shuffleArray(roles);
}

// ---- Ações Noturnas ----
export function resolveNightActions(
  players: Player[],
  actions: NightAction[]
): NightResult {
  const killAction = actions.find((a) => a.action === "kill");
  const saveAction = actions.find((a) => a.action === "save");
  const investigateAction = actions.find((a) => a.action === "investigate");

  let killedId: string | null = null;
  let killedNickname: string | null = null;
  let savedId: string | null = null;
  let investigationResult: NightResult["investigationResult"];

  if (killAction) {
    const saved = saveAction?.targetId === killAction.targetId;
    if (!saved) {
      const victim = players.find((p) => p.id === killAction.targetId);
      if (victim) {
        killedId = victim.id;
        killedNickname = victim.nickname;
      }
    } else {
      savedId = saveAction?.targetId ?? null;
    }
  }

  if (investigateAction) {
    const target = players.find((p) => p.id === investigateAction.targetId);
    if (target && target.role) {
      investigationResult = {
        targetNickname: target.nickname,
        isKiller: ROLE_TEAM[target.role] === "killers",
      };
    }
  }

  return { killedId, killedNickname, savedId, investigationResult };
}

// ---- Apuração de Votos ----
export function resolveVotes(
  players: Player[],
  votes: Record<string, string>
): VoteResult {
  const tallies: Record<string, number> = {};

  for (const targetId of Object.values(votes)) {
    tallies[targetId] = (tallies[targetId] ?? 0) + 1;
  }

  let eliminatedId: string | null = null;
  let eliminatedNickname: string | null = null;
  let maxVotes = 0;

  for (const [id, count] of Object.entries(tallies)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = id;
    }
  }

  // Empate → ninguém eliminado
  const topCount = Object.values(tallies).filter((c) => c === maxVotes).length;
  if (topCount > 1) {
    eliminatedId = null;
  }

  if (eliminatedId) {
    const p = players.find((p) => p.id === eliminatedId);
    eliminatedNickname = p?.nickname ?? null;
  }

  return { eliminatedId, eliminatedNickname, votes, tallies };
}

// ---- Verificar Vitória ----
export function checkWinCondition(players: Player[]): TeamWinner {
  const alive = players.filter((p) => p.isAlive);
  const aliveKillers = alive.filter(
    (p) => p.role && ROLE_TEAM[p.role] === "killers"
  );
  const aliveInnocents = alive.filter(
    (p) => p.role && ROLE_TEAM[p.role] === "innocents"
  );

  if (aliveKillers.length === 0) return "innocents";
  if (aliveKillers.length >= aliveInnocents.length) return "killers";
  return null;
}

// ---- Eventos Aleatórios ----
const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: "blackout",
    title: "⚡ Apagão",
    description: "As luzes da cidade se apagaram. O assassino fica mais difícil de rastrear esta noite.",
    type: "blackout",
  },
  {
    id: "false_clue",
    title: "🎭 Pista Falsa",
    description: "Uma pista anônima aponta para alguém inocente. Cuidado com quem acusar.",
    type: "false_clue",
  },
  {
    id: "witness",
    title: "👁️ Testemunha",
    description: "Alguém viu algo suspeito na noite passada. Ouça com atenção.",
    type: "witness",
  },
  {
    id: "anonymous_tip",
    title: "📝 Denúncia Anônima",
    description: "Uma carta foi deixada na praça. Ela menciona um nome… mas será verdade?",
    type: "anonymous_tip",
  },
];

export function getRandomEvent(): RandomEvent | null {
  if (Math.random() > 0.4) return null; // 40% de chance
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}

// ---- Frases do Narrador ----
export function getNarratorMessage(
  phase: GamePhase,
  result?: NightResult | VoteResult
): string {
  if (phase === "NIGHT") {
    return "🌙 A cidade adormece… mas o mal não descansa. As sombras se movem pelas ruas vazias.";
  }
  if (phase === "DAY") {
    const nightRes = result as NightResult | undefined;
    if (nightRes?.killedId) {
      return `☀️ O amanhecer revela o horror: ${nightRes.killedNickname} foi encontrado(a) morto(a). A cidade entra em pânico.`;
    }
    return "☀️ O amanhecer chegou sem vítimas. O médico salvou alguém esta noite. A tensão aumenta…";
  }
  if (phase === "VOTING") {
    return "⚖️ É hora de julgar. Discutam, argumentem e votem. A cidade exige justiça.";
  }
  if (phase === "RESULT") {
    const voteRes = result as VoteResult | undefined;
    if (voteRes?.eliminatedId) {
      return `🔨 A votação decidiu: ${voteRes.eliminatedNickname} foi eliminado(a) pela cidade.`;
    }
    return "🤝 Empate. A cidade não chegou a um consenso. O suspeito escapa por hoje.";
  }
  return "";
}

// ---- Utils ----
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}
