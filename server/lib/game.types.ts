// ============================================================
// TIPOS CENTRAIS — Criminal Investigation v2
// ============================================================

export type PlayerRole =
  | "citizen"
  | "doctor"
  | "investigator"
  | "killer"
  | "accomplice"
  | "informant"
  | "hacker"
  | "manipulator"
  | "ghost"
  | "silentKiller"
  | "corruptCop"
  | "survivor"
  | "traitor"
  | "spy";

export type GamePhase =
  | "WAITING"
  | "STARTING"
  | "NIGHT"
  | "DAY"
  | "VOTING"
  | "RESULT"
  | "FINISHED";

export type TeamWinner = "innocents" | "killers" | "neutral" | null;
export type MapId = "mansion" | "hospital" | "hotel" | "police" | "train" | "lab";
export type EventType =
  | "blackout" | "false_clue" | "witness" | "anonymous_tip"
  | "storm" | "role_swap" | "double_kill" | "sabotage"
  | "comm_block" | "hallucination" | "secret_meeting" | "power_surge";
export type GameMode = "normal" | "hardcore" | "terror" | "chaos" | "investigation";

export interface Evidence {
  id: string;
  type: "footprint" | "fingerprint" | "bloodstain" | "alibi" | "testimony" | "object";
  description: string;
  pointsTo: string | null;
  isFake: boolean;
  discoveredBy: string | null;
  round: number;
}

export interface SuspicionProfile {
  playerId: string;
  score: number;
  flags: string[];
  voteHistory: string[];
  behaviorTags: string[];
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  role?: PlayerRole;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  votedFor?: string | null;
  suspicionScore: number;
  isSpectator: boolean;
  hasUsedAbility: boolean;
  abilityCooldown: number;
  team?: "innocents" | "killers" | "neutral";
  customTitle?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerNickname: string;
  content: string;
  timestamp: number;
  type: "public" | "private" | "narrator" | "system" | "whisper" | "spectator";
}

export interface NightAction {
  playerId: string;
  targetId: string;
  action: "kill" | "save" | "investigate" | "hack" | "manipulate" | "spy" | "corrupt" | "protect";
}

export interface VoteResult {
  eliminatedId: string | null;
  eliminatedNickname: string | null;
  eliminatedRole: PlayerRole | null;
  votes: Record<string, string>;
  tallies: Record<string, number>;
  wasTie: boolean;
}

export interface NightResult {
  killedId: string | null;
  killedNickname: string | null;
  savedId: string | null;
  blockedId: string | null;
  hackedId: string | null;
  investigationResult?: { targetNickname: string; isKiller: boolean; role: PlayerRole };
  spyResult?: { targetNickname: string; wasOnline: boolean; lastAction: string };
  narratorComment: string;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  effect: "none" | "skip_night_action" | "reveal_random" | "swap_roles" | "double_kill" | "block_chat" | "fake_evidence";
  affectsTeam: "all" | "killers" | "innocents" | null;
  duration: number;
}

export interface MapRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isRestricted: boolean;
  hasSabotagePoint: boolean;
  hasCamera: boolean;
}

export interface GameMap {
  id: MapId;
  name: string;
  emoji: string;
  atmosphere: string;
  rooms: MapRoom[];
}

export interface MatchEvent {
  round: number;
  phase: GamePhase;
  type: "kill" | "save" | "vote" | "eliminate" | "event" | "ability" | "lie" | "chat";
  actorId: string;
  targetId?: string;
  description: string;
  timestamp: number;
}

export interface PostGameStats {
  mvp: string | null;
  biggestLiar: string | null;
  bestInvestigator: string | null;
  mostSuspicious: string | null;
  bestSurvivor: string | null;
  timeline: MatchEvent[];
  roundCount: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  players: Player[];
  messages: ChatMessage[];
  nightResult: NightResult | null;
  voteResult: VoteResult | null;
  winner: TeamWinner;
  randomEvent: RandomEvent | null;
  activeEvents: RandomEvent[];
  phaseTimer: number;
  myPlayer: Player | null;
  myRole: PlayerRole | null;
  map: GameMap | null;
  evidence: Evidence[];
  suspicionProfiles: SuspicionProfile[];
  matchEvents: MatchEvent[];
  postGameStats: PostGameStats | null;
  gameMode: GameMode;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  phase: GamePhase;
  map?: MapId;
  gameMode?: GameMode;
}

export interface ClientToServerEvents {
  "room:create": (
    data: { nickname: string; avatar: string; maxPlayers: number; isPrivate: boolean; map?: MapId; gameMode?: GameMode },
    cb: (res: { room: RoomInfo; player: Player } | { error: string }) => void
  ) => void;
  "room:join": (
    data: { code: string; nickname: string; avatar: string },
    cb: (res: { room: RoomInfo; player: Player } | { error: string }) => void
  ) => void;
  "room:leave": () => void;
  "room:kick": (data: { targetId: string }) => void;
  "game:start": (cb: (res: { ok: boolean } | { error: string }) => void) => void;
  "game:night_action": (data: NightAction) => void;
  "game:vote": (data: { targetId: string }) => void;
  "game:use_ability": (data: { targetId: string; ability: string }) => void;
  "chat:send": (data: { content: string; type: "public" | "private" | "whisper" }) => void;
  "player:reconnect": (
    data: { token: string },
    cb: (res: { gameState: GameState } | { error: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  "room:updated": (room: RoomInfo) => void;
  "room:player_joined": (player: Player) => void;
  "room:player_left": (playerId: string) => void;
  "game:phase_changed": (data: { phase: GamePhase; timer: number; narratorMsg?: string }) => void;
  "game:role_assigned": (role: PlayerRole) => void;
  "game:night_result": (result: NightResult) => void;
  "game:vote_result": (result: VoteResult) => void;
  "game:event": (event: RandomEvent) => void;
  "game:event_ended": (eventId: string) => void;
  "game:evidence": (evidence: Evidence) => void;
  "game:suspicion_update": (profiles: SuspicionProfile[]) => void;
  "game:finished": (data: { winner: TeamWinner; players: Player[]; stats: PostGameStats }) => void;
  "game:map": (map: GameMap) => void;
  "chat:message": (message: ChatMessage) => void;
  "player:disconnected": (playerId: string) => void;
  "player:reconnected": (playerId: string) => void;
  "error": (msg: string) => void;
}
