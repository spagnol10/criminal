"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getStats, clearHistory } from "../../lib/utils/score";
import type { ScoreStats } from "../../lib/utils/score";
import { ROLE_NAMES, ROLE_ICONS } from "../../lib/utils/gameEngine";
import type { PlayerRole } from "../../lib/types/game";
import { FadeIn } from "../../components/ui";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-xl p-4 border border-white/6 text-center">
      <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] font-semibold mb-1">{label}</p>
      <p className="text-2xl font-black text-white font-mono">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ScoreStats | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load from localStorage only on client
  if (stats === null && typeof window !== "undefined") {
    setStats(getStats());
  }

  function handleClear() {
    clearHistory();
    setStats(getStats());
    setConfirmClear(false);
  }

  if (!stats) return null;

  const winColor  = stats.winRate >= 50 ? "text-green-400" : "text-red-400";

  return (
    <main className="min-h-screen bg-[#0B0F19] px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(59,130,246,0.06),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-semibold mb-1">Criminal</p>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase">Estatísticas</h1>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-bold"
            >
              ← Voltar
            </button>
          </div>
        </FadeIn>

        {stats.totalGames === 0 ? (
          <FadeIn delay={0.1}>
            <div className="glass rounded-2xl border border-white/6 p-10 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 text-sm uppercase tracking-widest">Nenhuma partida ainda.</p>
              <p className="text-gray-700 text-xs mt-2">Jogue para começar a acumular estatísticas.</p>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Win rate destaque */}
            <FadeIn delay={0.1}>
              <div className="glass rounded-2xl border border-white/6 p-6 text-center mb-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] font-semibold mb-2">Taxa de Vitória</p>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 120, delay: 0.3 }}
                  className={`text-6xl font-black font-mono ${winColor}`}
                >
                  {stats.winRate}%
                </motion.p>
                <p className="text-gray-600 text-xs mt-2 font-mono">
                  {stats.wins}V · {stats.losses}D · {stats.totalGames} jogos
                </p>
              </div>
            </FadeIn>

            {/* Grid stats */}
            <FadeIn delay={0.2}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard label="Sequência Atual" value={stats.currentStreak} sub={stats.currentStreak > 0 ? "🔥 vitórias seguidas" : "em andamento"} />
                <StatCard label="Melhor Sequência" value={stats.bestStreak} sub="vitórias seguidas" />
                <StatCard
                  label="Papel Favorito"
                  value={`${ROLE_ICONS[stats.favoriteRole as PlayerRole] ?? "❓"}`}
                  sub={ROLE_NAMES[stats.favoriteRole as PlayerRole] ?? stats.favoriteRole}
                />
                <StatCard label="Total de Partidas" value={stats.totalGames} />
              </div>
            </FadeIn>

            {/* Histórico */}
            <FadeIn delay={0.3}>
              <div className="glass rounded-xl border border-white/6 p-4 mb-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] font-semibold mb-3">Últimas Partidas</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.history.slice(0, 20).map((m) => (
                    <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${
                      m.won
                        ? "border-green-900/40 bg-green-950/20"
                        : "border-red-900/40 bg-red-950/10"
                    }`}>
                      <span className="text-base">{ROLE_ICONS[m.role as PlayerRole] ?? "❓"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{ROLE_NAMES[m.role as PlayerRole] ?? m.role}</p>
                        <p className="text-gray-600 font-mono">{new Date(m.date).toLocaleDateString("pt-BR")} · {m.players}p</p>
                      </div>
                      <span className={`font-black uppercase tracking-widest ${m.won ? "text-green-400" : "text-red-500"}`}>
                        {m.won ? "WIN" : "LOSS"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Limpar histórico */}
            <FadeIn delay={0.4}>
              {confirmClear ? (
                <div className="glass rounded-xl border border-red-900/40 p-4 text-center space-y-3">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Tem certeza? Isso apaga tudo.</p>
                  <div className="flex gap-2">
                    <button onClick={handleClear} className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-colors">
                      Apagar Tudo
                    </button>
                    <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2.5 rounded-xl border border-white/6 text-gray-700 hover:text-red-500 hover:border-red-900/40 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  🗑 Limpar Histórico
                </button>
              )}
            </FadeIn>
          </>
        )}
      </div>
    </main>
  );
}
