// ============================================================
// SERVIDOR SOCKET.IO — Lógica em memória (sem DB externo)
// ============================================================

import { createServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Player,
  GamePhase,
  NightAction,
  RoomInfo,
  PlayerRole,
} from "../lib/game.types";
import {
  assignRoles,
  resolveNightActions,
  resolveVotes,
  checkWinCondition,
  getRandomEvent,
  getNarratorMessage,
  generateRoomCode,
  generateId,
  PHASE_DURATIONS,
} from "../lib/gameEngine";

// ---- Estruturas em Memória ----
interface RoomState {
  code: string;
  hostId: string;
  players: Map<string, Player & { role: PlayerRole }>;
  phase: GamePhase;
  round: number;
  maxPlayers: number;
  isPrivate: boolean;
  nightActions: NightAction[];
  votes: Record<string, string>;
  phaseTimer: NodeJS.Timeout | null;
  reconnectTokens: Map<string, string>; // token -> playerId
}

const rooms = new Map<string, RoomState>();
const playerRoom = new Map<string, string>(); // socketId -> roomCode

// ---- Helpers ----
function getRoomPlayers(room: RoomState): Player[] {
  return Array.from(room.players.values()).map(({ role, ...p }) => ({  // eslint-disable-line @typescript-eslint/no-unused-vars
    ...p,
    role: undefined,
  }));
}

function getRoomInfo(room: RoomState): RoomInfo {
  return {
    code: room.code,
    hostId: room.hostId,
    players: getRoomPlayers(room),
    maxPlayers: room.maxPlayers,
    isPrivate: room.isPrivate,
    phase: room.phase,
  };
}

function broadcastRoom(io: Server, room: RoomState) {
  io.to(room.code).emit("room:updated", getRoomInfo(room));
}

function clearPhaseTimer(room: RoomState) {
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.phaseTimer = null;
}

// ---- Transição de Fases ----
function advancePhase(io: Server, room: RoomState) {
  clearPhaseTimer(room);

  const winner = checkWinCondition(Array.from(room.players.values()));
  if (winner) {
    room.phase = "FINISHED";
    const players = Array.from(room.players.values());
    io.to(room.code).emit("game:finished", { winner, players });
    return;
  }

  const transitions: Record<GamePhase, GamePhase> = {
    WAITING: "STARTING",
    STARTING: "NIGHT",
    NIGHT: "DAY",
    DAY: "VOTING",
    VOTING: "RESULT",
    RESULT: "NIGHT",
    FINISHED: "FINISHED",
  };

  const next = transitions[room.phase];
  room.phase = next;

  const duration = PHASE_DURATIONS[next];
  io.to(room.code).emit("game:phase_changed", { phase: next, timer: duration });

  // Narrador
  if (next === "DAY") {
    const nightResult = resolveNightActions(
      Array.from(room.players.values()),
      room.nightActions
    );
    if (nightResult.killedId) {
      const victim = room.players.get(nightResult.killedId);
      if (victim) victim.isAlive = false;
    }
    io.to(room.code).emit("game:night_result", nightResult);

    const event = getRandomEvent();
    if (event) io.to(room.code).emit("game:event", event);

    const msg = getNarratorMessage("DAY", nightResult);
    io.to(room.code).emit("chat:message", {
      id: generateId(),
      playerId: "narrator",
      playerNickname: "Narrador",
      content: msg,
      timestamp: Date.now(),
      type: "narrator",
    });

    room.nightActions = [];
    broadcastRoom(io, room);
  }

  if (next === "NIGHT") {
    room.votes = {};
    room.round++;
    io.to(room.code).emit("chat:message", {
      id: generateId(),
      playerId: "narrator",
      playerNickname: "Narrador",
      content: getNarratorMessage("NIGHT"),
      timestamp: Date.now(),
      type: "narrator",
    });
  }

  if (next === "VOTING") {
    io.to(room.code).emit("chat:message", {
      id: generateId(),
      playerId: "narrator",
      playerNickname: "Narrador",
      content: getNarratorMessage("VOTING"),
      timestamp: Date.now(),
      type: "narrator",
    });
  }

  if (next === "RESULT") {
    const voteResult = resolveVotes(Array.from(room.players.values()), room.votes);
    if (voteResult.eliminatedId) {
      const eliminated = room.players.get(voteResult.eliminatedId);
      if (eliminated) eliminated.isAlive = false;
    }
    io.to(room.code).emit("game:vote_result", voteResult);
    io.to(room.code).emit("chat:message", {
      id: generateId(),
      playerId: "narrator",
      playerNickname: "Narrador",
      content: getNarratorMessage("RESULT", voteResult),
      timestamp: Date.now(),
      type: "narrator",
    });
    broadcastRoom(io, room);
  }

  // Verificar vitória após result
  if (next === "RESULT") {
    const w = checkWinCondition(Array.from(room.players.values()));
    if (w) {
      setTimeout(() => {
        room.phase = "FINISHED";
        io.to(room.code).emit("game:finished", {
          winner: w,
          players: Array.from(room.players.values()),
        });
      }, 3000);
      return;
    }
  }

  if (duration > 0) {
    room.phaseTimer = setTimeout(() => advancePhase(io, room), duration * 1000);
  }
}

// ---- Iniciar Servidor ----
const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ---- Criar Sala ----
  socket.on("room:create", ({ nickname, avatar, maxPlayers, isPrivate }, cb) => {
    const code = generateRoomCode();
    const playerId = socket.id;

    const player: Player & { role: PlayerRole } = {
      id: playerId,
      nickname,
      avatar,
      role: "citizen",
      isAlive: true,
      isHost: true,
      isConnected: true,
      votedFor: null,
    };

    const room: RoomState = {
      code,
      hostId: playerId,
      players: new Map([[playerId, player]]),
      phase: "WAITING",
      round: 0,
      maxPlayers: Math.min(Math.max(maxPlayers, 4), 12),
      isPrivate,
      nightActions: [],
      votes: {},
      phaseTimer: null,
      reconnectTokens: new Map(),
    };

    rooms.set(code, room);
    playerRoom.set(playerId, code);
    socket.join(code);

    cb({ room: getRoomInfo(room), player: { ...player } });
  });

  // ---- Entrar em Sala ----
  socket.on("room:join", ({ code, nickname, avatar }, cb) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) return cb({ error: "Sala não encontrada." });
    if (room.phase !== "WAITING") return cb({ error: "Partida já iniciada." });
    if (room.players.size >= room.maxPlayers) return cb({ error: "Sala cheia." });

    const nameTaken = Array.from(room.players.values()).some(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
    );
    if (nameTaken) return cb({ error: "Nickname já está em uso nesta sala." });

    const player: Player & { role: PlayerRole } = {
      id: socket.id,
      nickname,
      avatar,
      role: "citizen",
      isAlive: true,
      isHost: false,
      isConnected: true,
      votedFor: null,
    };

    room.players.set(socket.id, player);
    playerRoom.set(socket.id, code.toUpperCase());
    socket.join(code.toUpperCase());

    socket.to(room.code).emit("room:player_joined", { ...player, role: undefined });
    cb({ room: getRoomInfo(room), player: { ...player } });
  });

  // ---- Sair da Sala ----
  socket.on("room:leave", () => {
    handleLeave(socket.id);
  });

  // ---- Iniciar Jogo ----
  socket.on("game:start", (cb) => {
    const code = playerRoom.get(socket.id);
    if (!code) return cb({ error: "Você não está em uma sala." });
    const room = rooms.get(code);
    if (!room) return cb({ error: "Sala não encontrada." });
    if (room.hostId !== socket.id) return cb({ error: "Somente o host pode iniciar." });
    if (room.players.size < 4) return cb({ error: "Mínimo de 4 jogadores." });
    if (room.phase !== "WAITING") return cb({ error: "Jogo já iniciado." });

    // Distribuir papéis
    const playerIds = Array.from(room.players.keys());
    const roles = assignRoles(playerIds.length);
    playerIds.forEach((id, i) => {
      const p = room.players.get(id)!;
      p.role = roles[i];
      // Avisar cada jogador seu papel individualmente
      io.to(id).emit("game:role_assigned", roles[i]);
    });

    // Revelar aliados para assassinos
    const killers = Array.from(room.players.values()).filter(
      (p) => p.role === "killer" || p.role === "accomplice"
    );
    if (killers.length > 1) {
      killers.forEach((k) => {
        const allies = killers.filter((a) => a.id !== k.id).map((a) => a.nickname);
        io.to(k.id).emit("chat:message", {
          id: generateId(),
          playerId: "system",
          playerNickname: "Sistema",
          content: `🔪 Seus aliados: ${allies.join(", ")}`,
          timestamp: Date.now(),
          type: "private",
        });
      });
    }

    room.phase = "STARTING";
    cb({ ok: true });
    advancePhase(io, room);
  });

  // ---- Ação Noturna ----
  socket.on("game:night_action", (data) => {
    const code = playerRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.phase !== "NIGHT") return;

    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    // Remover ação anterior do mesmo jogador
    room.nightActions = room.nightActions.filter((a) => a.playerId !== socket.id);
    room.nightActions.push({ ...data, playerId: socket.id });

    // Verificar se todos que têm ação já votaram
    const actionPlayers = Array.from(room.players.values()).filter(
      (p) =>
        p.isAlive &&
        (p.role === "killer" || p.role === "doctor" || p.role === "investigator")
    );
    if (room.nightActions.length >= actionPlayers.length) {
      clearPhaseTimer(room);
      advancePhase(io, room);
    }
  });

  // ---- Votar ----
  socket.on("game:vote", ({ targetId }) => {
    const code = playerRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.phase !== "VOTING") return;

    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    const target = room.players.get(targetId);
    if (!target || !target.isAlive) return;

    room.votes[socket.id] = targetId;

    const alivePlayers = Array.from(room.players.values()).filter((p) => p.isAlive);
    if (Object.keys(room.votes).length >= alivePlayers.length) {
      clearPhaseTimer(room);
      advancePhase(io, room);
    }
  });

  // ---- Chat ----
  socket.on("chat:send", ({ content, type }) => {
    const code = playerRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Chat público só durante o dia
    if (type === "public" && room.phase !== "DAY") return;

    // Chat privado só para assassinos durante a noite
    if (type === "private") {
      if (room.phase !== "NIGHT") return;
      if (player.role !== "killer" && player.role !== "accomplice") return;
    }

    const msg = {
      id: generateId(),
      playerId: socket.id,
      playerNickname: player.nickname,
      content: content.slice(0, 300),
      timestamp: Date.now(),
      type,
    };

    if (type === "public") {
      io.to(code).emit("chat:message", msg);
    } else {
      // Só para assassinos
      Array.from(room.players.values())
        .filter((p) => p.role === "killer" || p.role === "accomplice")
        .forEach((p) => io.to(p.id).emit("chat:message", msg));
    }
  });

  // ---- Kick ----
  socket.on("room:kick", ({ targetId }) => {
    const code = playerRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;

    room.players.delete(targetId);
    playerRoom.delete(targetId);
    io.to(room.code).emit("room:player_left", targetId);
    broadcastRoom(io, room);
  });

  // ---- Desconexão ----
  socket.on("disconnect", () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    handleLeave(socket.id, true);
  });

  function handleLeave(id: string, isDisconnect = false) {
    const code = playerRoom.get(id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (isDisconnect) {
      const p = room.players.get(id);
      if (p) {
        p.isConnected = false;
        io.to(code).emit("player:disconnected", id);
        broadcastRoom(io, room);
        return;
      }
    }

    room.players.delete(id);
    playerRoom.delete(id);
    io.to(code).emit("room:player_left", id);

    if (room.players.size === 0) {
      clearPhaseTimer(room);
      rooms.delete(code);
      return;
    }

    // Transferir host
    if (room.hostId === id) {
      const next = Array.from(room.players.keys())[0];
      room.hostId = next;
      const p = room.players.get(next);
      if (p) p.isHost = true;
    }

    broadcastRoom(io, room);
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`🔌 Socket.IO server running on port ${PORT}`);
});
