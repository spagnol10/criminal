// ============================================================
// AI NARRATOR ENGINE — Narrativa procedural e contextual
// ============================================================

import type { PlayerRole, GamePhase } from "../../lib/game.types";
import type { RoomState } from "./stateManager";
import { getTopSuspects } from "./suspicionEngine";

interface NarratorContext {
  phase: GamePhase;
  round: number;
  killedNickname?: string | null;
  savedNickname?: string | null;
  eliminatedNickname?: string | null;
  eliminatedRole?: PlayerRole | null;
  wasTie?: boolean;
  topSuspects?: Array<{ playerId: string; score: number }>;
  playerNicknames?: Map<string, string>;
  activeEventTitle?: string | null;
}

// ── Templates por fase ────────────────────────────────────────

const TEMPLATES: Record<string, string[]> = {
  NIGHT_OPEN: [
    "🌑 A escuridão engole a cidade. O mal escolhe sua próxima vítima.",
    "🕯️ As velas se apagam. Alguém entre vocês não dormirá tranquilo.",
    "🌫️ A névoa cobre as ruas. Os assassinos se movem em silêncio.",
    "🔪 Em algum corredor escuro, uma decisão foi tomada. Irreversível.",
    "👁️ Olhos que não deviam estar abertos... estão.",
    "🌙 Rodada {round}. A cidade respira com medo.",
  ],

  DAY_NO_KILL: [
    "☀️ Amanheceu. Ninguém foi encontrado morto. Mas o assassino ainda está entre vocês.",
    "🌅 O sol surge. Todos sobreviveram... por enquanto. Alguém foi muito cuidadoso.",
    "😰 Silêncio. Nenhum corpo. Mas a ameaça não foi embora — ela apenas esperou.",
  ],

  DAY_KILL: [
    "💀 {victim} foi encontrado(a) sem vida. O assassino agiu com precisão cirúrgica.",
    "🩸 O amanhecer trouxe sangue. {victim} não verá o fim deste dia.",
    "⚰️ {victim} se foi. A cidade chora — e o culpado sorri.",
    "🔦 Os restos de {victim} contam uma história de traição. Quem sabia?",
  ],

  DAY_SAVED: [
    "🩺 Alguém tentou matar, mas o médico chegou a tempo. A morte recuou — por ora.",
    "💉 Uma vida foi salva esta noite. O assassino falhou. Não falhará de novo.",
  ],

  VOTING_OPEN: [
    "⚖️ É hora de julgar. Escolha errado e o assassino ri.",
    "🗳️ A cidade exige resposta. Mas a verdade... raramente é óbvia.",
    "🎭 Cada voto conta. Cada palavra já foi calculada.",
    "🧠 Quem mentiu? Quem calou? Quem desviou a atenção? Vote com seus instintos.",
  ],

  RESULT_ELIMINATED: [
    "🔨 {victim} foi eliminado(a) pela cidade. Era {role}.",
    "⛓️ A multidão decidiu: {victim} é culpado(a). Era {role}. Valeu a pena?",
    "🪦 {victim} pagou o preço. Era {role}. A cidade acertou... ou errou?",
  ],

  RESULT_TIE: [
    "🤝 Empate. A cidade se dividiu. O verdadeiro culpado sorri.",
    "😤 Ninguém foi eliminado. Empate. O assassino aproveitou a discórdia.",
  ],

  SUSPECTS_HIGHLIGHT: [
    "👁️ Os mais suspeitos desta rodada: {suspects}. Olhem com cuidado.",
    "🔍 Comportamento suspeito detectado em: {suspects}.",
    "📊 A análise comportamental aponta para {suspects}. Mas dados mentem também.",
  ],

  EVENT_INTRO: [
    "⚡ ATENÇÃO: {event} — a dinâmica da partida acabou de mudar.",
    "🌪️ Evento inesperado: {event}. Nada é como parecia.",
  ],

  CHAOS_HIGH: [
    "🌀 O caos tomou conta. Ninguém confia em ninguém. É exatamente o que o assassino queria.",
    "😱 A paranoia está no máximo. Em partidas como essa, o inocente é sempre o mais suspeito.",
  ],
};

function pick(key: string): string {
  const arr = TEMPLATES[key] ?? ["..."];
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// ── Gerador principal ─────────────────────────────────────────

export function generateNarration(ctx: NarratorContext): string[] {
  const lines: string[] = [];

  switch (ctx.phase) {
    case "NIGHT":
      lines.push(fill(pick("NIGHT_OPEN"), { round: String(ctx.round) }));
      break;

    case "DAY":
      if (ctx.killedNickname) {
        lines.push(fill(pick("DAY_KILL"), { victim: ctx.killedNickname }));
      } else if (ctx.savedNickname) {
        lines.push(pick("DAY_SAVED"));
      } else {
        lines.push(pick("DAY_NO_KILL"));
      }
      if (ctx.activeEventTitle) {
        lines.push(fill(pick("EVENT_INTRO"), { event: ctx.activeEventTitle }));
      }
      if (ctx.topSuspects && ctx.topSuspects.length > 0 && ctx.playerNicknames) {
        const names = ctx.topSuspects
          .slice(0, 2)
          .map((s) => ctx.playerNicknames!.get(s.playerId) ?? "?")
          .join(", ");
        if (names) lines.push(fill(pick("SUSPECTS_HIGHLIGHT"), { suspects: names }));
      }
      break;

    case "VOTING":
      lines.push(pick("VOTING_OPEN"));
      break;

    case "RESULT":
      if (ctx.wasTie) {
        lines.push(pick("RESULT_TIE"));
      } else if (ctx.eliminatedNickname) {
        const roleName = ctx.eliminatedRole ? ROLE_PT[ctx.eliminatedRole] ?? ctx.eliminatedRole : "?";
        lines.push(fill(pick("RESULT_ELIMINATED"), { victim: ctx.eliminatedNickname, role: roleName }));
      }
      break;
  }

  // Rodadas de alto caos (muitos suspeitos com score > 60)
  if (ctx.topSuspects && ctx.topSuspects.filter((s) => s.score > 60).length >= 3) {
    lines.push(pick("CHAOS_HIGH"));
  }

  return lines;
}

export function buildNarratorContext(room: RoomState, phase: GamePhase, extra: Partial<NarratorContext> = {}): NarratorContext {
  const nicknames = new Map<string, string>();
  for (const [id, p] of room._players.entries()) nicknames.set(id, p.nickname);

  return {
    phase,
    round: room.round,
    topSuspects: getTopSuspects(room, 2),
    playerNicknames: nicknames,
    ...extra,
  };
}

// Mapeamento role → português
const ROLE_PT: Partial<Record<PlayerRole, string>> = {
  citizen: "Cidadão", doctor: "Médico", investigator: "Investigador",
  killer: "Assassino", accomplice: "Cúmplice", informant: "Informante",
  hacker: "Hacker", manipulator: "Manipulador", ghost: "Fantasma",
  silentKiller: "Assassino Silencioso", corruptCop: "Policial Corrupto",
  survivor: "Sobrevivente", traitor: "Traidor", spy: "Espião",
};
