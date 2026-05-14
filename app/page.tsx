"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { connectSocket } from "../lib/socket/client";
import { useGameStore } from "../lib/store/gameStore";
import { Button, Input, Card, FadeIn } from "../components/ui";

const AVATARS = ["🕵️", "👮", "🧑‍⚕️", "👩‍🔬", "🧑‍💼", "👩‍💻", "🧙", "👺", "🎭", "🦹", "🕶️", "🥷"];

export default function HomePage() {
  const router = useRouter();
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);
  const setRoom = useGameStore((s) => s.setRoom);

  const [tab, setTab] = useState<"create" | "join">("create");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!nickname.trim()) return setError("Digite um nickname.");
    setLoading(true);
    setError("");
    const socket = connectSocket();
    socket.emit(
      "room:create",
      { nickname: nickname.trim(), avatar, maxPlayers, isPrivate },
      (res) => {
        setLoading(false);
        if ("error" in res) return setError(String(res.error));
        setMyPlayer(res.player);
        setRoom(res.room);
        router.push(`/lobby/${res.room.code}`);
      }
    );
  }

  async function handleJoin() {
    if (!nickname.trim()) return setError("Digite um nickname.");
    if (!roomCode.trim()) return setError("Digite o código da sala.");
    setLoading(true);
    setError("");
    const socket = connectSocket();
    socket.emit(
      "room:join",
      { code: roomCode.trim().toUpperCase(), nickname: nickname.trim(), avatar },
      (res) => {
        setLoading(false);
        if ("error" in res) return setError(String(res.error));
        setMyPlayer(res.player);
        setRoom(res.room);
        router.push(`/lobby/${res.room.code}`);
      }
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a0a0a_0%,_#050507_70%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-900/10 blur-[120px] pointer-events-none rounded-full" />

      <FadeIn className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-6xl mb-4"
          >
            🔪
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            JOGO{" "}
            <span className="text-red-500">CRIMINALISTA</span>
          </h1>
          <p className="text-gray-500 text-sm">
            Deduza. Investigue. Sobreviva.
          </p>
        </div>

        <Card className="p-6">
          {/* Tabs */}
          <div className="flex bg-gray-800/60 rounded-lg p-1 mb-6">
            {(["create", "join"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-red-700 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "create" ? "🏠 Criar Sala" : "🚪 Entrar"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Nickname */}
            <Input
              label="Seu Nickname"
              placeholder="Ex: Detetive Silva"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />

            {/* Avatar */}
            <div>
              <label className="text-sm font-medium text-gray-400 tracking-wide block mb-2">
                Seu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      avatar === a
                        ? "bg-red-800 border-2 border-red-500 scale-110"
                        : "bg-gray-800 border border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {tab === "create" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-400 tracking-wide block mb-2">
                    Máx. Jogadores: <span className="text-white">{maxPlayers}</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>4</span><span>12</span>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      isPrivate ? "bg-red-700" : "bg-gray-700"
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      isPrivate ? "left-5" : "left-0.5"
                    }`} />
                  </div>
                  <span className="text-sm text-gray-400">Sala Privada</span>
                </label>
              </>
            )}

            {tab === "join" && (
              <Input
                label="Código da Sala"
                placeholder="Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="uppercase tracking-widest font-mono"
              />
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2"
              >
                ⚠️ {error}
              </motion.p>
            )}

            <Button
              size="lg"
              className="w-full"
              loading={loading}
              onClick={tab === "create" ? handleCreate : handleJoin}
            >
              {tab === "create" ? "Criar Sala" : "Entrar na Sala"}
            </Button>
          </div>
        </Card>

        {/* Info */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🎭", label: "Papéis Secretos" },
            { icon: "🌙", label: "Fases Dia/Noite" },
            { icon: "⚖️", label: "Votação" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-900/40 border border-gray-800 rounded-xl p-3">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Mínimo 4 jogadores · Máximo 12 jogadores
        </p>
      </FadeIn>
    </main>
  );
}
