// ============================================================
// GAME ENGINE v2 — Criminal Investigation
// ============================================================
import type {
  Player, PlayerRole, GamePhase, NightAction, NightResult,
  VoteResult, TeamWinner, RandomEvent, GameMap,
  MapId, Evidence, SuspicionProfile, MatchEvent, PostGameStats,
} from "./game.types";

// ── Role metadata ────────────────────────────────────────────

export const ROLE_NAMES: Record<PlayerRole, string> = {
  citizen:      "Cidadão",
  doctor:       "Médico",
  investigator: "Investigador",
  killer:       "Assassino",
  accomplice:   "Cúmplice",
  informant:    "Informante",
  hacker:       "Hacker",
  manipulator:  "Manipulador",
  ghost:        "Fantasma",
  silentKiller: "Assassino Silencioso",
  corruptCop:   "Policial Corrupto",
  survivor:     "Sobrevivente",
  traitor:      "Traidor",
  spy:          "Espião",
};

export const ROLE_ICONS: Record<PlayerRole, string> = {
  citizen:      "👤",
  doctor:       "🩺",
  investigator: "🔍",
  killer:       "🔪",
  accomplice:   "��️",
  informant:    "📡",
  hacker:       "💻",
  manipulator:  "🎭",
  ghost:        "👻",
  silentKiller: "🥷",
  corruptCop:   "🚔",
  survivor:     "🛡️",
  traitor:      "🎴",
  spy:          "��",
};

export const ROLE_TEAM: Record<PlayerRole, "innocents" | "killers" | "neutral"> = {
  citizen:      "innocents",
  doctor:       "innocents",
  investigator: "innocents",
  informant:    "innocents",
  hacker:       "innocents",
  spy:          "innocents",
  killer:       "killers",
  accomplice:   "killers",
  manipulator:  "killers",
  silentKiller: "killers",
  corruptCop:   "killers",
  ghost:        "neutral",
  survivor:     "neutral",
  traitor:      "neutral",
};

export interface RoleDefinition {
  name: string;
  icon: string;
  team: "innocents" | "killers" | "neutral";
  description: string;
  objective: string;
  ability: string;
  abilityName: string;
  cooldown: number;   // rodadas entre usos
  advantage: string;
  disadvantage: string;
  tip: string;
}

export const ROLE_DEFS: Record<PlayerRole, RoleDefinition> = {
  citizen: {
    name: "Cidadão", icon: "👤", team: "innocents",
    description: "Um morador comum tentando sobreviver.",
    objective: "Sobreviva e ajude a identificar os assassinos.",
    ability: "Nenhuma habilidade especial.",
    abilityName: "—",
    cooldown: 0,
    advantage: "Voto conta duplo em empates (desempate de inocentes).",
    disadvantage: "Sem informação extra — depende 100% da discussão.",
    tip: "Observe comportamentos e padrões de voto. Fale muito.",
  },
  doctor: {
    name: "Médico", icon: "🩺", team: "innocents",
    description: "Pode salvar uma vida por noite.",
    objective: "Proteja inocentes e elimine os assassinos.",
    ability: "Escolhe um jogador para proteger. Se for o alvo dos assassinos, sobrevive.",
    abilityName: "Cura Noturna",
    cooldown: 0,
    advantage: "Pode se salvar uma vez na partida.",
    disadvantage: "Se proteger o alvo errado, a morte acontece normalmente.",
    tip: "Tente salvar jogadores que parecem alvos óbvios ou investigadores.",
  },
  investigator: {
    name: "Investigador", icon: "🔍", team: "innocents",
    description: "Analisa suspeitos e descobre segredos.",
    objective: "Identifique e elimine os assassinos via votação.",
    ability: "Investiga um jogador por noite. Descobre se é culpado ou inocente.",
    abilityName: "Investigação",
    cooldown: 0,
    advantage: "Vê o time real do investigado (killer/innocents).",
    disadvantage: "Se investigar o Traidor, resultado pode ser falso.",
    tip: "Investigue os mais quietos e os que acusam sem evidências.",
  },
  informant: {
    name: "Informante", icon: "📡", team: "innocents",
    description: "Insider que pode se infiltrar nos assassinos.",
    objective: "Descobrir a identidade do assassino e vazar ao time inocente.",
    ability: "Uma vez por partida: descobre o nome de um assassino aleatório.",
    abilityName: "Infiltração",
    cooldown: 99,
    advantage: "Obtém um nome garantido do time killer.",
    disadvantage: "Se revelar sua identidade, vira alvo principal dos assassinos.",
    tip: "Use sua informação sutilmente no chat. Não revele como sabe.",
  },
  hacker: {
    name: "Hacker", icon: "💻", team: "innocents",
    description: "Especialista digital que expõe o papel de suspeitos.",
    objective: "Hackear jogadores e expor seus papéis para você.",
    ability: "Hackeie um jogador por noite. Vê o papel real dele.",
    abilityName: "Hack",
    cooldown: 1,
    advantage: "Vê o papel EXATO, não apenas time (killer vs inocente).",
    disadvantage: "Se hackear o Policial Corrupto, ele sabe e te ataca.",
    tip: "Hackeie os mais quietos primeiro. Guarde info pra votação.",
  },
  spy: {
    name: "Espião", icon: "🔭", team: "innocents",
    description: "Observa e monitora ações dos suspeitos.",
    objective: "Coletar evidências de comportamento suspeito.",
    ability: "Espia um jogador: vê se ele agiu à noite (mas não o que fez).",
    abilityName: "Vigilância",
    cooldown: 0,
    advantage: "Detecta se Assassino Silencioso agiu (pois ele não deixa rastro).",
    disadvantage: "Não vê O QUE a pessoa fez, apenas SE fez algo.",
    tip: "Combine vigilância com os dados do investigador.",
  },
  killer: {
    name: "Assassino", icon: "🔪", team: "killers",
    description: "O predador central. Domina a escuridão.",
    objective: "Eliminar todos os inocentes ou alcançar maioria.",
    ability: "Mata um jogador por noite.",
    abilityName: "Assassinato",
    cooldown: 0,
    advantage: "Sabe quem é o Cúmplice desde o início.",
    disadvantage: "O Investigador pode te descobrir. O Hacker também.",
    tip: "Mate investigadores e médicos prioritariamente.",
  },
  accomplice: {
    name: "Cúmplice", icon: "🕵️", team: "killers",
    description: "Aliado fiel do assassino.",
    objective: "Ajudar o assassino a vencer sem ser descoberto.",
    ability: "Pode votar para proteger o assassino (voto de distração).",
    abilityName: "Desvio de Atenção",
    cooldown: 2,
    advantage: "Conhece a identidade do assassino.",
    disadvantage: "Se o assassino morrer, você perde automaticamente.",
    tip: "Seja o mais suspeito possível para desviar atenção do assassino.",
  },
  manipulator: {
    name: "Manipulador", icon: "🎭", team: "killers",
    description: "Mestre da ilusão e da mentira social.",
    objective: "Plantar pistas falsas e eliminar inocentes por engano.",
    ability: "Uma vez por partida: força um inocente a votar em outro inocente.",
    abilityName: "Manipulação Mental",
    cooldown: 3,
    advantage: "Pode criar falsas evidências no chat sem custo.",
    disadvantage: "Se dois investigadores trabalharem juntos, é desmascarado.",
    tip: "Mude o alvo das acusações sutilmente. Nunca seja o primeiro a acusar.",
  },
  silentKiller: {
    name: "Assassino Silencioso", icon: "🥷", team: "killers",
    description: "Age nas sombras. Invisível. Letal.",
    objective: "Matar sem deixar rastros detectáveis.",
    ability: "Mata sem deixar evidências. Espião não detecta sua ação.",
    abilityName: "Golpe Silencioso",
    cooldown: 0,
    advantage: "Invisível para Espião. Evidências apontam para outros.",
    disadvantage: "Hacker ainda vê seu papel. Investigador descobre seu time.",
    tip: "Mate aleatoriamente para não criar padrões detectáveis.",
  },
  corruptCop: {
    name: "Policial Corrupto", icon: "🚔", team: "killers",
    description: "Usa autoridade para proteger os assassinos.",
    objective: "Bloquear investigações e proteger o time killer.",
    ability: "Bloqueia a ação noturna de um inocente por rodada.",
    abilityName: "Corrupção",
    cooldown: 1,
    advantage: "Parece legítimo — jogadores assumem que policiais são inocentes.",
    disadvantage: "Se bloqueou o Médico e alguém morreu, gera suspeita imediata.",
    tip: "Bloqueie investigadores prioritariamente.",
  },
  ghost: {
    name: "Fantasma", icon: "��", team: "neutral",
    description: "Já morreu uma vez. Voltou para se vingar.",
    objective: "Se vivo no final, vence independente de qual time ganhou.",
    ability: "Ao ser eliminado na votação, revive com 50% de chance.",
    abilityName: "Ressurreição",
    cooldown: 99,
    advantage: "Pode sobreviver a uma eliminação por sorte.",
    disadvantage: "Sem time fixo — todos o temem e votam nele.",
    tip: "Fique quieto. Não revele sua habilidade. Deixe os outros se destruírem.",
  },
  survivor: {
    name: "Sobrevivente", icon: "🛡️", team: "neutral",
    description: "Adaptável. Vence se sobreviver até o fim.",
    objective: "Estar vivo quando a partida acabar, independente do time vencedor.",
    ability: "Uma vez por noite: coloca escudo — fica imune a ataques.",
    abilityName: "Escudo",
    cooldown: 2,
    advantage: "Pode se proteger de ataques noturnos.",
    disadvantage: "Votações públicas ainda podem eliminar. Sem aliados fixos.",
    tip: "Vote sempre no jogador mais suspeito para parecer alinhado com a maioria.",
  },
  traitor: {
    name: "Traidor", icon: "��", team: "neutral",
    description: "Parece inocente. Age como inimigo. Pertence a ninguém.",
    objective: "Vence se for votado e eliminado (isso é sua vitória!).",
    ability: "Investigador que o investiga recebe resultado FALSO (aparece como inocente).",
    abilityName: "Ilusão",
    cooldown: 0,
    advantage: "Se for eliminado por votação, VENCE — objetivo único.",
    disadvantage: "Se morrer à noite, perde. Precisa ser votado, não assassinado.",
    tip: "Seja suspeito o suficiente para ser votado, mas não suspeito demais para ser matado.",
  },
};

// ── Fase names & durations ────────────────────────────────────

export const PHASE_NAMES: Record<GamePhase, string> = {
  WAITING:  "Aguardando",
  STARTING: "Iniciando",
  NIGHT:    "Noite",
  DAY:      "Dia",
  VOTING:   "Votação",
  RESULT:   "Resultado",
  FINISHED: "Fim de Jogo",
};

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  WAITING:  0,
  STARTING: 8,
  NIGHT:    50,
  DAY:      90,
  VOTING:   35,
  RESULT:   12,
  FINISHED: 0,
};

// ── Mapas ─────────────────────────────────────────────────────

export const MAPS: Record<MapId, GameMap> = {
  mansion: {
    id: "mansion", name: "Mansão Abandonada", emoji: "🏚️",
    atmosphere: "Uma mansão vitoriana isolada no campo. Cada corredor esconde um segredo.",
    rooms: [
      { id: "hall", name: "Salão Principal", emoji: "🎪", description: "Ponto de encontro central", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
      { id: "library", name: "Biblioteca", emoji: "📚", description: "Cheia de livros antigos e passagens secretas", isRestricted: false, hasSabotagePoint: true, hasCamera: false },
      { id: "cellar", name: "Adega", emoji: "🍷", description: "Escuro. Úmido. Perfeito para desaparecer.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "garden", name: "Jardim", emoji: "🌿", description: "Névoa densa. Difícil de ver além de 3 metros.", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "attic", name: "Sótão", emoji: "🦇", description: "Área restrita. Encontrado somente por quem conhece.", isRestricted: true, hasSabotagePoint: false, hasCamera: false },
    ],
  },
  hospital: {
    id: "hospital", name: "Hospital Psiquiátrico", emoji: "🏥",
    atmosphere: "Corredores brancos e silenciosos. O cheiro de desinfetante não esconde o medo.",
    rooms: [
      { id: "reception", name: "Recepção", emoji: "🛎️", description: "Entrada principal monitorada", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "ward", name: "Enfermaria", emoji: "🛏️", description: "Leitos vazios. Histórias apagadas.", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "morgue", name: "Necrotério", emoji: "🧟", description: "Área restrita. Acesso proibido.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "pharmacy", name: "Farmácia", emoji: "💊", description: "Drogas que curam... ou matam.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "rooftop", name: "Terraço", emoji: "🌙", description: "Fuga ou armadilha?", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
    ],
  },
  hotel: {
    id: "hotel", name: "Hotel Noir", emoji: "🏨",
    atmosphere: "Luxo decadente. Cada hóspede tem um segredo. Ninguém é quem parece.",
    rooms: [
      { id: "lobby", name: "Lobby", emoji: "🛋️", description: "O coração do hotel", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "bar", name: "Bar", emoji: "🍸", description: "Conversas perigosas ao som de jazz", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
      { id: "penthouse", name: "Cobertura", emoji: "🌆", description: "Acesso exclusivo — VIP", isRestricted: true, hasSabotagePoint: false, hasCamera: true },
      { id: "basement", name: "Subsolo", emoji: "🔧", description: "Gerador. Câmeras. Arquivo secreto.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "corridor", name: "Corredor 13", emoji: "🚪", description: "O quarto 13 nunca existiu no elevador.", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
    ],
  },
  police: {
    id: "police", name: "Delegacia", emoji: "🚔",
    atmosphere: "Paredes finas. Alguém sempre está ouvindo. Confie apenas em você.",
    rooms: [
      { id: "frontdesk", name: "Balcão", emoji: "📋", description: "Tudo é registrado aqui", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "interrogation", name: "Sala de Interrogatório", emoji: "💡", description: "A luz nunca apaga. A pressão aumenta.", isRestricted: true, hasSabotagePoint: false, hasCamera: true },
      { id: "archive", name: "Arquivo", emoji: "🗂️", description: "Casos encerrados. Ou encobertos.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "cells", name: "Celas", emoji: "⛓️", description: "Para quem sabe demais.", isRestricted: true, hasSabotagePoint: false, hasCamera: true },
      { id: "garage", name: "Garagem", emoji: "🚗", description: "Saída de emergência ou entrada clandestina?", isRestricted: false, hasSabotagePoint: true, hasCamera: false },
    ],
  },
  train: {
    id: "train", name: "Trem Noturno", emoji: "🚂",
    atmosphere: "Sem parada. Sem saída. O assassino está em algum vagão.",
    rooms: [
      { id: "wagon1", name: "Vagão de Passageiros", emoji: "💺", description: "Lotado. Impossível saber quem está atrás de você.", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
      { id: "dining", name: "Vagão Restaurante", emoji: "🍽️", description: "Todos juntos. Todos suspeitos.", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
      { id: "cargo", name: "Vagão de Carga", emoji: "📦", description: "Escuro. Cheio de esconderijos.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "engine", name: "Cabine do Maquinista", emoji: "🔧", description: "Controle total do trem — e do destino.", isRestricted: true, hasSabotagePoint: true, hasCamera: true },
      { id: "roof", name: "Teto do Trem", emoji: "🌪️", description: "Perigoso. Vento. Ninguém vai procurar aqui.", isRestricted: true, hasSabotagePoint: false, hasCamera: false },
    ],
  },
  lab: {
    id: "lab", name: "Laboratório Secreto", emoji: "🧪",
    atmosphere: "Experimentos proibidos. Identidades falsas. A verdade foi alterada geneticamente.",
    rooms: [
      { id: "mainlab", name: "Laboratório Central", emoji: "🔬", description: "Equipamentos de última geração monitorados", isRestricted: false, hasSabotagePoint: false, hasCamera: true },
      { id: "coldroom", name: "Câmara Fria", emoji: "🧊", description: "Temperatura: -20°C. Acesso restrito.", isRestricted: true, hasSabotagePoint: true, hasCamera: false },
      { id: "server", name: "Sala dos Servidores", emoji: "💾", description: "Dados sensíveis. Vulnerável a hacking.", isRestricted: true, hasSabotagePoint: true, hasCamera: true },
      { id: "quarantine", name: "Quarentena", emoji: "☣️", description: "Isolamento total. Sem comunicação.", isRestricted: true, hasSabotagePoint: false, hasCamera: true },
      { id: "exit", name: "Saída de Emergência", emoji: "🚨", description: "Alarme conectado. Uma chance de fuga.", isRestricted: false, hasSabotagePoint: false, hasCamera: false },
    ],
  },
};

export function getRandomMap(): GameMap {
  const ids = Object.keys(MAPS) as MapId[];
  return MAPS[ids[Math.floor(Math.random() * ids.length)]];
}

// ── Distribuição de Papéis ────────────────────────────────────

export function assignRoles(playerCount: number): PlayerRole[] {
  const roles: PlayerRole[] = [];

  // Assassinos base
  const killerCount = playerCount >= 9 ? 2 : 1;
  for (let i = 0; i < killerCount; i++) roles.push("killer");

  // Papéis killer especiais (1 cada, em jogos grandes)
  if (playerCount >= 7)  roles.push("manipulator");
  if (playerCount >= 10) roles.push("silentKiller");
  if (playerCount >= 12) roles.push("corruptCop");
  if (playerCount >= 8)  roles.push("accomplice");

  // Papéis neutros
  if (playerCount >= 6)  roles.push("survivor");
  if (playerCount >= 8)  roles.push("ghost");
  if (playerCount >= 10) roles.push("traitor");

  // Papéis inocentes especiais
  roles.push("doctor");
  if (playerCount >= 5)  roles.push("investigator");
  if (playerCount >= 7)  roles.push("spy");
  if (playerCount >= 8)  roles.push("hacker");
  if (playerCount >= 10) roles.push("informant");

  // Cidadãos para completar
  const citizenCount = playerCount - roles.length;
  for (let i = 0; i < Math.max(0, citizenCount); i++) roles.push("citizen");

  return shuffleArray(roles).slice(0, playerCount);
}

// ── Ações Noturnas ────────────────────────────────────────────

export function resolveNightActions(
  players: Player[],
  actions: NightAction[],
  activeEvents: string[] = []
): NightResult {
  const killAction  = actions.find((a) => a.action === "kill");
  const saveAction  = actions.find((a) => a.action === "save");
  const invAction   = actions.find((a) => a.action === "investigate");
  const hackAction  = actions.find((a) => a.action === "hack");
  const blockAction = actions.find((a) => a.action === "corrupt");
  const spyAction   = actions.find((a) => a.action === "spy");

  let killedId: string | null = null;
  let killedNickname: string | null = null;
  let savedId: string | null = null;
  let blockedId: string | null = null;
  let hackedId: string | null = null;
  let investigationResult: NightResult["investigationResult"];
  let spyResult: NightResult["spyResult"];

  // Bloqueio do Policial Corrupto
  if (blockAction) blockedId = blockAction.targetId;

  // Kill — bloqueado se a vítima tem escudo (survivor ability) ou foi salva
  if (killAction) {
    const isDoubleKill = activeEvents.includes("double_kill");
    const victim = players.find((p) => p.id === killAction.targetId);
    const wasSaved = saveAction?.targetId === killAction.targetId;
    const isBlocked = blockedId === killAction.playerId;
    const hasShield = victim?.hasUsedAbility && victim.role === "survivor";

    if (victim && !wasSaved && !isBlocked && !hasShield) {
      killedId = victim.id;
      killedNickname = victim.nickname;
    } else if (wasSaved) {
      savedId = saveAction?.targetId ?? null;
    }

    // Double kill event
    if (isDoubleKill && killedId) {
      const alivePlayers = players.filter((p) => p.isAlive && p.id !== killedId);
      const randomVictim = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      if (randomVictim) {
        killedNickname = `${killedNickname} e ${randomVictim.nickname}`;
      }
    }
  }

  // Investigação — Traidor aparece como inocente
  if (invAction) {
    const target = players.find((p) => p.id === invAction.targetId);
    if (target?.role) {
      const isFakeResult = target.role === "traitor";
      investigationResult = {
        targetNickname: target.nickname,
        isKiller: isFakeResult ? false : ROLE_TEAM[target.role] === "killers",
        role: target.role,
      };
    }
  }

  // Hack — Policial Corrupto detecta e bloqueia de volta
  if (hackAction) {
    const target = players.find((p) => p.id === hackAction.targetId);
    if (target?.role) {
      hackedId = target.id;
      if (target.role === "corruptCop") {
        blockedId = hackAction.playerId; // Hacker é bloqueado
      }
    }
  }

  // Espionagem
  if (spyAction) {
    const target = players.find((p) => p.id === spyAction.targetId);
    const actedAtNight = actions.some((a) => a.playerId === spyAction.targetId);
    const isSilentKiller = target?.role === "silentKiller";
    spyResult = {
      targetNickname: target?.nickname ?? "?",
      wasOnline: actedAtNight && !isSilentKiller, // silentKiller invisível ao spy
      lastAction: actedAtNight ? "Agiu durante a noite" : "Ficou quieto",
    };
  }

  const narratorComment = generateNightNarrator(killedNickname, savedId !== null);

  return { killedId, killedNickname, savedId, blockedId, hackedId, investigationResult, spyResult, narratorComment };
}

// ── Apuração de Votos ─────────────────────────────────────────

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
  let eliminatedRole: PlayerRole | null = null;
  let maxVotes = 0;

  for (const [id, count] of Object.entries(tallies)) {
    if (count > maxVotes) { maxVotes = count; eliminatedId = id; }
  }

  const topCount = Object.values(tallies).filter((c) => c === maxVotes).length;
  const wasTie = topCount > 1;
  if (wasTie) eliminatedId = null;

  if (eliminatedId) {
    const p = players.find((pl) => pl.id === eliminatedId);
    eliminatedNickname = p?.nickname ?? null;
    eliminatedRole = (p?.role as PlayerRole) ?? null;
  }

  return { eliminatedId, eliminatedNickname, eliminatedRole, votes, tallies, wasTie };
}

// ── Verificar Vitória ─────────────────────────────────────────

export function checkWinCondition(players: Player[]): TeamWinner {
  const alive = players.filter((p) => p.isAlive && !p.isSpectator);
  const killers   = alive.filter((p) => p.role && ROLE_TEAM[p.role] === "killers");
  const innocents = alive.filter((p) => p.role && ROLE_TEAM[p.role] === "innocents");
  const neutrals  = alive.filter((p) => p.role && ROLE_TEAM[p.role] === "neutral");

  // Ghoste e Survivor neutros — verificar vitória individual no final
  if (killers.length === 0 && innocents.length === 0) {
    return neutrals.length > 0 ? "neutral" : "innocents";
  }
  if (killers.length === 0) return "innocents";
  if (killers.length >= innocents.length) return "killers";
  return null;
}

// ── Motor de Suspeita ─────────────────────────────────────────

export function updateSuspicion(
  profiles: Map<string, number>,
  event: { type: "vote" | "accusation" | "lie_detected" | "silent" | "early_accuser"; playerId: string; weight: number }
): void {
  const current = profiles.get(event.playerId) ?? 0;
  const weights = { vote: 5, accusation: 8, lie_detected: 25, silent: -3, early_accuser: 10 };
  const delta = weights[event.type] ?? event.weight;
  profiles.set(event.playerId, Math.min(100, Math.max(0, current + delta)));
}

export function buildSuspicionProfiles(
  players: Player[],
  voteHistory: Record<string, string[]>,
  chatCount: Record<string, number>
): SuspicionProfile[] {
  return players.map((p) => {
    const votes = voteHistory[p.id] ?? [];
    const msgs  = chatCount[p.id] ?? 0;
    const score = Math.min(100, votes.length * 8 + (msgs < 2 ? 15 : 0));
    const flags: string[] = [];
    if (votes.length > 3) flags.push("Vota muito");
    if (msgs < 2) flags.push("Suspeita silenciosa");
    if (msgs > 15) flags.push("Fala demais");
    const behaviorTags = msgs < 3 ? ["quieto"] : msgs > 12 ? ["agressivo", "vocal"] : ["normal"];
    return { playerId: p.id, score, flags, voteHistory: votes, behaviorTags };
  });
}

// ── Evidências Procedurais ────────────────────────────────────

export function generateEvidence(
  players: Player[],
  killedId: string | null,
  round: number
): Evidence[] {
  const evidence: Evidence[] = [];
  if (!killedId) return evidence;

  const killer = players.find((p) => p.role && ["killer","silentKiller","manipulator"].includes(p.role));
  const isSilent = killer?.role === "silentKiller";

  const types: Evidence["type"][] = ["footprint", "fingerprint", "bloodstain", "testimony"];

  types.forEach((type, i) => {
    const isFake = isSilent || Math.random() < 0.3;
    const decoy  = players.filter((p) => p.id !== killer?.id && p.isAlive);
    const pointsTo = isFake
      ? (decoy[Math.floor(Math.random() * decoy.length)]?.id ?? null)
      : (killer?.id ?? null);

    evidence.push({
      id: `ev_${round}_${i}`,
      type,
      description: EVIDENCE_DESCRIPTIONS[type][Math.floor(Math.random() * EVIDENCE_DESCRIPTIONS[type].length)],
      pointsTo,
      isFake,
      discoveredBy: null,
      round,
    });
  });

  return evidence;
}

const EVIDENCE_DESCRIPTIONS: Record<Evidence["type"], string[]> = {
  footprint: [
    "Pegadas de barro levam em direção à saída.",
    "Rastros de sapato no corredor — tamanho 42.",
    "Marcas de passos apressados perto do corpo.",
  ],
  fingerprint: [
    "Digitais na alça da faca. Parcialmente apagadas.",
    "Impressão digital no copo d'água próximo à cena.",
    "Marcas de luva — alguém tentou esconder.",
  ],
  bloodstain: [
    "Mancha de sangue que não pertence à vítima.",
    "Salpicos em padrão de arranhão. Houve luta.",
    "Rastro de sangue leva a uma saída lateral.",
  ],
  alibi: [
    "Uma câmera registrou alguém saindo às 23h47.",
    "Vizinho ouviu passos apressados no corredor.",
    "Logs de acesso mostram porta aberta às 02h13.",
  ],
  testimony: [
    "Testemunha anônima: 'Vi alguém com roupa escura'.",
    "Relato: 'Ouvi uma discussão antes do silêncio'.",
    "Depoimento: 'Havia duas sombras onde deveria haver uma'.",
  ],
  object: [
    "Chave desconhecida encontrada próxima ao corpo.",
    "Bilhete rasgado com letras ilegíveis.",
    "Fio solto — sabotagem no gerador?",
  ],
};

// ── Eventos Dinâmicos ─────────────────────────────────────────

export const DYNAMIC_EVENTS: RandomEvent[] = [
  {
    id: "blackout", title: "⚡ Apagão Total",
    description: "As luzes se apagam. Ninguém vê nada. O assassino age duas vezes esta noite.",
    type: "blackout", effect: "double_kill", affectsTeam: "all", duration: 1,
  },
  {
    id: "storm", title: "⛈️ Tempestade",
    description: "A tempestade corta a comunicação. Chat bloqueado por esta fase.",
    type: "storm", effect: "block_chat", affectsTeam: "all", duration: 1,
  },
  {
    id: "false_clue", title: "🎭 Pista Falsa",
    description: "Uma evidência fabricada aponta para um inocente. Alguém está manipulando a cena.",
    type: "false_clue", effect: "fake_evidence", affectsTeam: null, duration: 1,
  },
  {
    id: "witness", title: "👁️ Testemunha Oculta",
    description: "Alguém viu tudo, mas tem medo de falar. Pressione os mais quietos.",
    type: "witness", effect: "reveal_random", affectsTeam: null, duration: 1,
  },
  {
    id: "role_swap", title: "🔄 Troca de Destino",
    description: "Um evento misterioso embaralhou dois papéis. Ninguém sabe quem virou quem.",
    type: "role_swap", effect: "swap_roles", affectsTeam: null, duration: 1,
  },
  {
    id: "double_kill", title: "💀 Noite Sangrenta",
    description: "Dois corpos. Uma noite. O terror dobrou.",
    type: "double_kill", effect: "double_kill", affectsTeam: null, duration: 1,
  },
  {
    id: "sabotage", title: "🔧 Sabotagem",
    description: "Alguém sabotou o gerador. Câmeras offline. Sem registros desta noite.",
    type: "sabotage", effect: "none", affectsTeam: null, duration: 2,
  },
  {
    id: "comm_block", title: "📡 Interferência",
    description: "Comunicação bloqueada. Apenas cochichos. Chat restrito a 3 mensagens por fase.",
    type: "comm_block", effect: "block_chat", affectsTeam: null, duration: 1,
  },
  {
    id: "hallucination", title: "🌀 Alucinação Coletiva",
    description: "Algo na água. Os inocentes vêem suspeitos em todo lugar. Pontuações de suspeita dobradas.",
    type: "hallucination", effect: "none", affectsTeam: "innocents", duration: 1,
  },
  {
    id: "secret_meeting", title: "🤫 Reunião Secreta",
    description: "Os assassinos têm uma janela extra de comunicação privada nesta noite.",
    type: "secret_meeting", effect: "none", affectsTeam: "killers", duration: 1,
  },
  {
    id: "power_surge", title: "💥 Sobrecarga Elétrica",
    description: "Uma explosão ativa todas as câmeras por 30 segundos. Alguém foi filmado.",
    type: "power_surge", effect: "reveal_random", affectsTeam: null, duration: 1,
  },
  {
    id: "anonymous_tip", title: "📝 Delação Anônima",
    description: "Uma carta chegou: alguém revelou um segredo. Mas é verdade?",
    type: "anonymous_tip", effect: "none", affectsTeam: null, duration: 1,
  },
];

export function getRandomEvent(): RandomEvent | null {
  if (Math.random() > 0.45) return null;
  return DYNAMIC_EVENTS[Math.floor(Math.random() * DYNAMIC_EVENTS.length)];
}

// ── Narrador Inteligente ──────────────────────────────────────

const NARRATOR_NIGHT_OPENERS = [
  "🌙 A cidade adormece… mas o mal nunca descansa.",
  "🌑 Sombras se movem. Alguém está caçando.",
  "🕯️ As velas se apagam uma por uma. Esta noite, o monstro age.",
  "🌫️ A névoa engole as ruas. Ninguém está seguro.",
  "🔪 Em algum lugar da escuridão, uma decisão foi tomada.",
];

const NARRATOR_DAY_OPENERS = [
  "☀️ O amanhecer revela o que a noite tentou esconder.",
  "🩸 A luz do dia não apaga o sangue.",
  "😰 Os sobreviventes se olham. Quem falta?",
  "🔍 A investigação começa. A mentira também.",
];

const NARRATOR_VOTE_OPENERS = [
  "⚖️ É hora de julgar. Errar custa vidas.",
  "🗳️ A cidade exige sangue. Mas do culpado ou do inocente?",
  "🎭 O verdadeiro jogo começa agora. Vote com cautela.",
  "🧠 Quem mentiu mais? Quem calou mais? Vote.",
];

export function generateNightNarrator(
  killedNickname: string | null,
  wasSaved: boolean,
): string {
  if (wasSaved && !killedNickname) {
    return "🩺 O médico agiu a tempo. A morte recuou por esta noite. Mas ela voltará.";
  }
  if (killedNickname) {
    const dramatic = [
      `💀 ${killedNickname} foi encontrado(a) sem vida. O silêncio grita.`,
      `🔪 ${killedNickname} não verá o amanhecer. O assassino agiu com precisão cirúrgica.`,
      `⚰️ ${killedNickname} se foi. A pergunta é: quem será o próximo?`,
    ];
    return dramatic[Math.floor(Math.random() * dramatic.length)];
  }
  return "🌙 Uma noite tranquila… ou é isso que querem que você acredite.";
}

export function getNarratorMessage(
  phase: GamePhase,
  result?: NightResult | VoteResult,
  playerName?: string
): string {
  if (phase === "NIGHT") {
    return NARRATOR_NIGHT_OPENERS[Math.floor(Math.random() * NARRATOR_NIGHT_OPENERS.length)];
  }
  if (phase === "DAY") {
    const r = result as NightResult | undefined;
    if (r?.killedId) {
      return `${NARRATOR_DAY_OPENERS[Math.floor(Math.random() * NARRATOR_DAY_OPENERS.length)]} ${r.killedNickname} foi assassinado(a).`;
    }
    return `${NARRATOR_DAY_OPENERS[0]} Ninguém morreu. O médico ou o acaso salvou alguém.`;
  }
  if (phase === "VOTING") {
    return NARRATOR_VOTE_OPENERS[Math.floor(Math.random() * NARRATOR_VOTE_OPENERS.length)];
  }
  if (phase === "RESULT") {
    const r = result as VoteResult | undefined;
    if (r?.wasTie) return "🤝 Empate. A cidade se dividiu. O culpado sorri.";
    if (r?.eliminatedId) {
      return `🔨 ${r.eliminatedNickname} foi eliminado(a). Era ${r.eliminatedRole ? ROLE_NAMES[r.eliminatedRole] : "?"}. Valeu a pena?`;
    }
  }
  if (playerName) {
    return `🎭 ${playerName} parecia nervoso após os últimos acontecimentos…`;
  }
  return "";
}

// ── Pós-Partida ───────────────────────────────────────────────

export function buildPostGameStats(
  players: Player[],
  matchEvents: MatchEvent[],
  rounds: number
): PostGameStats {
  const voteEvents = matchEvents.filter((e) => e.type === "vote");

  // MVP: mais mortes evitadas (médico/investigador com mais ações)
  const saveCounts: Record<string, number> = {};
  matchEvents.filter((e) => e.type === "save").forEach((e) => {
    saveCounts[e.actorId] = (saveCounts[e.actorId] ?? 0) + 1;
  });
  const mvp = Object.entries(saveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Maior mentiroso: jogador que mais votou em inocentes que foram confirmados depois
  const lieCounts: Record<string, number> = {};
  voteEvents.forEach((e) => {
    if (e.targetId) lieCounts[e.actorId] = (lieCounts[e.actorId] ?? 0) + 1;
  });
  const biggestLiar = Object.entries(lieCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Melhor investigador: mais investigações
  const invCounts: Record<string, number> = {};
  matchEvents.filter((e) => e.type === "ability").forEach((e) => {
    invCounts[e.actorId] = (invCounts[e.actorId] ?? 0) + 1;
  });
  const bestInvestigator = Object.entries(invCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Mais suspeito: mais votos recebidos
  const votesReceived: Record<string, number> = {};
  voteEvents.forEach((e) => {
    if (e.targetId) votesReceived[e.targetId] = (votesReceived[e.targetId] ?? 0) + 1;
  });
  const mostSuspicious = Object.entries(votesReceived).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Melhor sobrevivente: mais rodadas sobrevivido
  const aliveAtEnd = players.filter((p) => p.isAlive).map((p) => p.id);
  const bestSurvivor = aliveAtEnd[0] ?? null;

  return { mvp, biggestLiar, bestInvestigator, mostSuspicious, bestSurvivor, timeline: matchEvents, roundCount: rounds };
}

// ── Utils ─────────────────────────────────────────────────────

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
