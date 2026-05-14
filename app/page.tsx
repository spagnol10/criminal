"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { connectSocket } from "../lib/socket/client";
import { useGameStore } from "../lib/store/gameStore";

const AVATARS = ["🕵️","👮","🧑‍⚕️","👩‍🔬","🧑‍💼","👩‍💻","🧙","👺","🎭","🦹","🕶️","🥷"];

/* ── Partículas de fundo ── */
function Particles() {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (i * 37.7 + 11.3) % 100,
    y: (i * 61.8 + 7.9) % 100,
    size: 1 + (i % 3) * 0.7,
    duration: 6 + (i % 5) * 1.6,
    delay: (i % 7) * 0.6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-red-500/20"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -40, -80] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ── Input ── */
function NeoInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</label>
      <input
        className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-mono text-sm"
        {...props}
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);
  const setRoom    = useGameStore((s) => s.setRoom);

  const [tab,        setTab]        = useState<"create"|"join">("create");
  const [nickname,   setNickname]   = useState("");
  const [avatar,     setAvatar]     = useState(AVATARS[0]);
  const [roomCode,   setRoomCode]   = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isPrivate,  setIsPrivate]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [typed,      setTyped]      = useState("");

  /* typewriter hero */
  const heroText = "QUEM É O ASSASSINO?";
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTyped(heroText.slice(0, ++i));
      if (i >= heroText.length) clearInterval(t);
    }, 60);
    return () => clearInterval(t);
  }, []);

  function withSocket(fn: (socket: ReturnType<typeof connectSocket>) => void) {
    setLoading(true);
    setError("");
    const socket = connectSocket();
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("Servidor inacessível. Tente novamente.");
    }, 8000);
    socket.once("connect_error", () => {
      clearTimeout(timeout);
      setLoading(false);
      setError("Erro de conexão. Verifique sua internet.");
    });
    fn(socket);
    return timeout;
  }

  function handleCreate() {
    if (!nickname.trim()) return setError("Digite um nickname.");
    const timeout = withSocket((socket) => {
      socket.emit("room:create", { nickname: nickname.trim(), avatar, maxPlayers, isPrivate }, (res) => {
        clearTimeout(timeout);
        setLoading(false);
        if ("error" in res) return setError(String(res.error));
        setMyPlayer(res.player);
        setRoom(res.room);
        router.push(`/lobby/${res.room.code}`);
      });
    });
  }

  function handleJoin() {
    if (!nickname.trim()) return setError("Digite um nickname.");
    if (!roomCode.trim()) return setError("Digite o código da sala.");
    const timeout = withSocket((socket) => {
      socket.emit("room:join", { code: roomCode.trim().toUpperCase(), nickname: nickname.trim(), avatar }, (res) => {
        clearTimeout(timeout);
        setLoading(false);
        if ("error" in res) return setError(String(res.error));
        setMyPlayer(res.player);
        setRoom(res.room);
        router.push(`/lobby/${res.room.code}`);
      });
    });
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-[#0B0F19]">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(239,68,68,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(59,130,246,0.04),transparent)]" />
      <Particles />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="text-5xl mb-5 inline-block"
          >
            🔪
          </motion.div>

          <h1 className="font-mono text-xs tracking-[0.3em] text-red-500/70 uppercase mb-3">
            Criminal · Investigação
          </h1>

          <div className="font-black text-2xl sm:text-3xl text-white leading-tight min-h-10">
            {typed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-red-500"
            >|</motion.span>
          </div>

          <p className="text-gray-500 text-sm mt-3 italic">&ldquo;Confie em ninguém.&rdquo;</p>
        </div>

        {/* ── Card principal ── */}
        <div className="glass rounded-2xl p-6 border border-white/6">

          {/* Tabs */}
          <div className="flex bg-[#0B0F19] rounded-lg p-0.5 mb-6 border border-white/6">
            {(["create","join"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 rounded-md text-xs font-bold tracking-widest uppercase transition-all ${
                  tab === t
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "create" ? "Criar Sala" : "Entrar"}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <NeoInput
              label="Nickname"
              placeholder="Ex: Detetive Silva"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
            />

            {/* Avatares */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Avatar</p>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATARS.map((a) => (
                  <motion.button
                    key={a}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      avatar === a
                        ? "bg-red-900/50 border border-red-500/60 shadow-lg shadow-red-900/30"
                        : "bg-[#0B0F19] border border-white/6 hover:border-white/20"
                    }`}
                  >{a}</motion.button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {tab === "create" ? (
                <motion.div key="create" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">
                      Máx. Jogadores — <span className="text-white font-mono">{maxPlayers}</span>
                    </p>
                    <input type="range" min={4} max={12} value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-full accent-red-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono"><span>4</span><span>12</span></div>
                  </div>

                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className="flex items-center gap-3 w-full"
                  >
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${isPrivate ? "bg-red-600" : "bg-gray-700"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isPrivate ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Sala Privada</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div key="join" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <NeoInput
                    label="Código da Sala"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="uppercase tracking-[0.3em] font-mono text-center text-lg"
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                  className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2.5"
                >
                  <span className="text-base">⚠️</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              onClick={tab === "create" ? handleCreate : handleJoin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/30 glow-red flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Conectando…
                </>
              ) : tab === "create" ? "Criar Sala" : "Entrar na Sala"}
            </motion.button>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            { icon:"🎭", label:"Papéis Secretos" },
            { icon:"🌙", label:"Dia & Noite" },
            { icon:"⚖️", label:"Votação" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-3 text-center border border-white/4">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{f.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-700 text-[10px] mt-5 font-mono tracking-wider">
          MIN 4 · MAX 12 JOGADORES
        </p>

        <div className="text-center mt-3 flex flex-col gap-2">
          <button
            onClick={() => router.push("/chronicle")}
            className="text-yellow-700 hover:text-yellow-400 text-[10px] uppercase tracking-widest font-semibold transition-colors border border-yellow-900/40 rounded-lg py-2 px-4 hover:border-yellow-700/50 hover:bg-yellow-950/20"
          >
            � Crônicas do Véu
          </button>
          <button
            onClick={() => router.push("/investigation")}
            className="text-amber-600 hover:text-amber-400 text-[10px] uppercase tracking-widest font-semibold transition-colors border border-amber-900/40 rounded-lg py-2 px-4 hover:border-amber-600/40 hover:bg-amber-950/20"
          >
            🔍 Investigação Narrativa
          </button>
          <button
            onClick={() => router.push("/solo")}
            className="text-gray-500 hover:text-gray-300 text-[10px] uppercase tracking-widest font-semibold transition-colors border border-white/6 rounded-lg py-2 px-4 hover:border-white/12"
          >
            🤖 Jogar Solo (vs Bots)
          </button>
          <button
            onClick={() => router.push("/stats")}
            className="text-gray-700 hover:text-gray-400 text-[10px] uppercase tracking-widest font-semibold transition-colors"
          >
            📊 Minhas Estatísticas
          </button>
        </div>
      </motion.div>
    </main>
  );
}
