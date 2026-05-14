"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  initSoloGame, getBotNightAction, getBotVote, getBotChatMessages,
  updateSuspicionSolo, narratorMessage,
  type SoloGameState, type BotPlayer, type SoloMessage,
} from "../../lib/utils/soloGame";
import {
  resolveNightActions, resolveVotes, checkWinCondition,
  getRandomEvent, generateEvidence, ROLE_NAMES, ROLE_ICONS, ROLE_TEAM, ROLE_DEFS,
} from "../../lib/utils/gameEngine";
import type { NightAction, PlayerRole } from "../../lib/types/game";
import { RoleRevealCard } from "../../components/game";
import {
  playGameStart, playNight, playDay, playVote,
  playEliminated, playVictory, playDefeat, playMessage,
} from "../../lib/utils/sounds";
import { recordMatch } from "../../lib/utils/score";

const PHASE_DURATION = { night: 40, day: 30, voting: 25, result: 6 };

// ─────────────────────────────────────────────────────────────
export default function SoloPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<"setup" | "game">("setup");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("🕵️");
  const [botCount, setBotCount] = useState(5);

  const AVATARS = ["🕵️","👮","🧑‍⚕️","👩‍🔬","🧑‍💼","👩‍💻","🧙","👺","🎭","🦹","🕶️","🥷"];

  if (screen === "game") {
    return <SoloGame nickname={nickname || "Jogador"} avatar={avatar} botCount={botCount} onExit={() => router.push("/")} />;
  }

  return (
    <main className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Modo Solo</h1>
          <p className="text-gray-500 text-sm mt-2">Jogue contra bots inteligentes</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Seu Nickname</label>
            <input
              className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 transition-all font-mono text-sm"
              placeholder="Ex: Detetive Silva"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Avatar</p>
            <div className="grid grid-cols-6 gap-1.5">
              {AVATARS.map((a) => (
                <motion.button key={a} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setAvatar(a)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    avatar === a ? "bg-red-900/50 border border-red-500/60" : "bg-[#0B0F19] border border-white/6 hover:border-white/20"
                  }`}
                >{a}</motion.button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">
              Bots — <span className="text-white font-mono">{botCount}</span>
            </p>
            <input type="range" min={3} max={11} value={botCount}
              onChange={(e) => setBotCount(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono"><span>3</span><span>11</span></div>
            <p className="text-xs text-gray-600 mt-1">Total: {botCount + 1} jogadores</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setScreen("game")}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-900/30 glow-red"
          >
            🎮 Iniciar Partida Solo
          </motion.button>

          <button onClick={() => router.push("/")}
            className="w-full text-gray-600 hover:text-gray-400 text-xs uppercase tracking-widest py-2 transition-colors">
            ← Voltar
          </button>
        </div>
      </motion.div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// SOLO GAME ENGINE COMPONENT
// ─────────────────────────────────────────────────────────────
function SoloGame({ nickname, avatar, botCount, onExit }: {
  nickname: string; avatar: string; botCount: number; onExit: () => void;
}) {
  const [gs, setGs] = useState<SoloGameState>(() => initSoloGame(nickname, avatar, botCount));
  const [timer, setTimer] = useState(0);
  const [showRole, setShowRole] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(gs.phase);
  phaseRef.current = gs.phase;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gs.messages]);

  // ── Adicionar mensagem ──────────────────────────────────────
  const addMsg = useCallback((msg: Omit<SoloMessage, "id" | "timestamp">) => {
    setGs((s) => ({
      ...s,
      messages: [...s.messages.slice(-150), { ...msg, id: generateId(), timestamp: Date.now() }],
    }));
  }, []);

  function generateId() {
    return Math.random().toString(36).slice(2, 10);
  }

  // ── Avançar fase ───────────────────────────────────────────
  const advancePhase = useCallback((state: SoloGameState): SoloGameState => {
    const next = (s: SoloGameState): SoloGameState => {
      const alive = s.players.filter((p) => p.isAlive);

      // Verificar vitória
      const winner = checkWinCondition(alive);
      if (winner) {
        const myTeam = ROLE_TEAM[s.myPlayer.role];
        const won = myTeam === winner || winner === "neutral";
        const teamAsKey = (myTeam === "killers" || myTeam === "innocents") ? myTeam : "innocents";
        recordMatch({ role: s.myPlayer.role, team: teamAsKey, winner: winner as "killers" | "innocents" | "draw", won, players: s.players.length });
        if (won) playVictory(); else playDefeat();
        return { ...s, phase: "finished", winner };
      }

      // Night → Day
      if (s.phase === "night") {
        const actions: NightAction[] = [];
        // Ações dos bots
        s.players.filter((p): p is BotPlayer => (p as BotPlayer).isBot && p.isAlive).forEach((bot) => {
          const action = getBotNightAction(bot, s.players);
          if (action) actions.push({ ...action, playerId: bot.id } as NightAction);
        });
        // Ação do jogador (já foi escolhida via selectedTarget)
        // Se o jogador tem papel com ação noturna e não agiu: pula
        const nightResult = resolveNightActions(alive, actions, []);

        let newPlayers = s.players.map((p) =>
          p.id === nightResult.killedId ? { ...p, isAlive: false } : p
        );

        const evidence = generateEvidence(newPlayers, nightResult.killedId, s.round);
        const event = getRandomEvent();
        const msgs: SoloMessage[] = [
          {
            id: generateId(), from: "narrator", nickname: "Narrador",
            content: narratorMessage("day", {
              killedName: nightResult.killedNickname ?? undefined,
            }),
            type: "narrator", timestamp: Date.now(),
          },
        ];
        if (event) msgs.push({
          id: generateId(), from: "system", nickname: "Sistema",
          content: `⚡ ${event.title}: ${event.description}`,
          type: "system", timestamp: Date.now() + 100,
        });

        // Bots chatam
        const botMsgs = getBotChatMessages(
          newPlayers.filter((p): p is BotPlayer => !!(p as BotPlayer).isBot),
          s.round, nightResult,
        );

        playDay();
        return {
          ...s,
          phase: "day",
          players: newPlayers,
          nightResult,
          evidence: [...s.evidence, ...evidence],
          randomEvent: event,
          messages: [...s.messages, ...msgs, ...botMsgs].slice(-150),
        };
      }

      // Day → Voting
      if (s.phase === "day") {
        addMsg({ from: "narrator", nickname: "Narrador", content: narratorMessage("voting"), type: "narrator" });
        playVote();
        return { ...s, phase: "voting", nightResult: null };
      }

      // Voting → Result
      if (s.phase === "voting") {
        // Coletar votos dos bots
        const votes: Record<string, string> = {};
        s.players.filter((p): p is BotPlayer => !!(p as BotPlayer).isBot && p.isAlive).forEach((bot) => {
          const vote = getBotVote(bot, s.players, s.suspicionScores);
          if (vote) votes[bot.id] = vote;
        });
        // Voto do jogador humano
        if (myVote) votes[s.myPlayer.id] = myVote;

        const voteResult = resolveVotes(alive, votes);
        const newSuspicion = updateSuspicionSolo(s.suspicionScores, s.players, votes);

        let newPlayers = s.players.map((p) => {
          if (p.id === voteResult.eliminatedId) {
            // Fantasma: 50% chance de reviver
            if (p.role === "ghost" && !(p as BotPlayer).hasUsedAbility && Math.random() < 0.5) {
              return { ...p, hasUsedAbility: true };
            }
            return { ...p, isAlive: false };
          }
          return p;
        });

        playEliminated();
        const resultMsg = narratorMessage("result", {
          eliminatedName: voteResult.eliminatedNickname ?? undefined,
          role: voteResult.eliminatedRole ? ROLE_NAMES[voteResult.eliminatedRole as PlayerRole] : undefined,
          wasTie: voteResult.wasTie,
        });

        addMsg({ from: "narrator", nickname: "Narrador", content: resultMsg, type: "narrator" });

        // Top suspeitos
        const topSuspects = Object.entries(newSuspicion)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id, score]) => ({
            id, score,
            nickname: newPlayers.find((p) => p.id === id)?.nickname ?? "?",
          }));

        return {
          ...s,
          phase: "result",
          players: newPlayers,
          voteResult,
          suspicionScores: newSuspicion,
          topSuspects,
        };
      }

      // Result → Night
      if (s.phase === "result") {
        const newRound = s.round + 1;
        addMsg({ from: "narrator", nickname: "Narrador", content: narratorMessage("night"), type: "narrator" });
        playNight();
        return { ...s, phase: "night", round: newRound, voteResult: null };
      }

      return s;
    };

    return next(state);
  }, [addMsg, myVote]);

  // ── Timer automático ───────────────────────────────────────
  useEffect(() => {
    if (showRole || gs.phase === "finished" || gs.phase === "setup") return;

    const durations: Record<string, number> = PHASE_DURATION;
    const dur = durations[gs.phase] ?? 0;
    if (!dur) return;

    setTimer(dur);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Auto avançar (exceto se aguardando input do jogador em voting)
          if (phaseRef.current !== "voting" || myVote) {
            setGs((s) => advancePhase(s));
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [gs.phase, showRole, advancePhase, myVote]);

  // ── Iniciar jogo após reveal ───────────────────────────────
  useEffect(() => {
    if (!showRole) {
      playGameStart();
      setTimeout(() => {
        addMsg({ from: "narrator", nickname: "Narrador", content: narratorMessage("night"), type: "narrator" });
        playNight();
        setGs((s) => ({ ...s, phase: "night", round: 1 }));
      }, 500);
    }
  }, [showRole, addMsg]);

  // ── Ação noturna do jogador ────────────────────────────────
  function handleNightAction() {
    if (!selectedTarget) return;
    const myRole = gs.myPlayer.role;
    const actionMap: Partial<Record<PlayerRole, string>> = {
      killer: "kill", silentKiller: "kill", doctor: "save",
      investigator: "investigate", hacker: "hack", spy: "spy", corruptCop: "corrupt",
    };
    const action = actionMap[myRole];
    if (!action) return;

    // Processar ação + avançar
    const actions: NightAction[] = [{
      playerId: gs.myPlayer.id,
      action: action as NightAction["action"],
      targetId: selectedTarget,
    }];
    // Bots agem também
    gs.players.filter((p): p is BotPlayer => !!(p as BotPlayer).isBot && p.isAlive).forEach((bot) => {
      const a = getBotNightAction(bot, gs.players);
      if (a) actions.push({ ...a, playerId: bot.id } as NightAction);
    });

    const nightResult = resolveNightActions(gs.players.filter((p) => p.isAlive), actions, []);
    let newPlayers = gs.players.map((p) =>
      p.id === nightResult.killedId ? { ...p, isAlive: false } : p
    );

    // Resultado de investigação
    if (action === "investigate" && nightResult.investigationResult) {
      const inv = nightResult.investigationResult;
      addMsg({
        from: "system", nickname: "Sistema",
        content: `🔍 Investigação: ${inv.targetNickname} é ${inv.isKiller ? "🔴 ASSASSINO" : "🔵 Inocente"} (${ROLE_NAMES[inv.role as PlayerRole]})`,
        type: "system",
      });
    }

    const evidence = generateEvidence(newPlayers, nightResult.killedId, gs.round);
    const event = getRandomEvent();
    const msgs: SoloMessage[] = [{
      id: Math.random().toString(36).slice(2), from: "narrator", nickname: "Narrador",
      content: narratorMessage("day", { killedName: nightResult.killedNickname ?? undefined }),
      type: "narrator", timestamp: Date.now(),
    }];
    if (event) msgs.push({
      id: Math.random().toString(36).slice(2), from: "system", nickname: "Sistema",
      content: `⚡ ${event.title}: ${event.description}`,
      type: "system", timestamp: Date.now() + 100,
    });

    const botMsgs = getBotChatMessages(
      newPlayers.filter((p): p is BotPlayer => !!(p as BotPlayer).isBot),
      gs.round, nightResult,
    );

    playDay();
    setGs((s) => ({
      ...s,
      phase: "day",
      players: newPlayers,
      nightResult,
      evidence: [...s.evidence, ...evidence],
      randomEvent: event,
      messages: [...s.messages, ...msgs, ...botMsgs].slice(-150),
    }));
    setSelectedTarget(null);
  }

  // ── Votar ──────────────────────────────────────────────────
  function handleVote() {
    if (!myVote) return;
    const votes: Record<string, string> = { [gs.myPlayer.id]: myVote };
    gs.players.filter((p): p is BotPlayer => !!(p as BotPlayer).isBot && p.isAlive).forEach((bot) => {
      const vote = getBotVote(bot, gs.players, gs.suspicionScores);
      if (vote) votes[bot.id] = vote;
    });

    const alive = gs.players.filter((p) => p.isAlive);
    const voteResult = resolveVotes(alive, votes);
    const newSuspicion = updateSuspicionSolo(gs.suspicionScores, gs.players, votes);

    let newPlayers = gs.players.map((p) => {
      if (p.id === voteResult.eliminatedId) {
        if (p.role === "ghost" && !(p as BotPlayer).hasUsedAbility && Math.random() < 0.5) {
          addMsg({ from: "system", nickname: "Sistema", content: `👻 ${p.nickname} ressuscitou! O Fantasma voltou!`, type: "system" });
          return { ...p, hasUsedAbility: true };
        }
        return { ...p, isAlive: false };
      }
      return p;
    });

    playEliminated();
    const resultMsg = narratorMessage("result", {
      eliminatedName: voteResult.eliminatedNickname ?? undefined,
      role: voteResult.eliminatedRole ? ROLE_NAMES[voteResult.eliminatedRole as PlayerRole] : undefined,
      wasTie: voteResult.wasTie,
    });

    const topSuspects = Object.entries(newSuspicion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, score]) => ({ id, score, nickname: newPlayers.find((p) => p.id === id)?.nickname ?? "?" }));

    const winner = checkWinCondition(newPlayers.filter((p) => p.isAlive));
    if (winner) {
      const myTeam = ROLE_TEAM[gs.myPlayer.role];
      const won = myTeam === winner || winner === "neutral";
      const teamKey2 = (myTeam === "killers" || myTeam === "innocents") ? myTeam : "innocents";
      recordMatch({ role: gs.myPlayer.role, team: teamKey2, winner: winner as "killers" | "innocents" | "draw", won, players: gs.players.length });
      if (won) playVictory(); else playDefeat();
      setGs((s) => ({
        ...s,
        phase: "finished",
        players: newPlayers,
        voteResult,
        suspicionScores: newSuspicion,
        topSuspects,
        winner,
        messages: [...s.messages, { id: generateId(), from: "narrator", nickname: "Narrador", content: resultMsg, type: "narrator", timestamp: Date.now() }],
      }));
      return;
    }

    setGs((s) => ({
      ...s,
      phase: "result",
      players: newPlayers,
      voteResult,
      suspicionScores: newSuspicion,
      topSuspects,
      messages: [...s.messages, { id: generateId(), from: "narrator", nickname: "Narrador", content: resultMsg, type: "narrator" as const, timestamp: Date.now() }].slice(-150) as SoloMessage[],
    }));
    setMyVote(null);

    // Auto avançar para night após 5s
    setTimeout(() => {
      addMsg({ from: "narrator", nickname: "Narrador", content: narratorMessage("night"), type: "narrator" });
      playNight();
      setGs((s) => ({ ...s, phase: "night", round: s.round + 1, voteResult: null }));
    }, 5000);
  }

  // ── Chat do jogador ────────────────────────────────────────
  function sendChat() {
    if (!chatInput.trim()) return;
    addMsg({
      from: gs.myPlayer.id,
      nickname: gs.myPlayer.nickname,
      content: chatInput.trim(),
      type: "public",
    });
    playMessage();
    setChatInput("");
  }

  // ── Role Reveal Screen ────────────────────────────────────
  if (showRole) {
    const roleDef = ROLE_DEFS[gs.myPlayer.role];
    return (
      <main className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">Seu Papel Secreto</p>
          <RoleRevealCard role={gs.myPlayer.role} />
          <div className="mt-6 glass rounded-xl p-4 border border-white/6 text-left space-y-2">
            <p className="text-xs text-gray-500"><span className="text-yellow-400">🎯 Objetivo:</span> {roleDef.objective}</p>
            <p className="text-xs text-gray-500"><span className="text-blue-400">⚡ Habilidade:</span> {roleDef.ability}</p>
            <p className="text-xs text-gray-500"><span className="text-green-400">💡 Dica:</span> {roleDef.tip}</p>
          </div>
          <p className="text-xs text-gray-600 mt-4">Jogue com <span className="text-white font-bold">{botCount} bots</span> no mapa <span className="text-white font-bold">{gs.map.emoji} {gs.map.name}</span></p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowRole(false)}
            className="mt-6 w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-900/30 glow-red"
          >
            ⚔️ Começar Partida
          </motion.button>
        </motion.div>
      </main>
    );
  }

  // ── Finished Screen ────────────────────────────────────────
  if (gs.phase === "finished") {
    const myTeam = ROLE_TEAM[gs.myPlayer.role];
    const won = myTeam === gs.winner || gs.winner === "neutral";
    const teamLabel: Record<string, string> = { killers: "Assassinos", innocents: "Inocentes", neutral: "Neutros" };

    return (
      <main className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="text-6xl mb-4">{won ? "🏆" : "💀"}</div>
          <h1 className={`text-3xl font-black tracking-widest uppercase mb-2 ${won ? "text-yellow-300" : "text-red-400"}`}>
            {won ? "Vitória!" : "Derrota"}
          </h1>
          <p className="text-gray-400 mb-2">Vencedor: <span className="text-white font-bold">{teamLabel[gs.winner ?? ""] ?? gs.winner}</span></p>
          <p className="text-gray-500 text-sm mb-6">Você era: {ROLE_ICONS[gs.myPlayer.role]} {ROLE_NAMES[gs.myPlayer.role]}</p>

          {/* Papéis revelados */}
          <div className="glass rounded-xl p-4 border border-white/6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Papéis Revelados</p>
            <div className="space-y-1.5">
              {gs.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className={p.isAlive ? "text-white" : "text-gray-600 line-through"}>
                    {p.avatar} {p.nickname} {p.id === gs.myPlayer.id && <span className="text-yellow-500 text-xs">(você)</span>}
                  </span>
                  <span className={`text-xs font-bold ${ROLE_TEAM[p.role] === "killers" ? "text-red-400" : ROLE_TEAM[p.role] === "neutral" ? "text-yellow-400" : "text-blue-400"}`}>
                    {ROLE_ICONS[p.role]} {ROLE_NAMES[p.role]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGs(initSoloGame(gs.myPlayer.nickname, gs.myPlayer.avatar, botCount));
                setShowRole(true);
                setMyVote(null);
                setSelectedTarget(null);
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm tracking-widest uppercase bg-red-600 hover:bg-red-500 transition-all"
            >
              🔄 Jogar Novamente
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onExit}
              className="flex-1 py-3 rounded-xl font-bold text-sm tracking-widest uppercase bg-white/5 hover:bg-white/10 text-gray-400 transition-all"
            >
              ← Sair
            </motion.button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Main Game UI ──────────────────────────────────────────
  const alive = gs.players.filter((p) => p.isAlive);
  const myRoleDef = ROLE_DEFS[gs.myPlayer.role];
  const canActNight = gs.phase === "night" && gs.myPlayer.isAlive && ["killer","silentKiller","doctor","investigator","hacker","spy","corruptCop"].includes(gs.myPlayer.role);
  const isKiller = ROLE_TEAM[gs.myPlayer.role] === "killers";

  const phaseLabels: Record<string, string> = {
    night: "🌑 Noite", day: "☀️ Dia", voting: "⚖️ Votação", result: "📋 Resultado",
  };
  const phaseColors: Record<string, string> = {
    night: "text-blue-400", day: "text-yellow-400", voting: "text-red-400", result: "text-gray-400",
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm tracking-widest uppercase ${phaseColors[gs.phase] ?? "text-gray-400"}`}>
            {phaseLabels[gs.phase] ?? gs.phase}
          </span>
          <span className="text-xs text-gray-600 font-mono">R{gs.round}</span>
        </div>
        <div className="flex items-center gap-3">
          {timer > 0 && (
            <span className={`font-mono text-sm font-bold ${timer <= 10 ? "text-red-400 animate-pulse" : "text-gray-500"}`}>
              {timer}s
            </span>
          )}
          <span className="text-xs text-gray-600">{alive.length} vivos</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 overflow-hidden max-w-4xl mx-auto w-full px-2 py-3">
        {/* ── Coluna esquerda ── */}
        <div className="flex flex-col gap-3 lg:w-64 shrink-0">
          {/* Meu papel */}
          <div className={`glass rounded-xl p-3 border ${isKiller ? "border-red-800/40" : "border-blue-800/20"}`}>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Seu Papel</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ROLE_ICONS[gs.myPlayer.role]}</span>
              <div>
                <p className={`font-bold text-sm ${isKiller ? "text-red-300" : "text-blue-300"}`}>{ROLE_NAMES[gs.myPlayer.role]}</p>
                <p className="text-[10px] text-gray-600">{myRoleDef.abilityName}</p>
              </div>
            </div>
          </div>

          {/* Jogadores */}
          <div className="glass rounded-xl p-3 border border-white/6">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Jogadores</p>
            <div className="space-y-1.5">
              {gs.players.map((p) => {
                const suspScore = gs.suspicionScores[p.id] ?? 0;
                const isMe = p.id === gs.myPlayer.id;
                return (
                  <div key={p.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all ${!p.isAlive ? "opacity-40" : ""} ${isMe ? "bg-white/5" : ""}`}>
                    <span className="text-base">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${!p.isAlive ? "line-through text-gray-600" : "text-white"}`}>
                        {p.nickname} {isMe && <span className="text-yellow-500 text-[9px]">EU</span>}
                      </p>
                      {p.isAlive && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500/60 rounded-full transition-all"
                              style={{ width: `${suspScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono w-6 text-right">{suspScore}</span>
                        </div>
                      )}
                    </div>
                    {!p.isAlive && <span className="text-xs">💀</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidências */}
          {gs.evidence.length > 0 && (
            <div className="glass rounded-xl p-3 border border-yellow-900/20">
              <p className="text-[10px] text-yellow-600 uppercase tracking-widest mb-2">🔍 Evidências</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {gs.evidence.slice(-4).map((ev, i) => (
                  <div key={i} className={`text-[10px] rounded px-2 py-1 ${ev.isFake ? "text-red-400/60 bg-red-950/20" : "text-gray-400 bg-white/3"}`}>
                    {ev.description}
                    {ev.isFake && <span className="text-red-500/50 ml-1">[FALSA]</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa */}
          <div className="glass rounded-xl p-3 border border-white/4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
              {gs.map.emoji} {gs.map.name}
            </p>
            <p className="text-[9px] text-gray-700 italic">{gs.map.atmosphere.slice(0, 60)}…</p>
          </div>
        </div>

        {/* ── Coluna central ── */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Evento dinâmico */}
          <AnimatePresence>
            {gs.randomEvent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-xl px-4 py-3 border border-yellow-800/40 bg-yellow-950/20"
              >
                <p className="text-yellow-300 font-bold text-sm">{gs.randomEvent.title}</p>
                <p className="text-yellow-600 text-xs mt-0.5">{gs.randomEvent.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Ação noturna ── */}
          <AnimatePresence>
            {canActNight && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-blue-800/30"
              >
                <p className="text-xs text-blue-400 uppercase tracking-widest mb-3 font-semibold">
                  ⚡ {myRoleDef.abilityName} — Escolha um alvo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {alive.filter((p) => {
                    if (p.id === gs.myPlayer.id) return false;
                    if (gs.myPlayer.role === "doctor") return true; // pode se salvar
                    return true;
                  }).map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedTarget(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        selectedTarget === p.id
                          ? "border-blue-500 bg-blue-900/30 text-white"
                          : "border-white/10 bg-white/3 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span className="truncate text-xs">{p.nickname}</span>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleNightAction}
                  disabled={!selectedTarget}
                  className="mt-3 w-full py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Confirmar Ação
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Votação ── */}
          <AnimatePresence>
            {gs.phase === "voting" && gs.myPlayer.isAlive && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-red-800/30"
              >
                <p className="text-xs text-red-400 uppercase tracking-widest mb-3 font-semibold">
                  🗳️ Vote — Quem é o culpado?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {alive.filter((p) => p.id !== gs.myPlayer.id).map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setMyVote(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        myVote === p.id
                          ? "border-red-500 bg-red-900/30 text-white"
                          : "border-white/10 bg-white/3 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{p.nickname}</p>
                        <div className="h-0.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                          <div className="h-full bg-red-500/50" style={{ width: `${gs.suspicionScores[p.id] ?? 0}%` }} />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleVote}
                  disabled={!myVote}
                  className="mt-3 w-full py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Confirmar Voto {myVote ? `em ${gs.players.find((p) => p.id === myVote)?.nickname}` : ""}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Chat ── */}
          <div className="flex-1 glass rounded-xl border border-white/6 flex flex-col min-h-48 max-h-72 lg:max-h-none lg:flex-1">
            <div className="px-3 py-2 border-b border-white/6">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">💬 Chat</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {gs.messages.map((m) => (
                <div key={m.id} className={`text-xs ${
                  m.type === "narrator" ? "text-purple-400 italic" :
                  m.type === "system"   ? "text-yellow-600" :
                  m.from === gs.myPlayer.id ? "text-white" :
                  "text-gray-400"
                }`}>
                  {m.type !== "narrator" && m.type !== "system" && (
                    <span className="font-semibold mr-1 text-gray-500">{m.nickname}:</span>
                  )}
                  {m.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {gs.phase === "day" && gs.myPlayer.isAlive && (
              <div className="flex gap-2 px-3 pb-3 pt-1 border-t border-white/4">
                <input
                  className="flex-1 bg-[#0B0F19] border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-white/20 transition-all"
                  placeholder="Sua teoria..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  maxLength={200}
                />
                <button onClick={sendChat} className="px-3 py-1.5 bg-white/8 hover:bg-white/12 rounded-lg text-xs text-gray-400 transition-all">
                  ↵
                </button>
              </div>
            )}
          </div>

          {/* Avançar fase manualmente */}
          {(gs.phase === "day" || gs.phase === "result") && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (gs.phase === "day") {
                  setGs((s) => advancePhase(s));
                } else {
                  addMsg({ from: "narrator", nickname: "Narrador", content: narratorMessage("night"), type: "narrator" });
                  playNight();
                  setGs((s) => ({ ...s, phase: "night", round: s.round + 1, voteResult: null }));
                  setMyVote(null);
                }
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase bg-white/5 hover:bg-white/10 text-gray-500 transition-all border border-white/4"
            >
              {gs.phase === "day" ? "⚖️ Ir para Votação" : "🌑 Próxima Noite →"}
            </motion.button>
          )}

          {gs.phase === "night" && !canActNight && gs.myPlayer.isAlive && (
            <div className="glass rounded-xl p-3 border border-white/4 text-center">
              <p className="text-gray-600 text-xs">🌙 Aguarde... os outros agem à noite</p>
              <p className="text-gray-700 text-[10px] mt-1">Seu papel ({ROLE_NAMES[gs.myPlayer.role]}) não age à noite</p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setGs((s) => advancePhase(s))}
                className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-white/5 hover:bg-white/10 transition-all"
              >
                Pular para o Dia →
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
