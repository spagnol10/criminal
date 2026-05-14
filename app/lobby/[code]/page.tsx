"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../../lib/store/gameStore";
import { useSocketEvents } from "../../../lib/hooks/useSocket";
import { getSocket } from "../../../lib/socket/client";
import { Button, Card, Badge, FadeIn, Avatar } from "../../../components/ui";
import type { Player } from "../../../lib/types/game";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  useSocketEvents();

  const router = useRouter();
  const { players, myPlayer } = useGameStore();

  function handleStart() {
    const socket = getSocket();
    socket.emit("game:start", (res) => {
      if ("error" in res) alert(res.error);
    });
  }

  function handleKick(targetId: string) {
    const socket = getSocket();
    socket.emit("room:kick", { targetId });
  }

  function handleLeave() {
    const socket = getSocket();
    socket.emit("room:leave");
    useGameStore.getState().reset();
    router.push("/");
  }

  const isHost = myPlayer?.isHost;
  const canStart = isHost && players.length >= 4;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 bg-[#0B0F19] relative overflow-hidden">
      {/* Bg glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />

      <FadeIn className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-semibold mb-1">Código da Sala</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-[0.3em] text-white font-mono">{code}</h1>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-gray-600 hover:text-gray-300 transition-colors text-base"
                title="Copiar código"
              >
                📋
              </button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            ← Sair
          </Button>
        </div>

        {/* Players */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Jogadores
            </h2>
            <span className="font-mono text-xs text-gray-600">{players.length}/12</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player: Player, i: number) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    player.id === myPlayer?.id
                      ? "border-blue-500/30 bg-blue-950/20"
                      : "border-white/6 bg-[#1A2233]/40"
                  }`}
                >
                  <Avatar emoji={player.avatar} size="md" glow={player.id === myPlayer?.id ? "blue" : undefined} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${player.id === myPlayer?.id ? "text-blue-300" : "text-white"}`}>
                      {player.nickname}
                      {player.id === myPlayer?.id && (
                        <span className="ml-2 text-[10px] text-blue-500/80 uppercase tracking-widest font-semibold">(você)</span>
                      )}
                    </p>
                  </div>
                  {player.isHost && <Badge color="yellow">👑</Badge>}
                  {isHost && player.id !== myPlayer?.id && (
                    <button
                      onClick={() => handleKick(player.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors text-xs ml-1"
                      title="Expulsar"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length < 4 && (
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center text-gray-700 text-xs py-4 font-mono uppercase tracking-widest"
              >
                Aguardando jogadores… mínimo 4
              </motion.p>
            )}
          </div>
        </Card>

        {/* Rules */}
        <Card className="p-4 mb-6">
          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.25em] mb-3">Como Jogar</h3>
          <div className="space-y-2.5">
            {[
              { icon:"🌙", title:"Noite", desc:"Assassino mata · Médico salva · Investigador investiga" },
              { icon:"☀️", title:"Dia",   desc:"Discutam no chat quem é suspeito" },
              { icon:"⚖️", title:"Votação", desc:"Eliminem um suspeito por maioria" },
              { icon:"🏆", title:"Vitória", desc:"Inocentes eliminam assassinos · ou assassinos dominam" },
            ].map((r) => (
              <div key={r.title} className="flex items-start gap-2.5 text-xs">
                <span className="text-base shrink-0">{r.icon}</span>
                <p className="text-gray-500"><span className="text-gray-300 font-semibold">{r.title}:</span> {r.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Start / wait */}
        {isHost ? (
          <Button size="lg" className="w-full" disabled={!canStart} onClick={handleStart}>
            {canStart ? "🚀 Iniciar Partida" : `Aguardando (${players.length}/4)`}
          </Button>
        ) : (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center text-gray-600 text-xs font-mono uppercase tracking-widest"
          >
            ⏳ Aguardando o host iniciar…
          </motion.p>
        )}
      </FadeIn>
    </main>
  );
}
