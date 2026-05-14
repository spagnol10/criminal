// ============================================================
// SERVIDOR SOCKET.IO v2 — Autoritativo, Modular, Anti-Cheat
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
  generateRoomCode,
  generateId,
  PHASE_DURATIONS,
  getRandomMap,
  generateEvidence,
  ROLE_TEAM,
} from "../lib/gameEngine";
import {
  RoomState,
  createPlayer,
  projectVisibleState,
  getAlivePlayers,
} from "./engine/stateManager";
import {
  validateNightAction,
  validateVote,
  validateChat,
  validateAbility,
  tickCooldowns,
  recordAction,
} from "./engine/antiCheat";
import {
  // applySuspicion is used in suspicionEngine internally
  analyzeVotesPostRound,
  analyzeSilentPlayers,
  getTopSuspects,
} from "./engine/suspicionEngine";
import {
  generateNarration,
  buildNarratorContext,
} from "./engine/narratorEngine";
import {
  initReplay,
  recordReplayEvent,
  finalizeReplay,
  getReplay,
} from "./engine/replayEngine";

// ---- Memória ------------------------------------------------
const rooms = new Map<string, RoomState>();
const playerRoom = new Map<string, string>(); // socketId -> roomCode

// ---- Helpers ------------------------------------------------
function getRoomInfo(room: RoomState): RoomInfo {
  return {
    code: room.code,
    hostId: room.hostId,
    players: projectVisibleState(room) as unknown as Player[],
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

function sendNarration(io: Server, room: RoomState, lines: string[]) {
  lines.forEach((line) => {
    io.to(room.code).emit("chat:message", {
      id: generateId(),
      playerId: "narrator",
      playerNickname: "Narrador",
      content: line,
      timestamp: Date.now(),
      type: "narrator",
    });
  });
}

// ---- Transição de Fases ------------------------------------
function advancePhase(io: Server, room: RoomState) {
  clearPhaseTimer(room);

  const winner = checkWinCondition(Array.from(room._players.values()));
  if (winner) {
    room.phase = "FINISHED";
    const players = Array.from(room._players.values());

    // Finalizar replay
    const finalRoles: Record<string, PlayerRole> = {};
    players.forEach((p) => { finalRoles[p.id] = p.role; });
    const replay = finalizeReplay(room.code, winner, finalRoles);

    io.to(room.code).emit("game:finished", { winner, players });
    if (replay) io.to(room.code).emit("game:replay" as never, replay);
    return;
  }

  const transitions: Record<GamePhase, GamePhase> = {
    WAITING: "STARTING", STARTING: "NIGHT",
    NIGHT: "DAY", DAY: "VOTING",
    VOTING: "RESULT", RESULT: "NIGHT", FINISHED: "FINISHED",
  };
  const next = transitions[room.phase];
  room.phase = next;

  const duration = PHASE_DURATIONS[next];
  io.to(room.code).emit("game:phase_changed", { phase: next, timer: duration });

  recordReplayEvent(room.code, {
    ts: Date.now(), round: room.round, phase: next,
    type: "phase_change", meta: { duration },
  });

  // ── NIGHT ──────────────────────────────────────────────────
  if (next === "NIGHT") {
    room.votes = {};
    room.round++;
    room.chatCount = {};
    tickCooldowns(room);

    sendNarration(io, room, generateNarration(
      buildNarratorContext(room, "NIGHT")
    ));
  }

  // ── DAY ────────────────────────────────────────────────────
  if (next === "DAY") {
    // Resolução noturna
    const activeEventIds = room.activeEventIds;
    const nightResult = resolveNightActions(
      Array.from(room._players.values()),
      room.nightActions,
      activeEventIds,
    );

    // Aplicar morte
    if (nightResult.killedId) {
      const victim = room._players.get(nightResult.killedId);
      if (victim) {
        victim.isAlive = false;
        recordReplayEvent(room.code, {
          ts: Date.now(), round: room.round, phase: "DAY",
          type: "player_killed",
          targetId: victim.id, targetNickname: victim.nickname,
        });
      }
    }

    io.to(room.code).emit("game:night_result", nightResult);

    // Evidências procedurais
    const evidence = generateEvidence(
      Array.from(room._players.values()),
      nightResult.killedId,
      room.round,
    );
    evidence.forEach((ev) => {
      room.evidence.push(ev);
      io.to(room.code).emit("game:evidence" as never, ev);
      recordReplayEvent(room.code, {
        ts: Date.now(), round: room.round, phase: "DAY",
        type: "evidence_found", meta: { evidenceType: ev.type, isFake: ev.isFake },
      });
    });

    // Evento dinâmico
    const event = getRandomEvent();
    if (event) {
      room.activeEventIds = [event.id];
      io.to(room.code).emit("game:event", event);
      recordReplayEvent(room.code, {
        ts: Date.now(), round: room.round, phase: "DAY",
        type: "event_triggered", meta: { eventId: event.id, eventTitle: event.title },
      });
    } else {
      room.activeEventIds = [];
    }

    // Suspicion: analisar silêncio
    analyzeSilentPlayers(room, room.round);

    // Emitir suspicion update
    const suspicionData = Array.from(room._players.values()).map((p) => ({
      playerId: p.id, score: room.suspicionProfiles.get(p.id) ?? 0,
    }));
    io.to(room.code).emit("game:suspicion_update" as never, suspicionData);

    // Narrador contextual
    const topSuspects = getTopSuspects(room, 2);
    const nicknames = new Map<string, string>();
    for (const [id, p] of room._players.entries()) nicknames.set(id, p.nickname);

    const narCtx = buildNarratorContext(room, "DAY", {
      killedNickname: nightResult.killedNickname,
      savedNickname: nightResult.savedId
        ? (room._players.get(nightResult.savedId)?.nickname ?? null)
        : null,
      activeEventTitle: event?.title ?? null,
      topSuspects,
      playerNicknames: nicknames,
    });
    sendNarration(io, room, generateNarration(narCtx));

    room.nightActions = [];
    broadcastRoom(io, room);
  }

  // ── VOTING ─────────────────────────────────────────────────
  if (next === "VOTING") {
    sendNarration(io, room, generateNarration(
      buildNarratorContext(room, "VOTING")
    ));
  }

  // ── RESULT ─────────────────────────────────────────────────
  if (next === "RESULT") {
    const roundVotes = { ...room.votes };
    const voteResult = resolveVotes(Array.from(room._players.values()), room.votes);

    if (voteResult.eliminatedId) {
      const eliminated = room._players.get(voteResult.eliminatedId);
      if (eliminated) {
        // Fantasma: 50% chance de reviver
        if (eliminated.role === "ghost" && !eliminated.hasUsedAbility && Math.random() < 0.5) {
          eliminated.hasUsedAbility = true;
          sendNarration(io, room, [
            `👻 ${eliminated.nickname} voltou dos mortos! O Fantasma ressuscitou!`
          ]);
        } else {
          eliminated.isAlive = false;
          recordReplayEvent(room.code, {
            ts: Date.now(), round: room.round, phase: "RESULT",
            type: "player_eliminated",
            targetId: eliminated.id, targetNickname: eliminated.nickname,
            meta: { role: eliminated.role, votes: voteResult.tallies },
          });
        }
      }
    }

    io.to(room.code).emit("game:vote_result", voteResult);

    // Análise de votos pós-rodada (suspicion)
    const killerIds = new Set(
      Array.from(room._players.values())
        .filter((p) => ROLE_TEAM[p.role] === "killers")
        .map((p) => p.id)
    );
    analyzeVotesPostRound(room, killerIds, roundVotes, voteResult.eliminatedId, room.round);

    // Narrador resultado
    const nicknames = new Map<string, string>();
    for (const [id, p] of room._players.entries()) nicknames.set(id, p.nickname);
    const narCtx = buildNarratorContext(room, "RESULT", {
      eliminatedNickname: voteResult.eliminatedNickname,
      eliminatedRole: voteResult.eliminatedRole as PlayerRole | null,
      wasTie: voteResult.wasTie,
      playerNicknames: nicknames,
    });
    sendNarration(io, room, generateNarration(narCtx));
    broadcastRoom(io, room);

    // Verificar vitória após eliminação
    const w = checkWinCondition(Array.from(room._players.values()));
    if (w) {
      setTimeout(() => {
        room.phase = "FINISHED";
        const finalRoles: Record<string, PlayerRole> = {};
        Array.from(room._players.values()).forEach((p) => { finalRoles[p.id] = p.role; });
        const replay = finalizeReplay(room.code, w, finalRoles);
        io.to(room.code).emit("game:finished", {
          winner: w,
          players: Array.from(room._players.values()),
        });
        if (replay) io.to(room.code).emit("game:replay" as never, replay);
      }, 3500);
      return;
    }
  }

  if (duration > 0) {
    room.phaseTimer = setTimeout(() => advancePhase(io, room), duration * 1000);
  }
}

// ---- Socket Server -----------------------------------------
const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Criar Sala ─────────────────────────────────────────────
  socket.on("room:create", ({ nickname, avatar, maxPlayers, isPrivate }, cb) => {
    const code = generateRoomCode();
    const player = createPlayer(socket.id, nickname, avatar, true);

    const room: RoomState = {
      code,
      hostId: socket.id,
      _players: new Map([[socket.id, player]]),
      phase: "WAITING",
      round: 0,
      maxPlayers: Math.min(Math.max(maxPlayers, 4), 12),
      isPrivate,
      nightActions: [],
      votes: {},
      phaseTimer: null,
      evidence: [],
      suspicionProfiles: new Map(),
      matchEvents: [],
      map: getRandomMap(),
      activeEventIds: [],
      voteHistory: {},
      chatCount: {},
      roundStartedAt: Date.now(),
      lastActionTimes: new Map(),
      reconnectTokens: new Map(),
    };

    rooms.set(code, room);
    playerRoom.set(socket.id, code);
    socket.join(code);
    cb({ room: getRoomInfo(room), player: player as unknown as Player });
  });

  // ── Entrar em Sala ─────────────────────────────────────────
  socket.on("room:join", ({ code, nickname, avatar }, cb) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) return cb({ error: "Sala não encontrada." });
    if (room.phase !== "WAITING") return cb({ error: "Partida já iniciada." });
    if (room._players.size >= room.maxPlayers) return cb({ error: "Sala cheia." });
    if (Array.from(room._players.values()).some((p) => p.nickname.toLowerCase() === nickname.toLowerCase()))
      return cb({ error: "Nickname já em uso." });

    const player = createPlayer(socket.id, nickname, avatar, false);
    room._players.set(socket.id, player);
    playerRoom.set(socket.id, code.toUpperCase());
    socket.join(code.toUpperCase());

    socket.to(room.code).emit("room:player_joined", player as unknown as Player);
    cb({ room: getRoomInfo(room), player: player as unknown as Player });
  });

  // ── Sair da Sala ───────────────────────────────────────────
  socket.on("room:leave", () => handleLeave(socket.id));

  // ── Iniciar Jogo ───────────────────────────────────────────
  socket.on("game:start", (cb) => {
    const code = playerRoom.get(socket.id);
    if (!code) return cb({ error: "Não está em sala." });
    const room = rooms.get(code);
    if (!room) return cb({ error: "Sala não encontrada." });
    if (room.hostId !== socket.id) return cb({ error: "Somente o host pode iniciar." });
    if (room._players.size < 4) return cb({ error: "Mínimo de 4 jogadores." });
    if (room.phase !== "WAITING") return cb({ error: "Jogo já iniciado." });

    // Distribuir papéis
    const playerIds = Array.from(room._players.keys());
    const roles = assignRoles(playerIds.length);
    playerIds.forEach((id, i) => {
      const p = room._players.get(id)!;
      p.role = roles[i];
      io.to(id).emit("game:role_assigned", roles[i]);
      room.suspicionProfiles.set(id, 0);
    });

    // Revelar aliados entre killers
    const killers = Array.from(room._players.values()).filter(
      (p) => ["killer","accomplice","manipulator","silentKiller","corruptCop"].includes(p.role)
    );
    if (killers.length > 1) {
      killers.forEach((k) => {
        const allies = killers
          .filter((a) => a.id !== k.id)
          .map((a) => `${a.nickname} (${a.role})`);
        io.to(k.id).emit("chat:message", {
          id: generateId(), playerId: "system", playerNickname: "Sistema",
          content: `🔪 Seus aliados: ${allies.join(", ")}`,
          timestamp: Date.now(), type: "private",
        });
      });
    }

    // Enviar mapa
    if (room.map) io.to(room.code).emit("game:map", room.map);

    // Init replay
    initReplay(room.code);
    recordReplayEvent(room.code, {
      ts: Date.now(), round: 0, phase: "STARTING",
      type: "game_started", meta: { playerCount: playerIds.length },
    });

    room.phase = "STARTING";
    cb({ ok: true });
    advancePhase(io, room);
  });

  // ── Ação Noturna ───────────────────────────────────────────
  socket.on("game:night_action", (data) => {
    const room = rooms.get(playerRoom.get(socket.id) ?? "");
    if (!room) return;

    const validation = validateNightAction(room, socket.id, (data as NightAction).targetId);
    if (!validation.ok) {
      socket.emit("error", validation.reason ?? "Ação inválida.");
      return;
    }

    recordAction(room, socket.id);
    room.nightActions = room.nightActions.filter((a) => a.playerId !== socket.id);
    room.nightActions.push({ ...data, playerId: socket.id });

    recordReplayEvent(room.code, {
      ts: Date.now(), round: room.round, phase: "NIGHT",
      type: "night_action",
      actorId: socket.id, targetId: (data as NightAction).targetId,
      meta: { action: (data as NightAction).action },
    });

    // Todos os que podem agir já agiram?
    const ACTION_ROLES: PlayerRole[] = ["killer","silentKiller","doctor","investigator","hacker","spy","corruptCop"];
    const actionPlayers = Array.from(room._players.values()).filter(
      (p) => p.isAlive && !p.isSpectator && ACTION_ROLES.includes(p.role)
    );
    if (room.nightActions.length >= actionPlayers.length) {
      clearPhaseTimer(room);
      advancePhase(io, room);
    }
  });

  // ── Votar ──────────────────────────────────────────────────
  socket.on("game:vote", ({ targetId }) => {
    const room = rooms.get(playerRoom.get(socket.id) ?? "");
    if (!room) return;

    const validation = validateVote(room, socket.id, targetId);
    if (!validation.ok) { socket.emit("error", validation.reason ?? "Voto inválido."); return; }

    recordAction(room, socket.id);
    room.votes[socket.id] = targetId;

    // Track vote history para suspicion
    if (!room.voteHistory[socket.id]) room.voteHistory[socket.id] = [];
    room.voteHistory[socket.id].push(targetId);

    recordReplayEvent(room.code, {
      ts: Date.now(), round: room.round, phase: "VOTING",
      type: "player_voted", actorId: socket.id, targetId,
    });

    const alive = getAlivePlayers(room);
    if (Object.keys(room.votes).length >= alive.length) {
      clearPhaseTimer(room);
      advancePhase(io, room);
    }
  });

  // ── Chat ───────────────────────────────────────────────────
  socket.on("chat:send", ({ content, type }) => {
    const room = rooms.get(playerRoom.get(socket.id) ?? "");
    if (!room) return;

    const validation = validateChat(room, socket.id, type as "public" | "private" | "whisper");
    if (!validation.ok) { socket.emit("error", validation.reason ?? "Chat inválido."); return; }

    room.chatCount[socket.id] = (room.chatCount[socket.id] ?? 0) + 1;

    const player = room._players.get(socket.id);
    if (!player) return;

    const msg = {
      id: generateId(), playerId: socket.id,
      playerNickname: player.nickname,
      content: content.slice(0, 300),
      timestamp: Date.now(), type,
    };

    if (type === "public") {
      io.to(room.code).emit("chat:message", msg);
    } else if (type === "whisper") {
      socket.emit("chat:message", msg);
    } else {
      // Chat dos assassinos
      Array.from(room._players.values())
        .filter((p) => ["killer","accomplice","manipulator","silentKiller","corruptCop"].includes(p.role))
        .forEach((p) => io.to(p.id).emit("chat:message", msg));
    }
  });

  // ── Usar Habilidade ────────────────────────────────────────
  socket.on("game:use_ability", () => {
    const room = rooms.get(playerRoom.get(socket.id) ?? "");
    if (!room) return;

    const validation = validateAbility(room, socket.id);
    if (!validation.ok) { socket.emit("error", validation.reason ?? "Habilidade inválida."); return; }

    const player = room._players.get(socket.id)!;

    if (player.role === "survivor") {
      player.hasUsedAbility = true;
      player.abilityCooldown = 2;
      io.to(socket.id).emit("chat:message", {
        id: generateId(), playerId: "system", playerNickname: "Sistema",
        content: "🛡️ Escudo ativado! Você está protegido nesta noite.",
        timestamp: Date.now(), type: "private",
      });
    } else if (player.role === "informant") {
      const killer = Array.from(room._players.values()).find(
        (p) => p.role === "killer" || p.role === "silentKiller"
      );
      player.hasUsedAbility = true;
      if (killer) {
        io.to(socket.id).emit("chat:message", {
          id: generateId(), playerId: "system", playerNickname: "Sistema",
          content: `📡 Infiltração: o assassino é **${killer.nickname}**!`,
          timestamp: Date.now(), type: "private",
        });
      }
    }

    recordReplayEvent(room.code, {
      ts: Date.now(), round: room.round, phase: room.phase,
      type: "ability_used", actorId: socket.id, meta: { role: player.role },
    });
  });

  // ── Obter Replay ───────────────────────────────────────────
  socket.on("room:leave", () => {}); // já tratado acima
  socket.on("room:kick", ({ targetId }) => {
    const room = rooms.get(playerRoom.get(socket.id) ?? "");
    if (!room || room.hostId !== socket.id) return;
    room._players.delete(targetId);
    playerRoom.delete(targetId);
    io.to(room.code).emit("room:player_left", targetId);
    broadcastRoom(io, room);
  });

  // Expor replay ao finalizar
  socket.on("game:get_replay" as never, (code: string) => {
    const replay = getReplay(code);
    if (replay) socket.emit("game:replay", replay);
  });

  // ── Desconexão ─────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id}`);
    handleLeave(socket.id, true);
  });

  function handleLeave(id: string, isDisconnect = false) {
    const code = playerRoom.get(id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (isDisconnect) {
      const p = room._players.get(id);
      if (p) {
        p.isConnected = false;
        io.to(code).emit("player:disconnected", id);
        broadcastRoom(io, room);
        return;
      }
    }

    room._players.delete(id);
    playerRoom.delete(id);
    io.to(code).emit("room:player_left", id);

    if (room._players.size === 0) {
      clearPhaseTimer(room);
      rooms.delete(code);
      return;
    }

    if (room.hostId === id) {
      const next = Array.from(room._players.keys())[0];
      room.hostId = next;
      const p = room._players.get(next);
      if (p) p.isHost = true;
    }
    broadcastRoom(io, room);
  }
});

const PORT = parseInt(process.env.PORT ?? process.env.SOCKET_PORT ?? "3001");
httpServer.listen(PORT, () => console.log(`🔌 Socket.IO server on :${PORT}`));
