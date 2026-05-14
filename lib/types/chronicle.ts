// ============================================================
// TIPOS — Crônicas do Véu (Biblical Dark Fantasy RPG)
// ============================================================

export type KingdomId = "solareth" | "nethram" | "azkar" | "elnor" | "zion";
export type FactionId = "celestial" | "abyss" | "veil";
export type PlayerClass =
  | "sacred_warrior"
  | "prophet"
  | "priest"
  | "desert_hunter"
  | "oracle"
  | "corrupted";

export type AlignmentPath = "light" | "shadow" | "neutral";
export type EventType =
  | "prophecy" | "war" | "plague" | "eclipse" | "miracle"
  | "betrayal" | "judgment" | "uprising" | "divine_sign" | "corruption_surge";

export type ChoiceImpact =
  | "faith_gain" | "faith_loss" | "corruption_gain" | "corruption_loss"
  | "kingdom_favor" | "kingdom_anger" | "faction_rise" | "faction_fall"
  | "trigger_prophecy" | "trigger_war" | "betrayal";

// ────────────────────────────────────────────────────────────
// MUNDO
// ────────────────────────────────────────────────────────────
export interface Kingdom {
  id: KingdomId;
  name: string;
  emoji: string;
  description: string;
  capital: string;
  flavor: string;
  stability: number;       // 0–100
  corruption: number;      // 0–100
  militaryPower: number;   // 0–100
  faithLevel: number;      // 0–100
  rulerName: string;
  rulerTitle: string;
  rulerEmoji: string;
  allies: KingdomId[];
  enemies: KingdomId[];
  color: string;           // tailwind color class
}

export interface City {
  id: string;
  name: string;
  kingdomId: KingdomId;
  emoji: string;
  description: string;
  population: "small" | "medium" | "large";
  isCapital: boolean;
  faithLevel: number;
  corruptionLevel: number;
  status: "thriving" | "troubled" | "besieged" | "fallen" | "holy";
}

export interface Faction {
  id: FactionId;
  name: string;
  emoji: string;
  description: string;
  philosophy: string;
  power: number; // 0–100
  members: string[];
  goal: string;
}

// ────────────────────────────────────────────────────────────
// PERSONAGEM
// ────────────────────────────────────────────────────────────
export interface CharacterClassDef {
  id: PlayerClass;
  name: string;
  emoji: string;
  description: string;
  ability: string;
  faithBonus: number;
  corruptionResistance: number;
  lore: string;
}

export interface ChroniclePlayer {
  id: string;
  nickname: string;
  avatar: string;
  class: PlayerClass;
  kingdom: KingdomId;
  faction: FactionId | null;
  faith: number;           // 0–100
  corruption: number;      // 0–100
  alignment: AlignmentPath;
  reputation: number;      // 0–100
  title: string;
  completedChoices: string[];
  witnessedEvents: string[];
  stats: {
    miraclesPerformed: number;
    betrayalsCommitted: number;
    livesProtected: number;
    propheciesFulfilled: number;
    warsFought: number;
  };
  appearance: "pure" | "marked" | "corrupted" | "divine";
}

// ────────────────────────────────────────────────────────────
// PROFECIAS & EVENTOS
// ────────────────────────────────────────────────────────────
export interface Prophecy {
  id: string;
  text: string;           // texto poético da profecia
  interpretation: string; // o que significa de verdade
  triggerCondition: string;
  isFulfilled: boolean;
  isActive: boolean;
  chapter: number;
  consequences: WorldEffect[];
}

export interface WorldEffect {
  type: "kingdom_stability" | "kingdom_corruption" | "kingdom_faith"
       | "faction_power" | "city_status" | "trigger_event";
  targetId: string;
  delta: number;
  description: string;
}

export interface WorldEvent {
  id: string;
  type: EventType;
  title: string;
  narrative: string[];    // múltiplas linhas narradas pela IA
  emoji: string;
  affectedKingdoms: KingdomId[];
  chapter: number;
  effects: WorldEffect[];
  isActive: boolean;
  resolvedBy?: string;   // playerId que resolveu
}

// ────────────────────────────────────────────────────────────
// ESCOLHAS NARRATIVAS
// ────────────────────────────────────────────────────────────
export interface NarrativeChoice {
  id: string;
  title: string;
  description: string;
  emoji: string;
  chapter: number;
  context: string;        // situação que gerou a escolha
  options: ChoiceOption[];
  isResolved: boolean;
  chosenOptionId?: string;
  chosenByPlayerId?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  impacts: ChoiceImpact[];
  faithDelta: number;
  corruptionDelta: number;
  narratorResponse: string;  // o que a IA narra ao escolher
  worldEffect?: WorldEffect;
  unlocksProphecyId?: string;
}

// ────────────────────────────────────────────────────────────
// ESTADO DO JOGO
// ────────────────────────────────────────────────────────────
export interface ChronicleGameState {
  player: ChroniclePlayer;
  chapter: number;
  worldAge: string;        // "Era do Primeiro Véu", etc.
  kingdoms: Kingdom[];
  cities: City[];
  factions: Faction[];
  activeProphecies: Prophecy[];
  fulfilledProphecies: Prophecy[];
  activeEvents: WorldEvent[];
  pastEvents: WorldEvent[];
  availableChoices: NarrativeChoice[];
  resolvedChoices: NarrativeChoice[];
  narratorLog: NarratorEntry[];
  worldState: WorldState;
  startedAt: number;
  lastActionAt: number;
}

export interface WorldState {
  eclipse: boolean;
  plague: boolean;
  warActive: boolean;
  divinePresence: number;   // 0–100 (quanto os céus estão "ativos")
  chaosLevel: number;       // 0–100
  holyCityIntact: boolean;
  skyColor: "golden" | "red" | "grey" | "black" | "white";
}

export interface NarratorEntry {
  id: string;
  chapter: number;
  text: string;
  type: "divine" | "dark" | "neutral" | "warning" | "miracle" | "prophecy";
  timestamp: number;
}
