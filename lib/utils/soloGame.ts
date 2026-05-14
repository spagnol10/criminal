// ============================================================
// SOLO GAME ENGINE — Simulação local com bots inteligentes
// ============================================================

import {
  assignRoles, ROLE_NAMES, ROLE_ICONS, ROLE_TEAM, ROLE_DEFS,
  resolveNightActions, resolveVotes, checkWinCondition,
  getRandomEvent, generateEvidence, generateId, shuffleArray,
  MAPS,
} from "./gameEngine";
import type { Player, PlayerRole, NightResult, VoteResult, RandomEvent, Evidence, GameMap } from "../types/game";

export interface BotPlayer extends Player {
  role: PlayerRole;
  isBot: true;
  personality: "aggressive" | "passive" | "random" | "smart";
}

export interface SoloPlayer extends Player {
  role: PlayerRole;
  isBot: false;
}

export type SoloParticipant = BotPlayer | SoloPlayer;

export interface SoloMessage {
  id: string;
  from: string; // "narrator" | "system" | playerId
  nickname: string;
  content: string;
  type: "narrator" | "system" | "public" | "private" | "bot";
  timestamp: number;
}

export interface SoloGameState {
  phase: "setup" | "role_reveal" | "night" | "day" | "voting" | "result" | "finished";
  round: number;
  players: SoloParticipant[];
  myPlayer: SoloPlayer;
  messages: SoloMessage[];
  nightResult: NightResult | null;
  voteResult: VoteResult | null;
  winner: string | null;
  randomEvent: RandomEvent | null;
  evidence: Evidence[];
  map: GameMap;
  pendingAction: boolean; // aguardando ação do jogador humano
  topSuspects: Array<{ id: string; nickname: string; score: number }>;
  suspicionScores: Record<string, number>;
}

// ── Nomes e avatares dos bots ─────────────────────────────────

const BOT_NAMES = [
  "Marcus Vane", "Elara Frost", "Dorian Kell", "Nyx Shade",
  "Silas Thorn", "Vera Cross", "Otto Grimm", "Lyra Sable",
  "Rex Hollow", "Isla Dusk", "Cain Black", "Mira Hunt",
];
const BOT_AVATARS = ["👤","🕵️","👮","🧑‍⚕️","👩‍🔬","🧑‍💼","👩‍💻","🧙","👺","🎭","🦹","🥷"];

const PERSONALITIES: BotPlayer["personality"][] = ["aggressive","passive","random","smart"];

// ── Frases de chat dos bots ───────────────────────────────────

const BOT_CHAT: Record<BotPlayer["personality"], string[]> = {
  aggressive: [
    "Alguém aqui está mentindo descaradamente.",
    "Não confio em quem ficou em silêncio.",
    "Vou votar no mais suspeito agora.",
    "Não vamos deixar o assassino escapar!",
    "Todo mundo com comportamento estranho é suspeito.",
  ],
  passive: [
    "Preciso de mais evidências antes de acusar.",
    "Vamos ouvir todos antes de decidir.",
    "Não sei em quem votar ainda.",
    "Algo não está certo, mas não sei o quê.",
    "Vou seguir a maioria por ora.",
  ],
  random: [
    "Tenho um palpite sobre quem é o culpado.",
    "Esse silêncio é suspeito...",
    "Alguém age de forma muito calculada aqui.",
    "Presta atenção nos votos de cada um.",
  ],
  smart: [
    "Analisando o padrão de votos das rodadas anteriores...",
    "Quem votou contra o investigado inocente é suspeito.",
    "O comportamento no chat revela muito.",
    "Estatisticamente, o mais quieto costuma ser o culpado.",
    "Cruzando os dados da noite com os votos do dia...",
  ],
};

// ── Inicializar partida solo ──────────────────────────────────

export function initSoloGame(
  myNickname: string,
  myAvatar: string,
  botCount = 5,
): SoloGameState {
  const totalPlayers = botCount + 1;
  const roles = assignRoles(totalPlayers);
  const shuffledBotNames = shuffleArray([...BOT_NAMES]).slice(0, botCount);

  // Jogador humano
  const myPlayer: SoloPlayer = {
    id: "player_human",
    nickname: myNickname,
    avatar: myAvatar,
    role: roles[0],
    isAlive: true,
    isHost: true,
    isConnected: true,
    votedFor: null,
    suspicionScore: 0,
    isSpectator: false,
    hasUsedAbility: false,
    abilityCooldown: 0,
    isBot: false,
  };

  // Bots
  const bots: BotPlayer[] = shuffledBotNames.map((name, i) => ({
    id: `bot_${i}`,
    nickname: name,
    avatar: BOT_AVATARS[i % BOT_AVATARS.length],
    role: roles[i + 1],
    isAlive: true,
    isHost: false,
    isConnected: true,
    votedFor: null,
    suspicionScore: 0,
    isSpectator: false,
    hasUsedAbility: false,
    abilityCooldown: 0,
    isBot: true,
    personality: PERSONALITIES[i % PERSONALITIES.length],
  }));

  const players: SoloParticipant[] = [myPlayer, ...bots];
  const mapKeys = Object.keys(MAPS) as Array<keyof typeof MAPS>;
  const map = MAPS[mapKeys[Math.floor(Math.random() * mapKeys.length)]];

  const suspicionScores: Record<string, number> = {};
  players.forEach((p) => { suspicionScores[p.id] = 0; });

  return {
    phase: "role_reveal",
    round: 0,
    players,
    myPlayer,
    messages: [],
    nightResult: null,
    voteResult: null,
    winner: null,
    randomEvent: null,
    evidence: [],
    map,
    pendingAction: false,
    topSuspects: [],
    suspicionScores,
  };
}

// ── Geração de ações dos bots ─────────────────────────────────

export function getBotNightAction(
  bot: BotPlayer,
  players: SoloParticipant[],
): { action: string; targetId: string } | null {
  const role = bot.role;
  const alive = players.filter((p) => p.id !== bot.id && p.isAlive);
  if (alive.length === 0) return null;

  const innocents = alive.filter((p) => ROLE_TEAM[p.role] !== "killers");

  if (role === "killer" || role === "silentKiller") {
    // Prefere matar investigador/médico/hacker se souber, senão aleatório
    const priority = innocents.find((p) => ["investigator","doctor","hacker"].includes(p.role));
    const target = priority ?? innocents[Math.floor(Math.random() * innocents.length)];
    return target ? { action: "kill", targetId: target.id } : null;
  }

  if (role === "doctor") {
    // Salva a si mesmo ou alguém aleatório
    const self = players.find((p) => p.id === bot.id);
    const target = Math.random() < 0.4 && self ? self : alive[Math.floor(Math.random() * alive.length)];
    return { action: "save", targetId: target.id };
  }

  if (role === "investigator") {
    // Investiga um killer se tiver palpite, senão aleatório
    const target = alive[Math.floor(Math.random() * alive.length)];
    return { action: "investigate", targetId: target.id };
  }

  if (role === "hacker") {
    const target = alive[Math.floor(Math.random() * alive.length)];
    return { action: "hack", targetId: target.id };
  }

  if (role === "spy") {
    const target = alive[Math.floor(Math.random() * alive.length)];
    return { action: "spy", targetId: target.id };
  }

  if (role === "corruptCop") {
    const target = innocents[Math.floor(Math.random() * innocents.length)];
    return target ? { action: "corrupt", targetId: target.id } : null;
  }

  return null;
}

export function getBotVote(
  bot: BotPlayer,
  players: SoloParticipant[],
  suspicionScores: Record<string, number>,
): string | null {
  const alive = players.filter((p) => p.id !== bot.id && p.isAlive);
  if (alive.length === 0) return null;

  const isKiller = ROLE_TEAM[bot.role] === "killers";

  if (isKiller) {
    // Killer vota em inocentes com maior suspeita (para confirmar acusação falsa)
    const innocents = alive.filter((p) => ROLE_TEAM[p.role] !== "killers");
    const sorted = innocents.sort((a, b) => (suspicionScores[b.id] ?? 0) - (suspicionScores[a.id] ?? 0));
    return sorted[0]?.id ?? alive[0].id;
  }

  if (bot.personality === "smart") {
    // Vota no mais suspeito
    const sorted = alive.sort((a, b) => (suspicionScores[b.id] ?? 0) - (suspicionScores[a.id] ?? 0));
    return sorted[0]?.id ?? null;
  }

  if (bot.personality === "aggressive") {
    // Vota no jogador humano com certa probabilidade
    const humanAlive = alive.find((p) => !("isBot" in p) || !(p as BotPlayer).isBot);
    if (humanAlive && Math.random() < 0.3) return humanAlive.id;
  }

  // Default: random com peso em suspeita
  const weights = alive.map((p) => Math.max(1, (suspicionScores[p.id] ?? 0) + 10));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < alive.length; i++) {
    r -= weights[i];
    if (r <= 0) return alive[i].id;
  }
  return alive[0].id;
}

// ── Chat dos bots ─────────────────────────────────────────────

export function getBotChatMessages(
  bots: BotPlayer[],
  round: number,
  nightResult: NightResult | null,
): SoloMessage[] {
  const msgs: SoloMessage[] = [];
  const aliveBots = bots.filter((b) => b.isAlive);
  const count = Math.min(aliveBots.length, 2 + Math.floor(Math.random() * 3));

  shuffleArray([...aliveBots]).slice(0, count).forEach((bot) => {
    const lines = BOT_CHAT[bot.personality];
    let content = lines[Math.floor(Math.random() * lines.length)];

    // Bots killers às vezes desviam a atenção
    if (ROLE_TEAM[bot.role] === "killers" && Math.random() < 0.4) {
      const deflects = [
        "Acho que o investigador está errado sobre mim.",
        "Todos estão sendo histéricos. Precisamos de calma.",
        "Não vejo evidências suficientes contra mim.",
      ];
      content = deflects[Math.floor(Math.random() * deflects.length)];
    }

    // Referência à morte
    if (nightResult?.killedNickname && Math.random() < 0.5) {
      content = `A morte de ${nightResult.killedNickname} não pode ser em vão. Vamos descobrir quem fez isso.`;
    }

    msgs.push({
      id: generateId(),
      from: bot.id,
      nickname: bot.nickname,
      content,
      type: "bot",
      timestamp: Date.now() + Math.random() * 1000,
    });
  });

  return msgs;
}

// ── Atualizar suspeita ────────────────────────────────────────

export function updateSuspicionSolo(
  scores: Record<string, number>,
  players: SoloParticipant[],
  votes: Record<string, string>,
): Record<string, number> {
  const updated = { ...scores };

  // Jogadores que não votaram ficam mais suspeitos
  players.filter((p) => p.isAlive).forEach((p) => {
    if (!votes[p.id]) {
      updated[p.id] = Math.min(100, (updated[p.id] ?? 0) + 8);
    }
  });

  // Quem votou no mesmo alvo que a maioria fica menos suspeito
  const tally: Record<string, number> = {};
  Object.values(votes).forEach((t) => { tally[t] = (tally[t] ?? 0) + 1; });
  const maxVotes = Math.max(...Object.values(tally));
  const majorityTarget = Object.entries(tally).find(([, v]) => v === maxVotes)?.[0];

  if (majorityTarget) {
    Object.entries(votes).forEach(([voter, target]) => {
      if (target === majorityTarget) {
        updated[voter] = Math.max(0, (updated[voter] ?? 0) - 5);
      }
    });
  }

  return updated;
}

// ── Mensagem do narrador ──────────────────────────────────────

const NIGHT_MSGS = [
  "🌑 A escuridão engole tudo. O assassino escolhe sua próxima vítima.",
  "🕯️ As velas se apagam. Alguém não dormirá tranquilo esta noite.",
  "🌫️ Névoa densa. Passos suaves. Uma decisão irreversível.",
  "🔪 No silêncio da noite, algo terrível está prestes a acontecer.",
];

const DAY_MSGS_KILL = [
  (name: string) => `💀 O amanhecer trouxe sangue. ${name} foi assassinado(a).`,
  (name: string) => `⚰️ ${name} não verá o fim deste dia. O assassino agiu.`,
  (name: string) => `🩸 O corpo de ${name} foi encontrado. A cidade fica em silêncio.`,
];

const DAY_MSGS_SAFE = [
  "☀️ Ninguém morreu esta noite. Mas o perigo ainda está entre vocês.",
  "🌅 O médico agiu a tempo — uma vida foi salva.",
  "😰 Uma noite tranquila... ou é isso que querem que você acredite.",
];

export function narratorMessage(
  phase: "night" | "day" | "voting" | "result",
  data?: { killedName?: string; eliminatedName?: string; role?: string; wasTie?: boolean }
): string {
  if (phase === "night") return NIGHT_MSGS[Math.floor(Math.random() * NIGHT_MSGS.length)];
  if (phase === "day") {
    if (data?.killedName) {
      const fn = DAY_MSGS_KILL[Math.floor(Math.random() * DAY_MSGS_KILL.length)];
      return fn(data.killedName);
    }
    return DAY_MSGS_SAFE[Math.floor(Math.random() * DAY_MSGS_SAFE.length)];
  }
  if (phase === "voting") return "⚖️ É hora de votar. Quem você acha que é o culpado?";
  if (phase === "result") {
    if (data?.wasTie) return "🤝 Empate! Ninguém foi eliminado. O assassino sorri.";
    if (data?.eliminatedName) return `🔨 ${data.eliminatedName} foi eliminado(a). Era ${data.role ?? "?"}.`;
  }
  return "";
}

// ── Verificar vitória ─────────────────────────────────────────

export { checkWinCondition };
export { resolveNightActions, resolveVotes, getRandomEvent, generateEvidence, ROLE_NAMES, ROLE_ICONS, ROLE_TEAM, ROLE_DEFS };
