// ============================================================
// TIPOS — Modo Investigação Narrativa Episódica
// ============================================================

export type ChapterPhase =
  | "INTRO"        // Narração do crime
  | "INVESTIGATION" // Análise de evidências
  | "INTERROGATION" // Interrogar NPCs
  | "REVELATION"   // Novas revelações aparecem
  | "JUDGMENT"     // Votação final
  | "VERDICT"      // Resultado final
  | "FINISHED";

export type SuspectEmotion =
  | "calm" | "nervous" | "angry" | "crying" | "lying" | "hiding" | "cooperative";

export type EvidenceCategory =
  | "physical"   // objeto físico
  | "testimony"  // depoimento
  | "document"   // documento, carta
  | "digital"    // registro eletrônico
  | "forensic"   // análise forense
  | "photo"      // fotografia
  | "financial"; // movimentação financeira

export type Relationship =
  | "enemy" | "lover" | "business_partner" | "sibling" | "friend" | "rival"
  | "subordinate" | "blackmailer" | "victim_of";

export type CaseSetting =
  | "mansion"   // mansão aristocrática
  | "hospital"  // hospital
  | "corporate" // corporação
  | "medieval"  // reino medieval
  | "ship"      // navio
  | "school"    // escola / universidade
  | "police";   // delegacia

export interface CaseVictim {
  id: string;
  name: string;
  avatar: string;
  profession: string;
  backstory: string;
  secrets: string[];
}

export interface NarrativeSuspect {
  id: string;
  name: string;
  avatar: string;
  profession: string;
  alibi: string;
  motive: string;
  isKiller: boolean;
  relationship: Relationship;
  emotionByChapter: Record<number, SuspectEmotion>;
  truths: string[];   // respostas verdadeiras
  lies: string[];     // respostas falsas
  omissions: string[]; // informações ocultadas
  revealedAt?: number; // capítulo em que a mentira é revelada
  accusationCount: number;
}

export interface CaseEvidence {
  id: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  emoji: string;
  pointsTo: string | null;    // suspectId ou null
  isFake: boolean;
  revealedInChapter: number;  // 1-4
  linkedEvidenceIds: string[]; // pistas que se conectam
  discoveredBy?: string;       // playerId
}

export interface Connection {
  from: string; // evidenceId ou suspectId
  to: string;
  label: string;
  strength: "weak" | "medium" | "strong";
}

export interface InvestigativeBoard {
  connections: Connection[];
  pinnedEvidenceIds: string[];
  pinnedSuspectIds: string[];
  playerNotes: Record<string, string>; // playerId → nota
}

export interface ChapterEvent {
  id: string;
  chapter: number;
  type: "evidence_found" | "suspect_breaks" | "new_suspect" | "alibi_shattered"
       | "financial_trace" | "witness_appears" | "plot_twist" | "red_herring";
  title: string;
  narrative: string;
  unlocksEvidenceIds?: string[];
  updatesSuspectEmotion?: { suspectId: string; emotion: SuspectEmotion };
}

export interface PlayerRole_Investigation {
  role: "detective" | "analyst" | "interrogator" | "forensic" | "hacker";
  label: string;
  emoji: string;
  description: string;
  ability: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  tagline: string;
  setting: CaseSetting;
  settingDescription: string;
  victim: CaseVictim;
  killer: string;           // suspectId
  motive: string;
  suspects: NarrativeSuspect[];
  evidence: CaseEvidence[];
  chapters: ChapterNarrative[];
  events: ChapterEvent[];
  finalTwist: string;
  trueNarrative: string;    // o que REALMENTE aconteceu (revela no final)
}

export interface ChapterNarrative {
  chapter: number;
  title: string;
  openingNarration: string[];
  availableActions: string[];
  newEvidenceIds: string[];
  newEventIds: string[];
  atmosphereNote: string;
}

export interface InvestigationGameState {
  caseId: string;
  currentChapter: number;
  phase: ChapterPhase;
  players: InvestigationPlayer[];
  evidence: CaseEvidence[];
  revealedEvidenceIds: string[];
  board: InvestigativeBoard;
  interrogations: Record<string, InterrogationSession[]>; // suspectId → sessions
  suspectAccusations: Record<string, number>; // suspectId → count
  chapterEvents: ChapterEvent[];
  revealedEventIds: string[];
  votes: Record<string, string>; // playerId → suspectId
  verdict: string | null;
  wasCorrect: boolean | null;
  narratorMessages: NarratorMessage[];
  timeline: TimelineEntry[];
  startedAt: number;
  finishedAt?: number;
}

export interface InvestigationPlayer {
  id: string;
  nickname: string;
  avatar: string;
  role: PlayerRole_Investigation;
  accusationsLeft: number;    // interrogações restantes por capítulo
  discoveredEvidenceIds: string[];
  notes: string;
  score: number;
}

export interface InterrogationSession {
  suspectId: string;
  playerId: string;
  chapter: number;
  question: string;
  response: string;
  emotion: SuspectEmotion;
  wasLie: boolean;
}

export interface NarratorMessage {
  id: string;
  chapter: number;
  text: string;
  type: "narration" | "tension" | "revelation" | "clue" | "system";
  timestamp: number;
}

export interface TimelineEntry {
  id: string;
  chapter: number;
  phase: ChapterPhase;
  action: string;
  actorId?: string;
  timestamp: number;
}
