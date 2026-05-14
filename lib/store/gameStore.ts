import { create } from "zustand";
import type {
  GameState,
  Player,
  ChatMessage,
  NightResult,
  VoteResult,
  GamePhase,
  PlayerRole,
  TeamWinner,
  RandomEvent,
  RoomInfo,
} from "../types/game";

interface GameStore extends GameState {
  // Setters
  setRoom: (room: RoomInfo) => void;
  setMyPlayer: (player: Player) => void;
  setMyRole: (role: PlayerRole) => void;
  setPhase: (phase: GamePhase, timer: number) => void;
  setTimer: (t: number) => void;
  addMessage: (msg: ChatMessage) => void;
  setNightResult: (r: NightResult) => void;
  setVoteResult: (r: VoteResult) => void;
  setWinner: (w: TeamWinner, players: Player[]) => void;
  setRandomEvent: (e: RandomEvent | null) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  addPlayer: (player: Player) => void;
  reset: () => void;
}

const initialState: GameState = {
  roomCode: "",
  phase: "WAITING",
  round: 0,
  players: [],
  messages: [],
  nightResult: null,
  voteResult: null,
  winner: null,
  randomEvent: null,
  phaseTimer: 0,
  myPlayer: null,
  myRole: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoom: (room) =>
    set((s) => ({
      roomCode: room.code,
      players: room.players,
      phase: room.phase,
      myPlayer: s.myPlayer
        ? room.players.find((p) => p.id === s.myPlayer!.id) ?? s.myPlayer
        : s.myPlayer,
    })),

  setMyPlayer: (player) => set({ myPlayer: player }),

  setMyRole: (role) =>
    set((s) => ({
      myRole: role,
      myPlayer: s.myPlayer ? { ...s.myPlayer, role } : s.myPlayer,
    })),

  setPhase: (phase, timer) =>
    set((s) => ({
      phase,
      phaseTimer: timer,
      nightResult: phase === "NIGHT" ? null : s.nightResult,
      voteResult: phase === "VOTING" ? null : s.voteResult,
      randomEvent: phase === "NIGHT" ? null : s.randomEvent,
    })),

  setTimer: (t) => set({ phaseTimer: t }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-200), msg] })),

  setNightResult: (nightResult) => set({ nightResult }),

  setVoteResult: (voteResult) => set({ voteResult }),

  setWinner: (winner, players) => set({ winner, players, phase: "FINISHED" }),

  setRandomEvent: (randomEvent) => set({ randomEvent }),

  updatePlayer: (id, data) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, ...data } : p)),
      myPlayer:
        s.myPlayer?.id === id ? { ...s.myPlayer, ...data } : s.myPlayer,
    })),

  removePlayer: (id) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

  addPlayer: (player) =>
    set((s) => ({
      players: s.players.find((p) => p.id === player.id)
        ? s.players
        : [...s.players, player],
    })),

  reset: () => set(initialState),
}));
