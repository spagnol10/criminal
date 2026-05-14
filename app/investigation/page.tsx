"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CASES } from "../../lib/data/cases";
import type { InvestigationCase, InvestigationGameState } from "../../lib/types/investigation";
import {
  initInvestigationGame,
  advanceChapter,
  interrogateSuspect,
  castVote,
  resolveVerdict,
  getRevealedEvidence,
  pinEvidence,
  pinSuspect,
  connectEvidence,
  SETTING_LABELS,
} from "../../lib/utils/investigationEngine";

// ────────────────────────────────────────────────────────────
// TELA DE SELEÇÃO DE CASO
// ────────────────────────────────────────────────────────────
function CaseSelectScreen({
  onSelect,
}: {
  onSelect: (c: InvestigationCase) => void;
}) {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔍</div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Investigação Criminal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Escolha um caso para investigar
          </p>
        </div>

        <div className="space-y-4">
          {ALL_CASES.map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(c)}
              className="w-full text-left bg-[#111827] border border-white/8 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-[#161d2e] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl mt-0.5">
                  {c.setting === "medieval" ? "🏰" : "🏛️"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-base group-hover:text-amber-400 transition-colors">
                      {c.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/6 text-gray-400 rounded-full border border-white/8">
                      {SETTING_LABELS[c.setting]}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed italic">
                    &ldquo;{c.tagline}&rdquo;
                  </p>
                  <div className="flex gap-3 mt-3">
                    <span className="text-[10px] text-gray-600">
                      {c.suspects.length} suspeitos
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {c.evidence.length} evidências
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {c.chapters.length} capítulos
                    </span>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-amber-500 transition-colors text-lg">
                  →
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-6 w-full text-gray-600 hover:text-gray-400 text-xs uppercase tracking-widest py-2 transition-colors"
        >
          ← Voltar
        </button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SETUP DO JOGADOR
// ────────────────────────────────────────────────────────────
const AVATARS = ["🕵️","👮","🧑‍⚕️","👩‍🔬","🧑‍💼","👩‍💻","🧙","👺","🎭","🦹","🕶️","🥷"];

function SetupScreen({
  gameCase,
  onStart,
}: {
  gameCase: InvestigationCase;
  onStart: (nickname: string, avatar: string) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("🕵️");

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{avatar}</div>
          <h2 className="text-white font-black text-xl">{gameCase.title}</h2>
          <p className="text-gray-500 text-xs mt-1 italic">&ldquo;{gameCase.tagline}&rdquo;</p>
        </div>

        <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Seu nome
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Detetive..."
              className="mt-1.5 w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 block">
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`h-10 rounded-lg text-xl transition-all ${
                    avatar === a
                      ? "bg-amber-500/20 border border-amber-500/60 scale-110"
                      : "bg-white/4 border border-white/6 hover:bg-white/8"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: nickname.trim() ? 1.02 : 1 }}
          whileTap={{ scale: nickname.trim() ? 0.98 : 1 }}
          disabled={!nickname.trim()}
          onClick={() => onStart(nickname.trim(), avatar)}
          className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Iniciar Investigação
        </motion.button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PAINEL DE NARRATIVA
// ────────────────────────────────────────────────────────────
function NarratorPanel({
  messages,
}: {
  messages: Array<{ id: string; text: string; type: string }>;
}) {
  return (
    <div className="space-y-2">
      {messages.slice(-6).map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-sm leading-relaxed rounded-lg px-3 py-2 border-l-2 ${
            msg.type === "narration"
              ? "border-amber-500/60 bg-amber-950/20 text-amber-100/80"
              : msg.type === "tension"
              ? "border-red-500/60 bg-red-950/20 text-red-200/80"
              : msg.type === "revelation"
              ? "border-purple-500/60 bg-purple-950/20 text-purple-200/80"
              : msg.type === "clue"
              ? "border-blue-500/60 bg-blue-950/20 text-blue-200/80"
              : "border-white/10 bg-white/4 text-gray-400"
          }`}
        >
          {msg.type === "tension" && "⚠️ "}
          {msg.type === "revelation" && "💡 "}
          {msg.type === "clue" && "🔍 "}
          {msg.text}
        </motion.div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CARD DE EVIDÊNCIA
// ────────────────────────────────────────────────────────────
function EvidenceCard({
  evidence,
  isPinned,
  onPin,
  playerRole,
}: {
  evidence: ReturnType<typeof getRevealedEvidence>[number];
  isPinned: boolean;
  onPin: () => void;
  playerRole: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canSeeIfFake =
    playerRole === "analyst" ||
    (playerRole === "forensic" && evidence.category === "forensic") ||
    (playerRole === "hacker" && (evidence.category === "digital" || evidence.category === "financial"));

  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 cursor-pointer transition-all ${
        isPinned
          ? "border-amber-500/50 bg-amber-950/20"
          : "border-white/8 bg-[#111827] hover:border-white/15"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{evidence.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-sm font-semibold truncate">{evidence.title}</span>
            <div className="flex items-center gap-1 shrink-0">
              {canSeeIfFake && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    evidence.isFake
                      ? "bg-red-900/50 text-red-400 border border-red-800/50"
                      : "bg-green-900/50 text-green-400 border border-green-800/50"
                  }`}
                >
                  {evidence.isFake ? "FALSO" : "REAL"}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onPin(); }}
                className={`text-xs transition-colors ${isPinned ? "text-amber-400" : "text-gray-600 hover:text-gray-300"}`}
              >
                📌
              </button>
            </div>
          </div>
          <span className="text-[10px] text-gray-600 uppercase">{evidence.category}</span>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-gray-400 text-xs mt-2 leading-relaxed overflow-hidden"
          >
            {evidence.description}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// PAINEL DE SUSPEITOS
// ────────────────────────────────────────────────────────────
function SuspectCard({
  suspect,
  isPinned,
  onPin,
  onInterrogate,
  accusationCount,
  chapter,
}: {
  suspect: InvestigationCase["suspects"][number];
  isPinned: boolean;
  onPin: () => void;
  onInterrogate: () => void;
  accusationCount: number;
  chapter: number;
}) {
  const emotion = suspect.emotionByChapter[chapter] ?? "calm";
  const emotionEmoji: Record<string, string> = {
    calm: "😐",
    nervous: "😰",
    angry: "😠",
    crying: "😢",
    lying: "🤥",
    hiding: "😶",
    cooperative: "🤝",
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isPinned ? "border-amber-500/40 bg-amber-950/10" : "border-white/8 bg-[#111827]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{suspect.avatar}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold">{suspect.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-base">{emotionEmoji[emotion]}</span>
              <button
                onClick={onPin}
                className={`text-xs transition-colors ${isPinned ? "text-amber-400" : "text-gray-600 hover:text-gray-300"}`}
              >
                📌
              </button>
            </div>
          </div>
          <span className="text-[10px] text-gray-500">{suspect.profession}</span>
          {accusationCount > 0 && (
            <span className="text-[10px] text-amber-500 ml-2">
              {accusationCount}× interrogado
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onInterrogate}
        className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold bg-white/6 hover:bg-amber-600/20 hover:text-amber-300 border border-white/8 hover:border-amber-500/30 transition-all"
      >
        Interrogar
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MODAL DE INTERROGATÓRIO
// ────────────────────────────────────────────────────────────
function InterrogateModal({
  suspectName,
  suspectAvatar,
  onClose,
  onSubmit,
}: {
  suspectName: string;
  suspectAvatar: string;
  onClose: () => void;
  onSubmit: (q: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const PRESET_QUESTIONS = [
    "Onde você estava no momento do crime?",
    "Qual era seu relacionamento com a vítima?",
    "Você tinha motivo para cometer o crime?",
    "Você conhece alguém que poderia ter feito isso?",
    "Você tem algo a esconder?",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="bg-[#111827] border border-white/10 rounded-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{suspectAvatar}</span>
          <div>
            <h3 className="text-white font-bold">Interrogar {suspectName}</h3>
            <p className="text-gray-500 text-xs">Escolha ou escreva sua pergunta</p>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${
                question === q
                  ? "bg-amber-600/20 border border-amber-500/40 text-amber-200"
                  : "bg-white/4 border border-white/6 text-gray-400 hover:bg-white/8"
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ou escreva sua própria pergunta..."
          className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-amber-500/40 mb-3"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-xs text-gray-500 border border-white/8 hover:bg-white/4 transition-all"
          >
            Cancelar
          </button>
          <button
            disabled={!question.trim()}
            onClick={() => { onSubmit(question.trim()); onClose(); }}
            className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
          >
            Interrogar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// TELA DE JULGAMENTO
// ────────────────────────────────────────────────────────────
function JudgmentScreen({
  gameCase,
  state,
  playerId,
  onVote,
  onResolve,
}: {
  gameCase: InvestigationCase;
  state: InvestigationGameState;
  playerId: string;
  onVote: (suspectId: string) => void;
  onResolve: () => void;
}) {
  const myVote = state.votes[playerId];
  const allVoted = state.players.every((p) => state.votes[p.id]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl mb-1">⚖️</div>
        <h2 className="text-white font-black text-lg">Julgamento Final</h2>
        <p className="text-gray-500 text-xs">
          Com base nas evidências, quem cometeu o crime?
        </p>
      </div>

      <div className="space-y-2">
        {gameCase.suspects.map((s) => (
          <button
            key={s.id}
            onClick={() => onVote(s.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              myVote === s.id
                ? "border-red-500/60 bg-red-950/20"
                : "border-white/8 bg-[#111827] hover:border-white/20"
            }`}
          >
            <span className="text-2xl">{s.avatar}</span>
            <div className="flex-1 text-left">
              <div className="text-white text-sm font-semibold">{s.name}</div>
              <div className="text-gray-500 text-xs">{s.profession}</div>
            </div>
            {myVote === s.id && (
              <span className="text-red-400 font-bold text-xs">✓ Acusado</span>
            )}
          </button>
        ))}
      </div>

      {allVoted && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onResolve}
          className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase bg-red-600 hover:bg-red-500 transition-all"
        >
          🔨 Revelar Veredicto
        </motion.button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TELA DE VEREDICTO
// ────────────────────────────────────────────────────────────
function VerdictScreen({
  gameCase,
  state,
  onRestart,
}: {
  gameCase: InvestigationCase;
  state: InvestigationGameState;
  onRestart: () => void;
}) {
  const killer = gameCase.suspects.find((s) => s.isKiller);
  const accused = gameCase.suspects.find((s) => s.id === state.verdict);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl mb-3"
          >
            {state.wasCorrect ? "🎉" : "💀"}
          </motion.div>
          <h2
            className={`text-2xl font-black ${
              state.wasCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {state.wasCorrect ? "Caso Resolvido!" : "Caso em Aberto"}
          </h2>
        </div>

        {/* Veredicto */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 mb-4 space-y-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">
              {state.wasCorrect ? "O culpado foi preso:" : "Vocês acusaram incorretamente:"}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">{accused?.avatar}</span>
              <span className="text-white font-bold text-lg">{accused?.name}</span>
            </div>
          </div>

          {!state.wasCorrect && (
            <div className="border-t border-white/8 pt-3">
              <div className="text-xs text-gray-500 mb-1">O verdadeiro culpado era:</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{killer?.avatar}</span>
                <span className="text-red-400 font-bold">{killer?.name}</span>
              </div>
            </div>
          )}

          <div className="border-t border-white/8 pt-3">
            <div className="text-xs text-gray-500 mb-2">O que realmente aconteceu:</div>
            <p className="text-gray-300 text-xs leading-relaxed italic">
              &ldquo;{gameCase.trueNarrative}&rdquo;
            </p>
          </div>
        </div>

        {/* Placar */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Placar Final</div>
          <div className="space-y-2">
            {[...state.players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs w-4">{i + 1}.</span>
                  <span className="text-lg">{p.avatar}</span>
                  <span className="text-white text-sm flex-1">{p.nickname}</span>
                  <span className="text-amber-400 font-bold text-sm">{p.score}pts</span>
                </div>
              ))}
          </div>
        </div>

        {/* Giro narrativo */}
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 mb-4">
          <div className="text-xs text-amber-500 font-bold mb-1">💡 Reviravolta</div>
          <p className="text-amber-100/70 text-xs leading-relaxed">{gameCase.finalTwist}</p>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-600 hover:bg-amber-500 transition-all"
        >
          Novo Caso
        </button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TELA PRINCIPAL DO JOGO
// ────────────────────────────────────────────────────────────
function GameScreen({
  gameCase,
  state,
  setState,
  playerId,
}: {
  gameCase: InvestigationCase;
  state: InvestigationGameState;
  setState: (s: InvestigationGameState) => void;
  playerId: string;
}) {
  const [tab, setTab] = useState<"narrative" | "evidence" | "suspects" | "board">("narrative");
  const [interrogatingId, setInterrogatingId] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<{
    suspectName: string;
    emotion: string;
    response: string;
    wasLie: boolean;
  } | null>(null);

  const player = state.players.find((p) => p.id === playerId);
  const chapter = gameCase.chapters[state.currentChapter - 1];
  const revealed = getRevealedEvidence(state);
  const isJudgment = state.phase === "JUDGMENT";

  const handleInterrogate = useCallback(
    (suspectId: string, question: string) => {
      const suspect = gameCase.suspects.find((s) => s.id === suspectId);
      if (!suspect || !player || player.accusationsLeft <= 0) return;

      try {
        const { newState, session } = interrogateSuspect(state, gameCase, playerId, suspectId, question);
        setState(newState);
        setLastResponse({
          suspectName: suspect.name,
          emotion: session.emotion,
          response: session.response,
          wasLie: session.wasLie,
        });
      } catch {
        // interrogação inválida
      }
    },
    [state, gameCase, playerId, player, setState]
  );

  const handlePin = (type: "evidence" | "suspect", id: string) => {
    if (type === "evidence") setState(pinEvidence(state, id));
    else setState(pinSuspect(state, id));
  };

  const canAdvance =
    !isJudgment &&
    state.currentChapter < gameCase.chapters.length &&
    state.phase === "INVESTIGATION";

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      {/* Header */}
      <div className="bg-[#111827] border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">
                Cap. {state.currentChapter}/{gameCase.chapters.length}
              </span>
              <span className="text-[10px] text-gray-600">—</span>
              <span className="text-xs text-gray-400">{chapter?.title}</span>
            </div>
            <h1 className="text-white font-black text-sm">{gameCase.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{player?.role.emoji} {player?.role.label}</div>
            <div className="text-xs text-amber-500 font-bold">
              {player?.accusationsLeft ?? 0} interrogações
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0f1520] border-b border-white/6">
        <div className="flex max-w-lg mx-auto">
          {(["narrative", "evidence", "suspects", "board"] as const).map((t) => {
            const labels = {
              narrative: "📰 Narrador",
              evidence: `🔍 Evidências (${revealed.length})`,
              suspects: `👤 Suspeitos`,
              board: "📌 Quadro",
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  tab === t
                    ? "text-amber-400 border-b-2 border-amber-500"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-24">
        {/* Resposta do interrogatório */}
        <AnimatePresence>
          {lastResponse && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-[#111827] border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-white">{lastResponse.suspectName}</span>
                <span className="text-xs text-gray-500">responde:</span>
                {lastResponse.wasLie && (
                  <span className="text-[9px] bg-red-900/50 text-red-400 border border-red-800/40 rounded px-1.5 py-0.5 font-bold">
                    MENTIRA
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm italic">&ldquo;{lastResponse.response}&rdquo;</p>
              <button
                onClick={() => setLastResponse(null)}
                className="mt-2 text-gray-600 text-[10px] hover:text-gray-400"
              >
                Fechar ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "narrative" && (
          <div className="space-y-4">
            {isJudgment ? (
              <JudgmentScreen
                gameCase={gameCase}
                state={state}
                playerId={playerId}
                onVote={(sid) => setState(castVote(state, playerId, sid))}
                onResolve={() => setState(resolveVerdict(state, gameCase))}
              />
            ) : (
              <>
                <NarratorPanel messages={state.narratorMessages} />
                {/* Eventos do capítulo */}
                {state.chapterEvents
                  .filter((e) => state.revealedEventIds.includes(e.id))
                  .map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3"
                    >
                      <div className="text-xs text-purple-400 font-bold mb-1">🔔 {ev.title}</div>
                      <p className="text-purple-200/70 text-xs leading-relaxed">{ev.narrative}</p>
                    </motion.div>
                  ))}
              </>
            )}
          </div>
        )}

        {tab === "evidence" && (
          <div className="space-y-2">
            {revealed.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">
                Nenhuma evidência revelada ainda
              </p>
            ) : (
              revealed.map((ev) => (
                <EvidenceCard
                  key={ev.id}
                  evidence={ev}
                  isPinned={state.board.pinnedEvidenceIds.includes(ev.id)}
                  onPin={() => handlePin("evidence", ev.id)}
                  playerRole={player?.role.role ?? "detective"}
                />
              ))
            )}
          </div>
        )}

        {tab === "suspects" && (
          <div className="space-y-2">
            {gameCase.suspects.map((s) => (
              <SuspectCard
                key={s.id}
                suspect={s}
                isPinned={state.board.pinnedSuspectIds.includes(s.id)}
                onPin={() => handlePin("suspect", s.id)}
                onInterrogate={() => setInterrogatingId(s.id)}
                accusationCount={state.suspectAccusations[s.id] ?? 0}
                chapter={state.currentChapter}
              />
            ))}
          </div>
        )}

        {tab === "board" && (
          <BoardTab
            state={state}
            gameCase={gameCase}
            setState={setState}
          />
        )}
      </div>

      {/* Bottom bar */}
      {!isJudgment && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F19]/95 border-t border-white/8 p-3 backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            {canAdvance ? (
              <button
                onClick={() => setState(advanceChapter(state, gameCase))}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-600 hover:bg-amber-500 transition-all"
              >
                Avançar para Capítulo {state.currentChapter + 1} →
              </button>
            ) : (
              <div className="text-center text-gray-600 text-xs uppercase tracking-wider">
                {isJudgment
                  ? "Todos devem votar para revelar o veredicto"
                  : "Investigue as evidências e suspeitos antes de avançar"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de interrogatório */}
      <AnimatePresence>
        {interrogatingId && (
          <InterrogateModal
            suspectName={gameCase.suspects.find((s) => s.id === interrogatingId)?.name ?? ""}
            suspectAvatar={gameCase.suspects.find((s) => s.id === interrogatingId)?.avatar ?? ""}
            onClose={() => setInterrogatingId(null)}
            onSubmit={(q) => {
              handleInterrogate(interrogatingId, q);
              setInterrogatingId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// QUADRO INVESTIGATIVO
// ────────────────────────────────────────────────────────────
function BoardTab({
  state,
  gameCase,
  setState,
}: {
  state: InvestigationGameState;
  gameCase: InvestigationCase;
  setState: (s: InvestigationGameState) => void;
}) {
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectLabel, setConnectLabel] = useState("");

  const revealed = getRevealedEvidence(state);
  const pinnedEvidence = revealed.filter((e) => state.board.pinnedEvidenceIds.includes(e.id));
  const pinnedSuspects = gameCase.suspects.filter((s) =>
    state.board.pinnedSuspectIds.includes(s.id)
  );

  const handleConnect = (toId: string) => {
    if (!connectFrom || connectFrom === toId) {
      setConnectFrom(toId);
      return;
    }
    if (connectLabel.trim()) {
      setState(connectEvidence(state, connectFrom, toId, connectLabel));
      setConnectFrom(null);
      setConnectLabel("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#111827] border border-white/8 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-1">📌 Quadro Investigativo</h3>
        <p className="text-gray-500 text-xs mb-3">
          Fixe evidências e suspeitos para criar conexões
        </p>

        {/* Conexões */}
        {state.board.connections.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              Conexões ({state.board.connections.length})
            </div>
            <div className="space-y-1">
              {state.board.connections.map((c, i) => {
                const fromEv = state.evidence.find((e) => e.id === c.from);
                const toEv = state.evidence.find((e) => e.id === c.to);
                const fromSus = gameCase.suspects.find((s) => s.id === c.from);
                const toSus = gameCase.suspects.find((s) => s.id === c.to);
                const fromLabel = fromEv?.title ?? fromSus?.name ?? c.from;
                const toLabel = toEv?.title ?? toSus?.name ?? c.to;

                return (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      c.strength === "strong"
                        ? "bg-red-950/30 border border-red-900/30 text-red-300"
                        : "bg-white/4 border border-white/6 text-gray-400"
                    }`}
                  >
                    <span className="font-medium">{fromLabel}</span>
                    <span className="text-gray-600">→</span>
                    <span className="font-medium">{toLabel}</span>
                    <span className="text-gray-600 italic ml-1">({c.label})</span>
                    {c.strength === "strong" && (
                      <span className="text-[9px] text-red-400 ml-auto font-bold">FORTE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Criar conexão */}
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            {connectFrom ? `Conectando: selecione o destino` : "Criar conexão"}
          </div>

          {connectFrom && (
            <input
              value={connectLabel}
              onChange={(e) => setConnectLabel(e.target.value)}
              placeholder="Descreva a conexão..."
              className="w-full mb-2 bg-[#0B0F19] border border-amber-500/30 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none"
            />
          )}

          <div className="grid grid-cols-2 gap-1.5">
            {[...pinnedEvidence, ...pinnedSuspects].map((item) => {
              const id = "id" in item ? item.id : "";
              const label = "title" in item ? item.title : "name" in item ? (item as {name:string}).name : "";
              const emoji = "emoji" in item ? item.emoji : "avatar" in item ? (item as {avatar:string}).avatar : "";
              return (
                <button
                  key={id}
                  onClick={() => handleConnect(id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all border ${
                    connectFrom === id
                      ? "border-amber-500/60 bg-amber-950/20 text-amber-200"
                      : "border-white/8 bg-white/4 text-gray-300 hover:border-white/20"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {pinnedEvidence.length === 0 && pinnedSuspects.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-4">
              Fixe evidências e suspeitos nas outras abas para criar conexões
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────
type Screen = "case_select" | "setup" | "game" | "verdict";

export default function InvestigationPage() {
  const [screen, setScreen] = useState<Screen>("case_select");
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [gameState, setGameState] = useState<InvestigationGameState | null>(null);
  const [playerId] = useState(() => `player_${Date.now()}`);

  const handleSelectCase = (c: InvestigationCase) => {
    setSelectedCase(c);
    setScreen("setup");
  };

  const handleStart = (nickname: string, avatar: string) => {
    if (!selectedCase) return;
    const state = initInvestigationGame(selectedCase, [
      { id: playerId, nickname, avatar },
    ]);
    setGameState(state);
    setScreen("game");
  };

  const handleRestart = () => {
    setSelectedCase(null);
    setGameState(null);
    setScreen("case_select");
  };

  // Quando veredicto for resolvido, derivar screen diretamente do estado
  const effectiveScreen: Screen =
    gameState?.phase === "VERDICT" ? "verdict" : screen;

  if (effectiveScreen === "case_select") {
    return <CaseSelectScreen onSelect={handleSelectCase} />;
  }

  if (effectiveScreen === "setup" && selectedCase) {
    return <SetupScreen gameCase={selectedCase} onStart={handleStart} />;
  }

  if (effectiveScreen === "verdict" && gameState && selectedCase) {
    return (
      <VerdictScreen
        gameCase={selectedCase}
        state={gameState}
        onRestart={handleRestart}
      />
    );
  }

  if (effectiveScreen === "game" && gameState && selectedCase) {
    return (
      <GameScreen
        gameCase={selectedCase}
        state={gameState}
        setState={setGameState}
        playerId={playerId}
      />
    );
  }

  return null;
}
