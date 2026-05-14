"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASE_NAMES, ROLE_NAMES, ROLE_ICONS } from "../../lib/utils/gameEngine";
import { Avatar, Badge, TimerBar, PulseDot, Card } from "../ui";
import type { Player, GamePhase, PlayerRole, ChatMessage } from "../../lib/types/game";

// ── Phase Banner ──────────────────────────────────────────────────────────────
export function PhaseBanner({ phase, timer, maxTimer }: { phase: GamePhase; timer: number; maxTimer: number }) {
  const cfg: Record<GamePhase, { icon: string; label: string; accent: string; border: string }> = {
    WAITING:  { icon:"⏳", label:"Aguardando", accent:"text-gray-400",   border:"border-white/6" },
    STARTING: { icon:"🎬", label:"Iniciando",  accent:"text-yellow-300", border:"border-yellow-800/40" },
    NIGHT:    { icon:"🌙", label:"Noite",       accent:"text-blue-300",   border:"border-blue-800/40" },
    DAY:      { icon:"☀️", label:"Dia",         accent:"text-amber-300",  border:"border-amber-800/40" },
    VOTING:   { icon:"⚖️", label:"Votação",     accent:"text-red-300",    border:"border-red-800/40" },
    RESULT:   { icon:"🔨", label:"Resultado",   accent:"text-purple-300", border:"border-purple-800/40" },
    FINISHED: { icon:"🏁", label:"Fim",          accent:"text-white",      border:"border-white/20" },
  };
  const c = cfg[phase];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className={`glass rounded-xl p-4 border ${c.border}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{c.icon}</span>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] font-semibold">Fase atual</p>
              <h2 className={`text-base font-black tracking-widest uppercase ${c.accent}`}>{PHASE_NAMES[phase]}</h2>
            </div>
          </div>
          {timer > 0 && (
            <motion.p
              key={timer}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-mono font-black tabular-nums ${timer <= 10 ? "text-red-400" : "text-white"}`}
            >
              {timer}s
            </motion.p>
          )}
        </div>
        {maxTimer > 0 && (
          <div className="mt-3">
            <TimerBar value={timer} max={maxTimer} color={phase === "NIGHT" ? "blue" : phase === "VOTING" ? "red" : "yellow"} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Player Card ───────────────────────────────────────────────────────────────
export function PlayerCard({
  player, showRole, onSelect, selected, isMe, disabled,
}: {
  player: Player; showRole?: boolean; onSelect?: (id: string) => void;
  selected?: boolean; isMe?: boolean; disabled?: boolean;
}) {
  const canClick = !!onSelect && !disabled && player.isAlive;
  return (
    <motion.div
      whileHover={canClick ? { scale: 1.03 } : {}}
      whileTap={canClick ? { scale: 0.96 } : {}}
      onClick={() => canClick && onSelect!(player.id)}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all
        ${!player.isAlive ? "opacity-35" : ""}
        ${selected ? "border-red-500/70 bg-red-950/30 shadow-lg shadow-red-900/20" : isMe ? "border-blue-500/40 bg-blue-950/20" : "border-white/6 bg-[#1A2233]/60"}
        ${canClick ? "cursor-pointer hover:border-white/20" : "cursor-default"}
      `}
    >
      <div className="relative shrink-0">
        <Avatar emoji={player.avatar} size="md" dead={!player.isAlive} glow={selected ? "red" : isMe ? "blue" : undefined} />
        {!player.isConnected && player.isAlive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#0B0F19]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
          {player.nickname}
          {isMe && <span className="ml-1.5 text-[10px] font-semibold text-blue-500/80 uppercase tracking-widest">(você)</span>}
        </p>
        {showRole && player.role ? (
          <p className="text-xs text-gray-500 font-mono">
            {ROLE_ICONS[player.role as PlayerRole]} {ROLE_NAMES[player.role as PlayerRole]}
          </p>
        ) : !player.isAlive ? (
          <p className="text-xs text-red-500/80 font-bold uppercase tracking-widest">Eliminado</p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {player.isHost && <Badge color="yellow">👑</Badge>}
        {selected && <span className="text-red-400 text-sm font-bold">✓</span>}
      </div>
    </motion.div>
  );
}

// ── Role Reveal Card ──────────────────────────────────────────────────────────
export function RoleRevealCard({ role }: { role: PlayerRole }) {
  const killerRoles = ["killer", "accomplice", "manipulator", "silentKiller", "corruptCop"];
  const neutralRoles = ["ghost", "survivor", "traitor"];
  const isEvil = killerRoles.includes(role);
  const isNeutral = neutralRoles.includes(role);
  const descriptions: Record<PlayerRole, string> = {
    citizen:      "Sobreviva e ajude a identificar o assassino nas discussões do dia.",
    doctor:       "Cada noite você pode salvar uma pessoa da morte. Escolha com sabedoria.",
    investigator: "Cada noite investigue um suspeito e descubra se é culpado ou inocente.",
    killer:       "Você deve eliminar os inocentes sem ser descoberto pela cidade.",
    accomplice:   "Apoie o assassino. Saiba a identidade dele e proteja-o.",
    informant:    "Uma vez por partida descubra o nome de um assassino. Use sua informação com cuidado.",
    hacker:       "Hackeie jogadores à noite para descobrir seus papéis exatos.",
    manipulator:  "Plante mentiras, force votos e destrua a confiança entre os inocentes.",
    ghost:        "Você voltou do além. Sobreviva até o fim — independente de quem vencer.",
    silentKiller: "Mata sem deixar rastros. Invisível ao Espião. Letal e silencioso.",
    corruptCop:   "Use sua autoridade para bloquear investigações e proteger os assassinos.",
    survivor:     "Seu único objetivo: estar vivo quando a partida terminar.",
    traitor:      "Vença sendo eliminado por votação. Provoce. Seja suspeito. Provoque sua própria condenação.",
    spy:          "Observe os movimentos noturnos. Descubra quem age nas sombras.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.7, type: "spring", stiffness: 120 }}
      className={`border rounded-2xl p-8 text-center max-w-sm mx-auto ${
        isEvil
          ? "bg-linear-to-br from-red-950/60 to-[#0B0F19] border-red-800/50 shadow-2xl shadow-red-950/50"
          : isNeutral
          ? "bg-linear-to-br from-yellow-950/60 to-[#0B0F19] border-yellow-800/50 shadow-2xl shadow-yellow-950/50"
          : "bg-linear-to-br from-blue-950/60 to-[#0B0F19] border-blue-800/50 shadow-2xl shadow-blue-950/50"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 mb-4 font-semibold">Papel Secreto</p>
      <motion.div
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="text-7xl mb-5"
      >
        {ROLE_ICONS[role]}
      </motion.div>
      <h2 className={`text-3xl font-black tracking-widest uppercase mb-3 ${isEvil ? "text-red-300 glow-red" : isNeutral ? "text-yellow-300" : "text-blue-300 glow-blue"}`}>
        {ROLE_NAMES[role]}
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">{descriptions[role]}</p>
      <div className={`mt-5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] inline-block ${
        isEvil ? "bg-red-900/40 text-red-400 border border-red-800/40" : isNeutral ? "bg-yellow-900/40 text-yellow-400 border border-yellow-800/40" : "bg-blue-900/40 text-blue-400 border border-blue-800/40"
      }`}>
        {isEvil ? "🔴 Assassinos" : isNeutral ? "🟡 Neutro" : "🔵 Inocentes"}
      </div>
    </motion.div>
  );
}

// ── Chat Box ──────────────────────────────────────────────────────────────────
export function ChatBox({ messages, onSend, canSend, placeholder = "Digite uma mensagem…" }: {
  messages: ChatMessage[]; onSend?: (text: string) => void; canSend?: boolean; placeholder?: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !onSend) return;
    onSend(text.trim());
    setText("");
  };

  const msgStyle: Record<string, string> = {
    public:   "text-gray-200",
    private:  "text-red-300",
    narrator: "text-amber-300 italic",
    system:   "text-blue-300 italic",
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 max-h-72">
        {messages.length === 0 && (
          <p className="text-gray-700 text-xs text-center mt-6 uppercase tracking-widest">Silêncio suspeito…</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.type !== "narrator" && msg.type !== "system" && (
              <span className="text-gray-500 font-semibold mr-1 text-xs">{msg.playerNickname}:</span>
            )}
            <span className={msgStyle[msg.type] ?? "text-gray-200"}>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {canSend && (
        <div className="border-t border-white/6 p-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={placeholder}
            maxLength={280}
            className="flex-1 bg-[#0B0F19] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 border border-white/6 focus:outline-none focus:border-red-500/50 font-mono transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-30 rounded-lg text-sm transition-colors"
          >
            ➤
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Night Event Banner ─────────────────────────────────────────────────────────
export function NightEventBanner({ event }: { event: { title: string; description: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="border border-purple-800/40 bg-linear-to-r from-purple-950/60 to-[#0B0F19] rounded-xl p-4"
    >
      <h3 className="text-purple-300 font-black uppercase tracking-widest text-sm mb-1">{event.title}</h3>
      <p className="text-gray-500 text-sm">{event.description}</p>
    </motion.div>
  );
}

// ── Alive Counter ─────────────────────────────────────────────────────────────
export function AliveCounter({ players }: { players: Player[] }) {
  const alive = players.filter((p) => p.isAlive).length;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase tracking-widest">
      <PulseDot color="green" />
      <span><span className="text-white font-bold">{alive}</span>/{players.length} vivos</span>
    </div>
  );
}
