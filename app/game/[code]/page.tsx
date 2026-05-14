"use client";
import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../../lib/store/gameStore";
import { useSocketEvents, usePhaseTimer } from "../../../lib/hooks/useSocket";
import { getSocket } from "../../../lib/socket/client";
import {
  PhaseBanner,
  PlayerCard,
  RoleRevealCard,
  ChatBox,
  NightEventBanner,
  AliveCounter,
} from "../../../components/game";
import { Card, FadeIn, Badge } from "../../../components/ui";
import { PHASE_DURATIONS, ROLE_NAMES, ROLE_ICONS } from "../../../lib/utils/gameEngine";
import type { PlayerRole } from "../../../lib/types/game";

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  use(params);
  useSocketEvents();
  const timer = usePhaseTimer();

  const { phase, players, myPlayer, myRole, messages, nightResult, randomEvent } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionSent, setActionSent] = useState(false);
  const [showRoleCard, setShowRoleCard] = useState(true);

  const maxTimer = PHASE_DURATIONS[phase] ?? 0;

  function sendNightAction(targetId: string) {
    if (!myRole || actionSent) return;
    const actionMap: Record<string, "kill" | "save" | "investigate"> = {
      killer: "kill",
      accomplice: "kill",
      doctor: "save",
      investigator: "investigate",
    };
    const action = actionMap[myRole];
    if (!action) return;

    getSocket().emit("game:night_action", {
      playerId: myPlayer!.id,
      targetId,
      action,
    });
    setSelectedTarget(targetId);
    setActionSent(true);
  }

  function sendVote(targetId: string) {
    getSocket().emit("game:vote", { targetId });
    setSelectedTarget(targetId);
  }

  function sendChat(content: string, type: "public" | "private" = "public") {
    getSocket().emit("chat:send", { content, type });
  }

  const canActNight =
    phase === "NIGHT" &&
    myPlayer?.isAlive &&
    myRole &&
    ["killer", "accomplice", "doctor", "investigator"].includes(myRole) &&
    !actionSent;

  const canVote = phase === "VOTING" && myPlayer?.isAlive && !selectedTarget;
  const canChat = phase === "DAY" && myPlayer?.isAlive;
  const canPrivateChat =
    phase === "NIGHT" &&
    myPlayer?.isAlive &&
    (myRole === "killer" || myRole === "accomplice");

  // Reset action state on phase change
  if (phase !== "NIGHT" && actionSent) setActionSent(false);
  if (phase !== "VOTING" && selectedTarget && phase !== "NIGHT") setSelectedTarget(null);

  return (
    <main className="min-h-screen flex flex-col px-3 py-4 max-w-2xl mx-auto gap-4">
      {/* Phase banner */}
      <PhaseBanner phase={phase} timer={timer} maxTimer={maxTimer} />

      {/* Role card reveal on starting */}
      <AnimatePresence>
        {phase === "STARTING" && myRole && showRoleCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setShowRoleCard(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <RoleRevealCard role={myRole} />
              <button
                onClick={() => setShowRoleCard(false)}
                className="mt-6 mx-auto block text-gray-500 hover:text-white text-sm transition-colors"
              >
                Clique para fechar ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Night result */}
      <AnimatePresence>
        {phase === "DAY" && nightResult && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${
              nightResult.killedId
                ? "bg-red-950/60 border-red-900"
                : "bg-green-950/40 border-green-900"
            }`}
          >
            {nightResult.killedId ? (
              <p className="text-red-300 font-semibold">
                💀 <strong>{nightResult.killedNickname}</strong> foi assassinado(a) durante a noite.
              </p>
            ) : (
              <p className="text-green-300 font-semibold">
                🩺 O médico salvou alguém! Ninguém morreu essa noite.
              </p>
            )}
            {nightResult.investigationResult && myRole === "investigator" && (
              <p className={`mt-2 text-sm font-medium ${nightResult.investigationResult.isKiller ? "text-red-400" : "text-green-400"}`}>
                🔍 Resultado da investigação: {nightResult.investigationResult.targetNickname} é{" "}
                {nightResult.investigationResult.isKiller ? "CULPADO 🔪" : "INOCENTE ✅"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random event */}
      <AnimatePresence>
        {randomEvent && <NightEventBanner event={randomEvent} />}
      </AnimatePresence>

      {/* My role badge */}
      {myRole && (
        <FadeIn>
          <div className="flex items-center gap-2">
            <AliveCounter players={players} />
            <div className="ml-auto flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">
              <span>{ROLE_ICONS[myRole as PlayerRole]}</span>
              <span className="text-xs text-gray-400">{ROLE_NAMES[myRole as PlayerRole]}</span>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Players grid */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">
          {canActNight
            ? "🌙 Escolha seu alvo desta noite"
            : canVote
            ? "⚖️ Vote para eliminar um suspeito"
            : "👥 Jogadores"}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === myPlayer?.id}
              selected={selectedTarget === player.id}
              onSelect={
                canActNight && player.id !== myPlayer?.id
                  ? sendNightAction
                  : canVote && player.id !== myPlayer?.id
                  ? sendVote
                  : undefined
              }
              disabled={
                (!canActNight && !canVote) ||
                player.id === myPlayer?.id ||
                !player.isAlive
              }
            />
          ))}
        </div>

        {phase === "NIGHT" && myRole === "citizen" && (
          <p className="text-center text-gray-600 text-sm mt-3">
            👤 Como cidadão, você aguarda o amanhecer…
          </p>
        )}
        {(canActNight || canVote) && (
          <p className="text-center text-gray-600 text-xs mt-3">
            Clique em um jogador para {canActNight ? "agir" : "votar"}
          </p>
        )}
      </Card>

      {/* Chat */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-500">
            {canPrivateChat ? "🔪 Chat dos Assassinos" : "💬 Chat"}
          </h3>
          {canPrivateChat && <Badge color="red">privado</Badge>}
        </div>
        <ChatBox
          messages={messages.filter(
            (m) =>
              m.type === "public" ||
              m.type === "narrator" ||
              m.type === "system" ||
              (m.type === "private" && canPrivateChat)
          )}
          onSend={(text) =>
            sendChat(text, canPrivateChat ? "private" : "public")
          }
          canSend={canChat || canPrivateChat}
          placeholder={
            canPrivateChat
              ? "Mensagem privada para assassinos…"
              : "Discussão pública…"
          }
        />
      </div>
    </main>
  );
}
