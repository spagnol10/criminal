"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { connectSocket } from "../socket/client";
import { useGameStore } from "../store/gameStore";
import {
  playJoin, playGameStart, playNight, playDay,
  playEliminated, playVictory, playDefeat, playTick, playMessage,
} from "../utils/sounds";

export function useSocketEvents() {
  const router = useRouter();
  const store = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = connectSocket();

    socket.on("room:updated", store.setRoom);
    socket.on("room:player_joined", (p) => { store.addPlayer(p); playJoin(); });
    socket.on("room:player_left", store.removePlayer);

    socket.on("game:phase_changed", ({ phase, timer }) => {
      store.setPhase(phase, timer);
      if (phase === "STARTING") playGameStart();
      else if (phase === "NIGHT")   playNight();
      else if (phase === "DAY")     playDay();
    });
    socket.on("game:role_assigned", store.setMyRole);
    socket.on("game:night_result", (r) => { store.setNightResult(r); if (r.killedId) playEliminated(); });
    socket.on("game:vote_result", (r) => { store.setVoteResult(r); playEliminated(); });
    socket.on("game:event", (e) => store.setRandomEvent(e));
    // v2 new events
    socket.on("game:evidence", (ev) => store.addEvidence(ev));
    socket.on("game:suspicion_update", (profiles) => store.setSuspicionProfiles(profiles));
    socket.on("game:map", (map) => store.setGameMap(map));

    socket.on("game:finished", ({ winner, players }) => {
      store.setWinner(winner, players);
      const myRole = useGameStore.getState().myRole;
      const killerRoles = ["killer","accomplice","manipulator","silentKiller","corruptCop"];
      const myTeam = myRole
        ? (killerRoles.includes(myRole) ? "killers" : "innocents")
        : null;
      if (myTeam === winner) playVictory(); else playDefeat();
    });

    socket.on("chat:message", (m) => { store.addMessage(m); playMessage(); });

    socket.on("player:disconnected", (id) =>
      store.updatePlayer(id, { isConnected: false })
    );
    socket.on("player:reconnected", (id) =>
      store.updatePlayer(id, { isConnected: true })
    );

    socket.on("error", (msg) => console.error("[Socket Error]", msg));

    return () => {
      socket.off("room:updated");
      socket.off("room:player_joined");
      socket.off("room:player_left");
      socket.off("game:phase_changed");
      socket.off("game:role_assigned");
      socket.off("game:night_result");
      socket.off("game:vote_result");
      socket.off("game:event");
      socket.off("game:evidence");
      socket.off("game:suspicion_update");
      socket.off("game:map");
      socket.off("game:finished");
      socket.off("chat:message");
      socket.off("player:disconnected");
      socket.off("player:reconnected");
      socket.off("error");
      initialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegar conforme fase muda
  const phase = useGameStore((s) => s.phase);
  const roomCode = useGameStore((s) => s.roomCode);

  useEffect(() => {
    if (!roomCode) return;
    if (phase === "WAITING") router.push(`/lobby/${roomCode}`);
    else if (phase === "FINISHED") router.push(`/result/${roomCode}`);
    else if (["NIGHT", "DAY", "VOTING", "RESULT", "STARTING"].includes(phase))
      router.push(`/game/${roomCode}`);
  }, [phase, roomCode, router]);
}

export function usePhaseTimer() {
  const setTimer = useGameStore((s) => s.setTimer);
  const timer = useGameStore((s) => s.phaseTimer);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      const next = Math.max(0, timer - 1);
      setTimer(next);
      if (next > 0 && next <= 10) playTick();
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, setTimer]);

  return timer;
}
