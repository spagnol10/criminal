"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGameStore } from "../../../lib/store/gameStore";
import { useSocketEvents } from "../../../lib/hooks/useSocket";
import { Button, Card, FadeIn, Avatar } from "../../../components/ui";
import { ROLE_NAMES, ROLE_ICONS, ROLE_TEAM } from "../../../lib/utils/gameEngine";
import type { Player, PlayerRole } from "../../../lib/types/game";

export default function ResultPage({ params }: { params: Promise<{ code: string }> }) {
  use(params);
  useSocketEvents();

  const router = useRouter();
  const { winner, players, myPlayer, myRole } = useGameStore();

  const myTeam = myRole ? ROLE_TEAM[myRole] : null;
  const iWon = myTeam === winner;

  function playAgain() {
    useGameStore.getState().reset();
    router.push("/");
  }

  const killers = players.filter(
    (p) => p.role && ROLE_TEAM[p.role as PlayerRole] === "killers"
  );
  const innocents = players.filter(
    (p) => p.role && ROLE_TEAM[p.role as PlayerRole] === "innocents"
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Winner announcement */}
      <FadeIn>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">
            {winner === "killers" ? "🔪" : winner === "innocents" ? "⚖️" : "🤝"}
          </div>
          <h1 className={`text-4xl font-black mb-2 ${
            winner === "killers" ? "text-red-400" : "text-blue-400"
          }`}>
            {winner === "killers" ? "Assassinos Venceram!" : "Inocentes Venceram!"}
          </h1>
          {myPlayer && (
            <p className={`text-xl font-semibold ${iWon ? "text-green-400" : "text-gray-500"}`}>
              {iWon ? "🏆 Você ganhou!" : "💀 Você perdeu."}
            </p>
          )}
        </motion.div>
      </FadeIn>

      {/* Teams reveal */}
      <div className="w-full max-w-lg space-y-4">
        <FadeIn delay={0.2}>
          <Card className="p-4">
            <h2 className="text-red-400 font-bold mb-3 flex items-center gap-2">
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
          <Card className="p-4">
            <h2 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
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
          <Button size="lg" className="w-full" onClick={playAgain}>
            🔄 Jogar Novamente
          </Button>
        </FadeIn>
      </div>
    </main>
  );
}

function PlayerRevealRow({ player, isMe }: { player: Player; isMe: boolean }) {
  const role = player.role as PlayerRole | undefined;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-2.5 rounded-xl ${
        isMe ? "bg-blue-950/30 border border-blue-900/40" : "bg-gray-800/40"
      }`}
    >
      <Avatar emoji={player.avatar} dead={!player.isAlive} />
      <div className="flex-1">
        <p className={`font-semibold text-sm ${isMe ? "text-blue-300" : "text-white"}`}>
          {player.nickname}
          {isMe && <span className="ml-1 text-xs text-blue-500">(você)</span>}
        </p>
        {role && (
          <p className="text-xs text-gray-500">
            {ROLE_ICONS[role]} {ROLE_NAMES[role]}
          </p>
        )}
      </div>
      {!player.isAlive && (
        <span className="text-xs text-red-500 font-medium">💀</span>
      )}
    </motion.div>
  );
}
