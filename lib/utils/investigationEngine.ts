// ============================================================
// ENGINE — Modo Investigação Narrativa
// ============================================================
import type {
  InvestigationCase,
  InvestigationGameState,
  InvestigationPlayer,
  PlayerRole_Investigation,
  ChapterPhase,
  InterrogationSession,
  NarratorMessage,
  TimelineEntry,
  InvestigativeBoard,
  NarrativeSuspect,
  SuspectEmotion,
} from "../types/investigation";

// ────────────────────────────────────────────────────────────
// PAPÉIS DOS JOGADORES
// ────────────────────────────────────────────────────────────
export const INVESTIGATION_ROLES: PlayerRole_Investigation[] = [
  {
    role: "detective",
    label: "Detetive",
    emoji: "🕵️",
    description: "Analisa a cena do crime e coordena a investigação. Pode fazer acusações diretas.",
    ability: "Revelar 1 evidência oculta por capítulo",
  },
  {
    role: "analyst",
    label: "Analista",
    emoji: "🔍",
    description: "Especialista em padrões e documentos. Conecta evidências com mais precisão.",
    ability: "Ver se uma evidência é fake ou real",
  },
  {
    role: "interrogator",
    label: "Interrogador",
    emoji: "⚖️",
    description: "Mestre em pressionar suspeitos. Detecta mentiras com mais facilidade.",
    ability: "+1 interrogação extra por capítulo",
  },
  {
    role: "forensic",
    label: "Médico Legista",
    emoji: "🧬",
    description: "Analisa evidências físicas e forenses com profundidade.",
    ability: "Ver detalhes extras de evidências físicas e forenses",
  },
  {
    role: "hacker",
    label: "Hacker",
    emoji: "💻",
    description: "Acessa registros digitais e financeiros com facilidade.",
    ability: "Revelar evidências digitais e financeiras antes do capítulo previsto",
  },
];

function getRoleForIndex(index: number): PlayerRole_Investigation {
  return INVESTIGATION_ROLES[index % INVESTIGATION_ROLES.length];
}

// ────────────────────────────────────────────────────────────
// INICIALIZAR JOGO
// ────────────────────────────────────────────────────────────
export function initInvestigationGame(
  gameCase: InvestigationCase,
  players: Array<{ id: string; nickname: string; avatar: string }>
): InvestigationGameState {
  const investigationPlayers: InvestigationPlayer[] = players.map((p, i) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    role: getRoleForIndex(i),
    accusationsLeft: 2,
    discoveredEvidenceIds: [],
    notes: "",
    score: 0,
  }));

  const board: InvestigativeBoard = {
    connections: [],
    pinnedEvidenceIds: [],
    pinnedSuspectIds: [],
    playerNotes: {},
  };

  // Evidências do capítulo 1 reveladas de início
  const chapter1 = gameCase.chapters[0];
  const revealedEvidenceIds = [...chapter1.newEvidenceIds];

  const openingMessages = chapter1.openingNarration.map<NarratorMessage>((text, i) => ({
    id: `msg_intro_${i}`,
    chapter: 1,
    text,
    type: "narration",
    timestamp: Date.now() + i * 100,
  }));

  return {
    caseId: gameCase.id,
    currentChapter: 1,
    phase: "INTRO",
    players: investigationPlayers,
    evidence: gameCase.evidence,
    revealedEvidenceIds,
    board,
    interrogations: {},
    suspectAccusations: Object.fromEntries(gameCase.suspects.map((s) => [s.id, 0])),
    chapterEvents: gameCase.events.filter((e) => e.chapter === 1),
    revealedEventIds: [chapter1.newEventIds[0] ?? ""].filter(Boolean),
    votes: {},
    verdict: null,
    wasCorrect: null,
    narratorMessages: openingMessages,
    timeline: [
      {
        id: "tl_start",
        chapter: 1,
        phase: "INTRO",
        action: `Investigação iniciada: "${gameCase.title}"`,
        timestamp: Date.now(),
      },
    ],
    startedAt: Date.now(),
  };
}

// ────────────────────────────────────────────────────────────
// AVANÇAR CAPÍTULO
// ────────────────────────────────────────────────────────────
export function advanceChapter(
  state: InvestigationGameState,
  gameCase: InvestigationCase
): InvestigationGameState {
  const nextChapter = state.currentChapter + 1;
  if (nextChapter > gameCase.chapters.length) return state;

  const chapter = gameCase.chapters[nextChapter - 1];
  const newEvidenceIds = [...state.revealedEvidenceIds, ...chapter.newEvidenceIds];
  const newEvents = gameCase.events.filter((e) => e.chapter === nextChapter);

  const narratorMsgs: NarratorMessage[] = chapter.openingNarration.map((text, i) => ({
    id: `msg_ch${nextChapter}_${i}`,
    chapter: nextChapter,
    text,
    type: "narration" as const,
    timestamp: Date.now() + i * 100,
  }));

  // Eventos do capítulo podem revelar mais evidências
  const eventEvidenceIds: string[] = [];
  for (const ev of newEvents) {
    if (ev.unlocksEvidenceIds) eventEvidenceIds.push(...ev.unlocksEvidenceIds);
  }

  const allRevealedIds = [...new Set([...newEvidenceIds, ...eventEvidenceIds])];

  const newPhase: ChapterPhase =
    nextChapter === gameCase.chapters.length ? "JUDGMENT" : "INVESTIGATION";

  const tl: TimelineEntry = {
    id: `tl_ch${nextChapter}`,
    chapter: nextChapter,
    phase: newPhase,
    action: `Capítulo ${nextChapter}: ${chapter.title}`,
    timestamp: Date.now(),
  };

  return {
    ...state,
    currentChapter: nextChapter,
    phase: newPhase,
    revealedEvidenceIds: allRevealedIds,
    chapterEvents: [...state.chapterEvents, ...newEvents],
    revealedEventIds: [
      ...state.revealedEventIds,
      ...newEvents.map((e) => e.id),
    ],
    narratorMessages: [...state.narratorMessages, ...narratorMsgs],
    timeline: [...state.timeline, tl],
    // Reset interrogações por capítulo
    players: state.players.map((p) => ({
      ...p,
      accusationsLeft: p.role.role === "interrogator" ? 3 : 2,
    })),
  };
}

// ────────────────────────────────────────────────────────────
// INTERROGAR SUSPEITO
// ────────────────────────────────────────────────────────────
export function interrogateSuspect(
  state: InvestigationGameState,
  gameCase: InvestigationCase,
  playerId: string,
  suspectId: string,
  question: string
): { newState: InvestigationGameState; session: InterrogationSession } {
  const player = state.players.find((p) => p.id === playerId);
  const suspect = gameCase.suspects.find((s) => s.id === suspectId);

  if (!player || !suspect || player.accusationsLeft <= 0) {
    throw new Error("Interrogação inválida");
  }

  const emotion = suspect.emotionByChapter[state.currentChapter] ?? "calm";
  const { response, wasLie } = generateSuspectResponse(suspect, emotion, state.currentChapter, question);

  const session: InterrogationSession = {
    suspectId,
    playerId,
    chapter: state.currentChapter,
    question,
    response,
    emotion,
    wasLie,
  };

  const newNarratorMsg: NarratorMessage = {
    id: `msg_inter_${Date.now()}`,
    chapter: state.currentChapter,
    text: buildInterrogationNarration(suspect, emotion, wasLie),
    type: wasLie ? "tension" : "clue",
    timestamp: Date.now(),
  };

  const tl: TimelineEntry = {
    id: `tl_inter_${Date.now()}`,
    chapter: state.currentChapter,
    phase: state.phase,
    action: `${player.nickname} interrogou ${suspect.name}`,
    actorId: playerId,
    timestamp: Date.now(),
  };

  const prevSessions = state.interrogations[suspectId] ?? [];
  const newState: InvestigationGameState = {
    ...state,
    interrogations: {
      ...state.interrogations,
      [suspectId]: [...prevSessions, session],
    },
    suspectAccusations: {
      ...state.suspectAccusations,
      [suspectId]: (state.suspectAccusations[suspectId] ?? 0) + 1,
    },
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, accusationsLeft: p.accusationsLeft - 1 } : p
    ),
    narratorMessages: [...state.narratorMessages, newNarratorMsg],
    timeline: [...state.timeline, tl],
  };

  return { newState, session };
}

function generateSuspectResponse(
  suspect: NarrativeSuspect,
  emotion: SuspectEmotion,
  chapter: number,
  question: string
): { response: string; wasLie: boolean } {
  const q = question.toLowerCase();

  // Se pergunta sobre alibi
  if (q.includes("onde") || q.includes("alibi") || q.includes("estava")) {
    if (emotion === "lying" || emotion === "nervous") {
      const lie = suspect.lies[0] ?? suspect.alibi;
      return { response: lie, wasLie: suspect.isKiller };
    }
    return { response: suspect.alibi, wasLie: false };
  }

  // Se pergunta sobre motivo
  if (q.includes("motivo") || q.includes("por que") || q.includes("razão")) {
    if (suspect.isKiller && chapter >= 3) {
      return {
        response: `${suspect.truths[0] ?? "Não tenho nada a dizer."} ${emotion === "angry" ? "E isso é tudo!" : ""}`,
        wasLie: false,
      };
    }
    return {
      response: suspect.lies[Math.floor(Math.random() * suspect.lies.length)] ?? "Não tenho motivo algum.",
      wasLie: suspect.isKiller,
    };
  }

  // Resposta genérica por emoção
  const genericByEmotion: Record<SuspectEmotion, string> = {
    calm: suspect.truths[0] ?? "Não tenho nada a esconder.",
    nervous: "Eu... preciso pensar. Essa pergunta não faz sentido.",
    angry: "Como você ousa me interrogar assim?! Eu não fiz nada!",
    crying: "Por favor, parem... Isso é difícil demais para mim.",
    lying: suspect.lies[0] ?? "Não sei do que está falando.",
    hiding: "Prefiro não comentar sobre isso no momento.",
    cooperative: suspect.truths[suspect.truths.length - 1] ?? "Quero ajudar como puder.",
  };

  const isLying = ["lying", "nervous", "hiding"].includes(emotion) && suspect.isKiller;
  return { response: genericByEmotion[emotion], wasLie: isLying };
}

function buildInterrogationNarration(
  suspect: NarrativeSuspect,
  emotion: SuspectEmotion,
  wasLie: boolean
): string {
  const emotionDesc: Record<SuspectEmotion, string> = {
    calm: `${suspect.name} responde com calma, mantendo contato visual.`,
    nervous: `${suspect.name} hesita. As mãos se mexem levemente.`,
    angry: `${suspect.name} se levanta abruptamente. "Isso é um absurdo."`,
    crying: `${suspect.name} começa a chorar. A voz falha.`,
    lying: `${suspect.name} responde rápido demais. Os olhos desviam.`,
    hiding: `${suspect.name} escolhe cada palavra com cuidado. Algo está sendo omitido.`,
    cooperative: `${suspect.name} faz contato visual direto. Parece genuinamente querer ajudar.`,
  };

  const lieHint = wasLie ? " Algo nessa resposta não fecha." : "";
  return emotionDesc[emotion] + lieHint;
}

// ────────────────────────────────────────────────────────────
// CONECTAR EVIDÊNCIAS NO QUADRO
// ────────────────────────────────────────────────────────────
export function connectEvidence(
  state: InvestigationGameState,
  fromId: string,
  toId: string,
  label: string
): InvestigationGameState {
  const alreadyExists = state.board.connections.some(
    (c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );
  if (alreadyExists) return state;

  // Verificar se a conexão é forte (baseada nos linkedEvidenceIds)
  const evidence = state.evidence.find((e) => e.id === fromId);
  const isStrong = evidence?.linkedEvidenceIds.includes(toId) ?? false;

  return {
    ...state,
    board: {
      ...state.board,
      connections: [
        ...state.board.connections,
        { from: fromId, to: toId, label, strength: isStrong ? "strong" : "medium" },
      ],
    },
  };
}

export function pinEvidence(
  state: InvestigationGameState,
  evidenceId: string
): InvestigationGameState {
  const already = state.board.pinnedEvidenceIds.includes(evidenceId);
  return {
    ...state,
    board: {
      ...state.board,
      pinnedEvidenceIds: already
        ? state.board.pinnedEvidenceIds.filter((id) => id !== evidenceId)
        : [...state.board.pinnedEvidenceIds, evidenceId],
    },
  };
}

export function pinSuspect(
  state: InvestigationGameState,
  suspectId: string
): InvestigationGameState {
  const already = state.board.pinnedSuspectIds.includes(suspectId);
  return {
    ...state,
    board: {
      ...state.board,
      pinnedSuspectIds: already
        ? state.board.pinnedSuspectIds.filter((id) => id !== suspectId)
        : [...state.board.pinnedSuspectIds, suspectId],
    },
  };
}

// ────────────────────────────────────────────────────────────
// VOTAÇÃO FINAL
// ────────────────────────────────────────────────────────────
export function castVote(
  state: InvestigationGameState,
  playerId: string,
  suspectId: string
): InvestigationGameState {
  return {
    ...state,
    votes: { ...state.votes, [playerId]: suspectId },
  };
}

export function resolveVerdict(
  state: InvestigationGameState,
  gameCase: InvestigationCase
): InvestigationGameState {
  const voteCounts: Record<string, number> = {};
  for (const suspectId of Object.values(state.votes)) {
    voteCounts[suspectId] = (voteCounts[suspectId] ?? 0) + 1;
  }

  let verdict = "";
  let maxVotes = 0;
  for (const [sid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      verdict = sid;
    }
  }

  const wasCorrect = verdict === gameCase.killer;

  const narratorText = wasCorrect
    ? buildCorrectVerdictNarration(gameCase)
    : buildWrongVerdictNarration(gameCase, verdict);

  const verdictMsg: NarratorMessage = {
    id: `msg_verdict_${Date.now()}`,
    chapter: state.currentChapter,
    text: narratorText,
    type: "revelation",
    timestamp: Date.now(),
  };

  const scores = computeScores(state, gameCase, wasCorrect);

  return {
    ...state,
    phase: "VERDICT",
    verdict,
    wasCorrect,
    narratorMessages: [...state.narratorMessages, verdictMsg],
    players: state.players.map((p) => ({ ...p, score: scores[p.id] ?? 0 })),
    finishedAt: Date.now(),
    timeline: [
      ...state.timeline,
      {
        id: `tl_verdict`,
        chapter: state.currentChapter,
        phase: "VERDICT",
        action: wasCorrect
          ? `✅ Veredicto correto: ${getKillerName(gameCase)} foi condenado.`
          : `❌ Veredicto errado: ${getSuspectName(gameCase, verdict)} foi acusado incorretamente.`,
        timestamp: Date.now(),
      },
    ],
  };
}

function computeScores(
  state: InvestigationGameState,
  gameCase: InvestigationCase,
  wasCorrect: boolean
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const player of state.players) {
    let score = player.discoveredEvidenceIds.length * 10;
    const interrogations = Object.values(state.interrogations)
      .flat()
      .filter((s) => s.playerId === player.id).length;
    score += interrogations * 5;
    if (wasCorrect && state.votes[player.id] === gameCase.killer) score += 50;
    if (state.board.connections.length > 0) score += state.board.connections.length * 3;
    scores[player.id] = score;
  }
  return scores;
}

function getKillerName(gameCase: InvestigationCase): string {
  return gameCase.suspects.find((s) => s.isKiller)?.name ?? "Desconhecido";
}

function getSuspectName(gameCase: InvestigationCase, id: string): string {
  return gameCase.suspects.find((s) => s.id === id)?.name ?? id;
}

function buildCorrectVerdictNarration(gameCase: InvestigationCase): string {
  const killer = gameCase.suspects.find((s) => s.isKiller);
  return (
    `Após uma investigação árdua, os detetives chegaram à conclusão certa. ` +
    `${killer?.name} foi levado para prestar contas. ` +
    `A verdade veio à tona: ${gameCase.motive}. ` +
    `Justiça foi feita.`
  );
}

function buildWrongVerdictNarration(gameCase: InvestigationCase, wrongId: string): string {
  const innocent = gameCase.suspects.find((s) => s.id === wrongId);
  const killer = gameCase.suspects.find((s) => s.isKiller);
  return (
    `Os investigadores acusaram ${innocent?.name ?? wrongId} — um inocente. ` +
    `Enquanto isso, o verdadeiro culpado, ${killer?.name}, desapareceu na noite. ` +
    `A verdade permanece oculta. O caso ficará em aberto.`
  );
}

// ────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ────────────────────────────────────────────────────────────
export function getRevealedEvidence(state: InvestigationGameState) {
  return state.evidence.filter((e) => state.revealedEvidenceIds.includes(e.id));
}

export function getHiddenEvidence(state: InvestigationGameState) {
  return state.evidence.filter((e) => !state.revealedEvidenceIds.includes(e.id));
}

export function getSuspectInterrogationCount(
  state: InvestigationGameState,
  suspectId: string
): number {
  return (state.interrogations[suspectId] ?? []).length;
}

export function getTotalConnections(state: InvestigationGameState): number {
  return state.board.connections.length;
}

export function getLeadingAccusation(
  state: InvestigationGameState
): string | null {
  let max = 0;
  let top: string | null = null;
  for (const [sid, count] of Object.entries(state.suspectAccusations)) {
    if (count > max) { max = count; top = sid; }
  }
  return top;
}

export function addNote(
  state: InvestigationGameState,
  playerId: string,
  note: string
): InvestigationGameState {
  return {
    ...state,
    board: {
      ...state.board,
      playerNotes: { ...state.board.playerNotes, [playerId]: note },
    },
  };
}

export function discoverEvidence(
  state: InvestigationGameState,
  playerId: string,
  evidenceId: string
): InvestigationGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.discoveredEvidenceIds.includes(evidenceId)) return state;

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, discoveredEvidenceIds: [...p.discoveredEvidenceIds, evidenceId] }
        : p
    ),
  };
}

export const SETTING_LABELS: Record<string, string> = {
  mansion: "🏛️ Mansão",
  hospital: "🏥 Hospital",
  corporate: "🏢 Corporação",
  medieval: "🏰 Reino Medieval",
  ship: "🚢 Navio",
  school: "🎓 Universidade",
  police: "🚔 Delegacia",
};
