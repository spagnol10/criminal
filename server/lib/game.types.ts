// ============================================================
// TIPOS CENTRAIS DO JOGO — Jogo Criminalista
// ============================================================

export type PlayerRole =
  | "citizen"
  | "doctor"
  | "investigator"
  | "killer"
  | "accomplice";

export type GamePhase =
  | "WAITING"
  | "STARTING"
  | "NIGHT"
  | "DAY"
  | "VOTING"
  | "RESULT"
  | "FINISHED";

export type TeamWinner = "innocents" | "killers" | null;

export interface Player {
  id: string;
  nickname: string;
  avatar: string; // emoji avatar
  role?: PlayerRole;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  votedFor?: string | null;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerNickname: string;
  content: string;
  timestamp: number;
  type: "public" | "private" | "narrator" | "system";
}

export interface NightAction {
  playerId: string;
  targetId: string;
  action: "kill" | "save" | "investigate";
}

export interface VoteResult {
  eliminatedId: string | null;
  eliminatedNickname: string | null;
  votes: Record<string, string>; // voterId -> targetId
  tallies: Record<string, number>; // targetId -> count
}

export interface NightResult {
  killedId: string | null;
  killedNickname: string | null;
  savedId: string | null;
  investigationResult?: { targetNickname: string; isKiller: boolean };
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: "blackout" | "false_clue" | "witness" | "anonymous_tip";
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
  phaseTimer: number; // segundos restantes
  myPlayer: Player | null;
  myRole: PlayerRole | null;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  phase: GamePhase;
}

// Socket Events — cliente → servidor
export interface ClientToServerEvents {
  "room:create": (data: { nickname: string; avatar: string; maxPlayers: number; isPrivate: boolean }, cb: (res: { room: RoomInfo; player: Player }) => void) => void;
  "room:join": (data: { code: string; nickname: string; avatar: string }, cb: (res: { room: RoomInfo; player: Player } | { error: string }) => void) => void;
  "room:leave": () => void;
  "room:kick": (data: { targetId: string }) => void;
  "game:start": (cb: (res: { ok: boolean } | { error: string }) => void) => void;
  "game:night_action": (data: NightAction) => void;
  "game:vote": (data: { targetId: string }) => void;
  "chat:send": (data: { content: string; type: "public" | "private" }) => void;
  "player:reconnect": (data: { token: string }, cb: (res: { gameState: GameState } | { error: string }) => void) => void;
}

// Socket Events — servidor → cliente
export interface ServerToClientEvents {
  "room:updated": (room: RoomInfo) => void;
  "room:player_joined": (player: Player) => void;
  "room:player_left": (playerId: string) => void;
  "game:phase_changed": (data: { phase: GamePhase; timer: number }) => void;
  "game:role_assigned": (role: PlayerRole) => void;
  "game:night_result": (result: NightResult) => void;
  "game:vote_result": (result: VoteResult) => void;
  "game:event": (event: RandomEvent) => void;
  "game:finished": (data: { winner: TeamWinner; players: Player[] }) => void;
  "chat:message": (message: ChatMessage) => void;
  "player:disconnected": (playerId: string) => void;
  "player:reconnected": (playerId: string) => void;
  "error": (message: string) => void;
}
