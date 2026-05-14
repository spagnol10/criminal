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
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <FadeIn className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Sala</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-widest text-white font-mono">{code}</h1>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-gray-600 hover:text-gray-300 transition-colors text-sm"
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

        {/* Players list */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-300">
              Jogadores <span className="text-gray-600">({players.length})</span>
            </h2>
            <Badge color="gray">{players.length}/12</Badge>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player: Player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-800"
                >
                  <Avatar emoji={player.avatar} size="md" />
                  <div className="flex-1">
                    <p className={`font-semibold ${player.id === myPlayer?.id ? "text-blue-300" : "text-white"}`}>
                      {player.nickname}
                      {player.id === myPlayer?.id && (
                        <span className="ml-2 text-xs text-blue-500">(você)</span>
                      )}
                    </p>
                  </div>
                  {player.isHost && <Badge color="yellow">👑 Host</Badge>}
                  {isHost && player.id !== myPlayer?.id && (
                    <button
                      onClick={() => handleKick(player.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                      title="Expulsar"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length < 4 && (
              <p className="text-center text-gray-600 text-sm py-4">
                Aguardando mais jogadores… (mínimo 4)
              </p>
            )}
          </div>
        </Card>

        {/* Rules */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">📋 Como Jogar</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <p>🌙 <span className="text-gray-300">Noite:</span> Assassino mata, médico salva, investigador investiga.</p>
            <p>☀️ <span className="text-gray-300">Dia:</span> Discutam quem é suspeito no chat.</p>
            <p>⚖️ <span className="text-gray-300">Votação:</span> Eliminem um suspeito por votação.</p>
            <p>🏆 <span className="text-gray-300">Vitória:</span> Inocentes eliminam todos os assassinos, ou assassinos se igualam aos inocentes.</p>
          </div>
        </Card>

        {/* Start button */}
        {isHost ? (
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart}
            onClick={handleStart}
          >
            {canStart ? "🚀 Iniciar Partida" : `Aguardando jogadores (${players.length}/4)`}
          </Button>
        ) : (
          <div className="text-center text-gray-500 text-sm">
            ⏳ Aguardando o host iniciar a partida…
          </div>
        )}
      </FadeIn>
    </main>
  );
}
