"use client";
import { useState, useRef, useEffect } from "react";import { motion, AnimatePresence } from "framer-motion";
import { PHASE_NAMES, ROLE_NAMES, ROLE_ICONS } from "../../lib/utils/gameEngine";
import { Avatar, Badge, TimerBar, PulseDot, Card } from "../ui";
import type { Player, GamePhase, PlayerRole, ChatMessage } from "../../lib/types/game";

// ---- Phase Banner ----
export function PhaseBanner({
  phase,
  timer,
  maxTimer,
}: {
  phase: GamePhase;
  timer: number;
  maxTimer: number;
}) {
  const phaseConfig: Record<GamePhase, { icon: string; color: string; bg: string }> = {
    WAITING: { icon: "⏳", color: "text-gray-300", bg: "from-gray-900 to-gray-800" },
    STARTING: { icon: "🎬", color: "text-yellow-300", bg: "from-yellow-900/40 to-gray-900" },
    NIGHT: { icon: "🌙", color: "text-blue-300", bg: "from-blue-950/80 to-gray-950" },
    DAY: { icon: "☀️", color: "text-amber-300", bg: "from-amber-900/30 to-gray-900" },
    VOTING: { icon: "⚖️", color: "text-red-300", bg: "from-red-950/60 to-gray-950" },
    RESULT: { icon: "🔨", color: "text-purple-300", bg: "from-purple-950/60 to-gray-950" },
    FINISHED: { icon: "🏁", color: "text-white", bg: "from-gray-900 to-black" },
  };

  const cfg = phaseConfig[phase];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full bg-linear-to-r ${cfg.bg} border border-gray-800 rounded-xl p-4`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cfg.icon}</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Fase atual</p>
              <h2 className={`text-lg font-bold ${cfg.color}`}>{PHASE_NAMES[phase]}</h2>
            </div>
          </div>
          {timer > 0 && (
            <div className="text-right">
              <p className={`text-2xl font-mono font-bold ${timer <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {timer}s
              </p>
            </div>
          )}
        </div>
        {maxTimer > 0 && <div className="mt-3"><TimerBar current={timer} max={maxTimer} /></div>}
      </motion.div>
    </AnimatePresence>
  );
}

// ---- Player Card ----
export function PlayerCard({
  player,
  showRole,
  onSelect,
  selected,
  isMe,
  disabled,
}: {
  player: Player;
  showRole?: boolean;
  onSelect?: (id: string) => void;
  selected?: boolean;
  isMe?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.div
      whileHover={onSelect && !disabled ? { scale: 1.03 } : {}}
      whileTap={onSelect && !disabled ? { scale: 0.97 } : {}}
      onClick={() => onSelect && !disabled && player.isAlive && onSelect(player.id)}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
        ${!player.isAlive ? "opacity-40 cursor-not-allowed" : ""}
        ${selected ? "border-red-500 bg-red-950/40 shadow-lg shadow-red-900/30" : "border-gray-800 bg-gray-900/50 hover:border-gray-600"}
        ${isMe ? "border-blue-700 bg-blue-950/20" : ""}
        ${disabled ? "cursor-default" : ""}
      `}
    >
      <div className="relative">
        <Avatar emoji={player.avatar} size="md" dead={!player.isAlive} disconnected={!player.isConnected} />
        {!player.isConnected && player.isAlive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-gray-900" title="Desconectado" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${isMe ? "text-blue-300" : "text-white"}`}>
          {player.nickname}
          {isMe && <span className="ml-1 text-xs text-blue-500">(você)</span>}
        </p>
        {showRole && player.role && (
          <p className="text-xs text-gray-500">
            {ROLE_ICONS[player.role as PlayerRole]} {ROLE_NAMES[player.role as PlayerRole]}
          </p>
        )}
        {!player.isAlive && (
          <p className="text-xs text-red-500 font-medium">Eliminado</p>
        )}
      </div>
      {player.isHost && (
        <Badge color="yellow">👑 Host</Badge>
      )}
      {selected && (
        <span className="text-red-400 text-lg">✓</span>
      )}
    </motion.div>
  );
}

// ---- Role Reveal Card ----
export function RoleRevealCard({ role }: { role: PlayerRole }) {
  const teamColor = ["killer", "accomplice"].includes(role) ? "red" : "blue";
  const bg = teamColor === "red" ? "from-red-950/90 to-gray-950 border-red-800" : "from-blue-950/90 to-gray-950 border-blue-800";

  const descriptions: Record<PlayerRole, string> = {
    citizen: "Sobreviva e ajude a identificar o assassino nas discussões do dia.",
    doctor: "Cada noite você pode salvar uma pessoa da morte. Escolha com sabedoria.",
    investigator: "Cada noite investigue um suspeito e descubra se é culpado ou inocente.",
    killer: "Você deve eliminar os inocentes sem ser descoberto pela cidade.",
    accomplice: "Apoie o assassino. Saiba a identidade dele e proteja-o.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className={`bg-linear-to-br ${bg} border rounded-2xl p-8 text-center max-w-sm mx-auto`}
    >
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Seu papel secreto</p>
      <div className="text-7xl mb-4">{ROLE_ICONS[role]}</div>
      <h2 className={`text-3xl font-bold mb-3 ${teamColor === "red" ? "text-red-300" : "text-blue-300"}`}>
        {ROLE_NAMES[role]}
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed">{descriptions[role]}</p>
      <div className={`mt-4 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest inline-block ${
        teamColor === "red" ? "bg-red-900/50 text-red-300" : "bg-blue-900/50 text-blue-300"
      }`}>
        Time: {teamColor === "red" ? "Assassinos" : "Inocentes"}
      </div>
    </motion.div>
  );
}

// ---- Chat Box ----
export function ChatBox({
  messages,
  onSend,
  canSend,
  placeholder = "Digite uma mensagem...",
}: {
  messages: ChatMessage[];
  onSend?: (text: string) => void;
  canSend?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !onSend) return;
    onSend(text.trim());
    setText("");
  };

  const msgColors: Record<string, string> = {
    public: "text-gray-200",
    private: "text-red-300",
    narrator: "text-amber-300 italic",
    system: "text-blue-300 italic",
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 max-h-80 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-4">Nenhuma mensagem ainda…</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.type !== "narrator" && msg.type !== "system" && (
              <span className="text-gray-500 font-medium mr-1">{msg.playerNickname}:</span>
            )}
            <span className={msgColors[msg.type] ?? "text-gray-200"}>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {canSend && (
        <div className="border-t border-gray-800 p-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={placeholder}
            maxLength={280}
            className="flex-1 bg-gray-800/60 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-red-600"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg text-sm font-semibold transition-colors"
          >
            ➤
          </button>
        </div>
      )}
    </Card>
  );
}

// ---- Night Event Banner ----
export function NightEventBanner({ event }: { event: { title: string; description: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-linear-to-r from-purple-950/80 to-gray-950 border border-purple-800/50 rounded-xl p-4"
    >
      <h3 className="text-purple-300 font-bold mb-1">{event.title}</h3>
      <p className="text-gray-400 text-sm">{event.description}</p>
    </motion.div>
  );
}

// ---- Alive Counter ----
export function AliveCounter({ players }: { players: Player[] }) {
  const alive = players.filter((p) => p.isAlive).length;
  const total = players.length;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <PulseDot color="green" />
      <span><span className="text-white font-semibold">{alive}</span>/{total} vivos</span>
    </div>
  );
}
