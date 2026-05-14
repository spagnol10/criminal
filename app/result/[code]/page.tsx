"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGameStore } from "../../../lib/store/gameStore";
import { useSocketEvents } from "../../../lib/hooks/useSocket";
import { Button, Card, FadeIn, Avatar } from "../../../components/ui";
import { ROLE_NAMES, ROLE_ICONS, ROLE_TEAM } from "../../../lib/utils/gameEngine";
import { recordMatch } from "../../../lib/utils/score";
import type { Player, PlayerRole } from "../../../lib/types/game";

export default function ResultPage({ params }: { params: Promise<{ code: string }> }) {
  use(params);
  useSocketEvents();

  const router = useRouter();
  const { winner, players, myPlayer, myRole } = useGameStore();

  const myTeam = myRole ? ROLE_TEAM[myRole] : null;
  const iWon = myTeam === winner;

  // Registra partida no histórico local
  useEffect(() => {
    if (!myRole || !winner) return;
    recordMatch({
      role: myRole,
      team: myTeam as "killers" | "innocents",
      winner: winner as "killers" | "innocents",
      won: iWon,
      players: players.length,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playAgain() {
    useGameStore.getState().reset();
    router.push("/");
  }

  const killers  = players.filter((p) => p.role && ROLE_TEAM[p.role as PlayerRole] === "killers");
  const innocents = players.filter((p) => p.role && ROLE_TEAM[p.role as PlayerRole] === "innocents");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#0B0F19] relative overflow-hidden">
      {/* bg layers */}
      <div className={`absolute inset-0 pointer-events-none ${
        winner === "killers"
          ? "bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(239,68,68,0.08),transparent)]"
          : "bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(59,130,246,0.08),transparent)]"
      }`} />

      {/* Winner announcement */}
      <FadeIn>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-8xl mb-5"
          >
            {winner === "killers" ? "🔪" : winner === "innocents" ? "⚖️" : "🤝"}
          </motion.div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-widest uppercase mb-3 ${
            winner === "killers" ? "text-red-400 glow-red" : "text-blue-400 glow-blue"
          }`}>
            {winner === "killers" ? "Assassinos Venceram!" : "Inocentes Venceram!"}
          </h1>
          {myPlayer && (
            <p className={`text-base font-bold uppercase tracking-widest ${iWon ? "text-green-400" : "text-gray-600"}`}>
              {iWon ? "🏆 Você ganhou!" : "💀 Você perdeu."}
            </p>
          )}
        </motion.div>
      </FadeIn>

      {/* Teams */}
      <div className="w-full max-w-lg space-y-4">
        <FadeIn delay={0.2}>
          <Card glow="red" className="p-4">
            <h2 className="text-[10px] font-bold text-red-500/80 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              🔪 Time dos Assassinos
            </h2>
            <div className="space-y-2">
              {killers.map((p: Player) => (
                <PlayerRevealRow key={p.id} player={p} isMe={p.id === myPlayer?.id} />
              ))}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.35}>
          <Card glow="blue" className="p-4">
            <h2 className="text-[10px] font-bold text-blue-500/80 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              ⚖️ Time dos Inocentes
            </h2>
            <div className="space-y-2">
              {innocents.map((p: Player) => (
                <PlayerRevealRow key={p.id} player={p} isMe={p.id === myPlayer?.id} />
              ))}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={playAgain}>
              🔄 Jogar Novamente
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/stats")}>
              📊
            </Button>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}

function PlayerRevealRow({ player, isMe }: { player: Player; isMe: boolean }) {
  const role = player.role as PlayerRole | undefined;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-2.5 rounded-xl border ${
        isMe ? "border-blue-500/30 bg-blue-950/20" : "border-white/6 bg-[#1A2233]/40"
      }`}
    >
      <Avatar emoji={player.avatar} size="sm" dead={!player.isAlive} glow={isMe ? "blue" : undefined} />
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
          {player.nickname}
          {isMe && <span className="ml-1.5 text-[10px] text-blue-500/70 uppercase tracking-widest">(você)</span>}
        </p>
        {role && (
          <p className="text-xs text-gray-600 font-mono">
            {ROLE_ICONS[role]} {ROLE_NAMES[role]}
          </p>
        )}
      </div>
      {!player.isAlive && <span className="text-xs text-red-500">💀</span>}
    </motion.div>
  );
}
