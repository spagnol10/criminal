"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CHARACTER_CLASSES,
  KINGDOMS,
  initChronicleGame,
  resolveChoice,
  advanceChronicleChapter,
  getAlignmentColor,
  getAppearanceEmoji,
  getSkyEmoji,
  getPendingChoices,
  getActivePropheciesForPlayer,
} from "../../lib/utils/chronicleEngine";
import type { ChronicleGameState } from "../../lib/types/chronicle";
import type { PlayerClass, KingdomId } from "../../lib/types/chronicle";

const AVATARS = ["🕵️","👮","🧑‍⚕️","👩‍🔬","🧑‍💼","👩‍💻","🧙","👺","🎭","🦹","🕶️","🥷"];

// ────────────────────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (n: string, av: string, cls: PlayerClass, k: KingdomId) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("🧙");
  const [cls, setCls] = useState<PlayerClass | null>(null);
  const [kingdom, setKingdom] = useState<KingdomId | null>(null);

  return (
    <div className="min-h-screen bg-[#080A12] flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👑</div>
          <h1 className="text-3xl font-black text-amber-400 tracking-tight">Crônicas do Véu</h1>
          <p className="text-gray-500 text-sm mt-1 italic">
            &ldquo;Um mundo antigo onde suas escolhas movem profecias.&rdquo;
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step >= s ? "bg-amber-500" : "bg-white/10"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1 — Identidade */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#111827] border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-bold text-lg">Quem és tu?</h2>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Nome</label>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Teu nome neste mundo..."
                  className="mt-1.5 w-full bg-[#0B0F19] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-sm"
                  maxLength={20} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)}
                      className={`h-10 rounded-lg text-xl transition-all ${avatar === a ? "bg-amber-500/25 border-2 border-amber-500/60 scale-110" : "bg-white/4 border border-white/8 hover:bg-white/8"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={!nickname.trim()} onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-600 hover:bg-amber-500 disabled:opacity-40 transition-all">
                Continuar →
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Classe */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <h2 className="text-white font-bold text-lg mb-1">Escolhe teu caminho</h2>
              {CHARACTER_CLASSES.map((c) => (
                <button key={c.id} onClick={() => setCls(c.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${cls === c.id ? "border-amber-500/60 bg-amber-950/20" : "border-white/8 bg-[#111827] hover:border-white/20"}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{c.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-bold text-sm">{c.name}</span>
                        {c.faithBonus > 0
                          ? <span className="text-[9px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded font-bold">+{c.faithBonus} Fé</span>
                          : <span className="text-[9px] text-red-400 bg-red-950/40 border border-red-800/40 px-1.5 py-0.5 rounded font-bold">{c.faithBonus} Fé</span>
                        }
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">{c.description}</p>
                      <p className="text-amber-600 text-[10px] mt-1">✦ {c.ability}</p>
                    </div>
                  </div>
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm text-gray-500 border border-white/8 hover:bg-white/4 transition-all">← Voltar</button>
                <button disabled={!cls} onClick={() => setStep(3)} className="flex-2 grow py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-40 transition-all">
                  Continuar →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Reino */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <h2 className="text-white font-bold text-lg mb-1">De onde vens?</h2>
              {KINGDOMS.map((k) => (
                <button key={k.id} onClick={() => setKingdom(k.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${kingdom === k.id ? "border-amber-500/60 bg-amber-950/20" : "border-white/8 bg-[#111827] hover:border-white/20"}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{k.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm mb-0.5">{k.name}</div>
                      <p className="text-gray-500 text-xs italic">&ldquo;{k.flavor}&rdquo;</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] text-amber-400">🕯️ Fé {k.faithLevel}</span>
                        <span className="text-[10px] text-blue-400">🛡️ Militar {k.militaryPower}</span>
                        <span className="text-[10px] text-red-400">💀 Corrupção {k.corruption}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm text-gray-500 border border-white/8 hover:bg-white/4 transition-all">← Voltar</button>
                <button disabled={!kingdom || !cls} onClick={() => onStart(nickname.trim(), avatar, cls!, kingdom!)}
                  className="flex-2 grow py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-40 transition-all">
                  Entrar no Mundo ✦
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => window.history.back()} className="mt-4 w-full text-gray-700 hover:text-gray-400 text-xs uppercase tracking-widest py-2 transition-colors">
          ← Voltar ao início
        </button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// BARRA DE STATUS DO PERSONAGEM
// ────────────────────────────────────────────────────────────
function PlayerStatusBar({ state }: { state: ChronicleGameState }) {
  const { player, worldState } = state;
  const alignColor = getAlignmentColor(player.alignment);

  return (
    <div className="bg-[#0D1117] border-b border-white/6 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{player.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm">{player.nickname}</span>
              <span className={`text-[10px] text-${alignColor}-400 font-semibold`}>{getAppearanceEmoji(player.appearance)}</span>
            </div>
            <span className={`text-[10px] text-${alignColor}-500`}>{player.title}</span>
          </div>
        </div>

        <div className="flex gap-3 text-xs">
          {/* Fé */}
          <div className="text-center">
            <div className="text-amber-400 font-bold">{player.faith}</div>
            <div className="text-gray-600 text-[9px]">FÉ</div>
          </div>
          {/* Corrupção */}
          <div className="text-center">
            <div className="text-red-400 font-bold">{player.corruption}</div>
            <div className="text-gray-600 text-[9px]">CORRUPÇÃO</div>
          </div>
          {/* Céu */}
          <div className="text-center">
            <div className="text-base">{getSkyEmoji(worldState.skyColor)}</div>
            <div className="text-gray-600 text-[9px]">CÉU</div>
          </div>
        </div>
      </div>

      {/* Barras */}
      <div className="max-w-lg mx-auto mt-2 flex gap-2">
        <div className="flex-1">
          <div className="h-1 bg-white/6 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${player.faith}%` }} className="h-full bg-amber-500 rounded-full" transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="h-1 bg-white/6 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${player.corruption}%` }} className="h-full bg-red-600 rounded-full" transition={{ duration: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PAINEL DE NARRAÇÕES
// ────────────────────────────────────────────────────────────
function NarratorPanel({ entries }: { entries: ChronicleGameState["narratorLog"] }) {
  const typeStyles: Record<string, string> = {
    divine: "border-amber-500/50 bg-amber-950/20 text-amber-100/85",
    dark: "border-red-700/50 bg-red-950/20 text-red-200/80",
    neutral: "border-white/10 bg-white/4 text-gray-300",
    warning: "border-orange-600/50 bg-orange-950/20 text-orange-200/80",
    miracle: "border-purple-500/50 bg-purple-950/20 text-purple-200/85",
    prophecy: "border-yellow-500/50 bg-yellow-950/20 text-yellow-200/85",
  };
  const typeEmoji: Record<string, string> = {
    divine: "✦ ", dark: "☠ ", neutral: "", warning: "⚠ ", miracle: "✨ ", prophecy: "🔮 ",
  };

  return (
    <div className="space-y-2">
      {entries.slice(-8).map((e) => (
        <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className={`text-sm leading-relaxed rounded-lg px-3 py-2.5 border-l-2 ${typeStyles[e.type] ?? typeStyles.neutral}`}>
          {typeEmoji[e.type]}{e.text}
        </motion.div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CARD DE ESCOLHA
// ────────────────────────────────────────────────────────────
function ChoiceCard({
  choice,
  onChoose,
}: {
  choice: ChronicleGameState["availableChoices"][number];
  onChoose: (choiceId: string, optionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${choice.isResolved ? "border-white/4 bg-white/2 opacity-50" : "border-amber-600/30 bg-amber-950/10"}`}>
      <button className="w-full text-left p-4" onClick={() => !choice.isResolved && setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{choice.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">{choice.title}</span>
              {choice.isResolved
                ? <span className="text-[10px] text-green-500 font-bold">✓ Resolvido</span>
                : <span className="text-amber-500 text-xs">▼</span>
              }
            </div>
            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{choice.description}</p>
            <span className="text-[10px] text-gray-600 italic">{choice.context}</span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && !choice.isResolved && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-white/6 p-4 space-y-2">
              {choice.options.map((opt) => (
                <button key={opt.id} onClick={() => { onChoose(choice.id, opt.id); setExpanded(false); }}
                  className="w-full text-left rounded-xl border border-white/8 bg-[#111827] p-3 hover:border-amber-500/40 hover:bg-amber-950/10 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-white font-semibold text-sm group-hover:text-amber-300 transition-colors">{opt.label}</span>
                    <div className="ml-auto flex gap-1.5">
                      {opt.faithDelta !== 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${opt.faithDelta > 0 ? "bg-amber-950/60 text-amber-400 border border-amber-800/40" : "bg-red-950/60 text-red-400 border border-red-800/40"}`}>
                          {opt.faithDelta > 0 ? "+" : ""}{opt.faithDelta} Fé
                        </span>
                      )}
                      {opt.corruptionDelta !== 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${opt.corruptionDelta > 0 ? "bg-red-950/60 text-red-400 border border-red-800/40" : "bg-green-950/60 text-green-400 border border-green-800/40"}`}>
                          {opt.corruptionDelta > 0 ? "+" : ""}{opt.corruptionDelta} Corrupção
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">{opt.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// MAPA DO MUNDO
// ────────────────────────────────────────────────────────────
function WorldMapTab({ state }: { state: ChronicleGameState }) {
  return (
    <div className="space-y-3">
      <div className="bg-[#111827] border border-white/8 rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">Estado do Mundo</h3>
          <span className="text-xs text-gray-500">{state.worldAge}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`rounded-lg p-2 ${state.worldState.eclipse ? "bg-red-950/30 border border-red-800/30" : "bg-white/4 border border-white/6"}`}>
            <div className="text-lg">{state.worldState.eclipse ? "🌑" : "☀️"}</div>
            <div className="text-[10px] text-gray-500">{state.worldState.eclipse ? "Eclipse" : "Normal"}</div>
          </div>
          <div className={`rounded-lg p-2 ${state.worldState.warActive ? "bg-red-950/30 border border-red-800/30" : "bg-white/4 border border-white/6"}`}>
            <div className="text-lg">{state.worldState.warActive ? "⚔️" : "🕊️"}</div>
            <div className="text-[10px] text-gray-500">{state.worldState.warActive ? "Em Guerra" : "Paz"}</div>
          </div>
          <div className={`rounded-lg p-2 ${state.worldState.chaosLevel > 50 ? "bg-orange-950/30 border border-orange-800/30" : "bg-white/4 border border-white/6"}`}>
            <div className="text-lg">{state.worldState.chaosLevel > 70 ? "🌀" : state.worldState.chaosLevel > 40 ? "⚡" : "✨"}</div>
            <div className="text-[10px] text-gray-500">Caos {state.worldState.chaosLevel}</div>
          </div>
        </div>
      </div>

      {state.kingdoms.map((k) => (
        <div key={k.id} className={`rounded-xl border p-4 ${k.id === state.player.kingdom ? "border-amber-500/30 bg-amber-950/10" : "border-white/8 bg-[#111827]"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{k.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{k.name}</span>
                {k.id === state.player.kingdom && <span className="text-[9px] text-amber-400 font-bold">SEU REINO</span>}
              </div>
              <span className="text-[10px] text-gray-500">{k.rulerEmoji} {k.rulerTitle} {k.rulerName}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Fé", value: k.faithLevel, color: "amber" },
              { label: "Estabilidade", value: k.stability, color: "blue" },
              { label: "Corrupção", value: k.corruption, color: "red" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className={`text-${stat.color}-500`}>{stat.value}</span>
                </div>
                <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${stat.color}-500 rounded-full transition-all`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PAINEL DE PROFECIAS
// ────────────────────────────────────────────────────────────
function PropheciesTab({ state }: { state: ChronicleGameState }) {
  const active = getActivePropheciesForPlayer(state);

  return (
    <div className="space-y-3">
      {active.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-8">Nenhuma profecia ativa ainda</p>
      )}

      {state.fulfilledProphecies.map((p) => (
        <div key={p.id} className="rounded-xl border border-green-800/30 bg-green-950/10 p-4 opacity-70">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-xs font-bold">✓ CUMPRIDA</span>
          </div>
          <p className="text-green-300/70 text-sm italic">&ldquo;{p.text}&rdquo;</p>
        </div>
      ))}

      {active.map((p) => (
        <motion.div key={p.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-yellow-600/30 bg-yellow-950/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔮</span>
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Profecia Ativa</span>
          </div>
          <p className="text-yellow-200/80 text-sm leading-relaxed italic mb-2">&ldquo;{p.text}&rdquo;</p>
          <p className="text-yellow-600 text-xs">{p.interpretation}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TELA DE FIM
// ────────────────────────────────────────────────────────────
function EndScreen({ state, onRestart }: { state: ChronicleGameState; onRestart: () => void }) {
  const { player } = state;
  const isLight = player.alignment === "light";
  const isShadow = player.alignment === "shadow";

  const endingTitle = isShadow
    ? "O Mundo Caiu nas Sombras"
    : isLight
    ? "A Luz Prevaleceu"
    : "O Equilíbrio Foi Mantido";

  const endingText = isShadow
    ? `${player.nickname} escolheu o poder das trevas. O Véu se rasgou. O que estava do outro lado entrou. O mundo que existia antes não existe mais.`
    : isLight
    ? `${player.nickname} manteve a fé. Os Véus resistiram. A história registrará este nome entre os que seguraram o mundo de pé.`
    : `${player.nickname} caminhou na linha tênue entre luz e sombra. O mundo sobreviveu — por um fio.`;

  return (
    <div className="min-h-screen bg-[#080A12] flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl mb-3">
            {isShadow ? "🌑" : isLight ? "👑" : "⚖️"}
          </motion.div>
          <h2 className={`text-2xl font-black ${isShadow ? "text-red-400" : isLight ? "text-amber-400" : "text-gray-300"}`}>
            {endingTitle}
          </h2>
        </div>

        <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 mb-4 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed italic">&ldquo;{endingText}&rdquo;</p>

          <div className="border-t border-white/8 pt-3">
            <div className="text-xs text-gray-500 mb-3">Legado de {player.nickname}</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: "Fé Final", value: player.faith, color: "amber" },
                { label: "Corrupção", value: player.corruption, color: "red" },
                { label: "Milagres", value: player.stats.miraclesPerformed, color: "purple" },
                { label: "Traições", value: player.stats.betrayalsCommitted, color: "orange" },
                { label: "Vidas Salvas", value: player.stats.livesProtected, color: "green" },
                { label: "Profecias", value: state.fulfilledProphecies.length, color: "yellow" },
              ].map((s) => (
                <div key={s.label} className="bg-white/4 border border-white/6 rounded-lg p-2">
                  <div className={`text-${s.color}-400 font-bold text-lg`}>{s.value}</div>
                  <div className="text-gray-600 text-[9px] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Capítulos resolvidos */}
          <div className="border-t border-white/8 pt-3">
            <div className="text-xs text-gray-500 mb-2">Escolhas feitas: {state.resolvedChoices.length}/{state.resolvedChoices.length + state.availableChoices.filter((c) => !c.isResolved).length}</div>
            <div className="space-y-1">
              {state.resolvedChoices.map((c) => {
                const chosen = c.options.find((o) => o.id === c.chosenOptionId);
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{c.emoji}</span>
                    <span className="flex-1">{c.title}</span>
                    <span className="text-gray-600">{chosen?.emoji} {chosen?.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button onClick={onRestart} className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-600 hover:bg-amber-500 transition-all">
          Nova Crônica
        </button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TELA PRINCIPAL DO JOGO
// ────────────────────────────────────────────────────────────
function GameScreen({
  state,
  setState,
  onFinish,
}: {
  state: ChronicleGameState;
  setState: (s: ChronicleGameState) => void;
  onFinish: () => void;
}) {
  const [tab, setTab] = useState<"story" | "choices" | "world" | "prophecies">("story");

  const pending = getPendingChoices(state);
  const canAdvance = state.chapter < 5 && pending.length === 0;
  const isLastChapter = state.chapter === 5;

  const handleChoose = (choiceId: string, optionId: string) => {
    setState(resolveChoice(state, choiceId, optionId));
  };

  return (
    <div className="min-h-screen bg-[#080A12] flex flex-col">
      {/* Status bar */}
      <PlayerStatusBar state={state} />

      {/* Chapter header */}
      <div className="bg-[#080A12] px-4 py-2 border-b border-white/4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">
              Capítulo {state.chapter}/5 — {state.worldAge}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            {state.worldState.eclipse && <span className="text-red-500">🌑 Eclipse</span>}
            {state.worldState.warActive && <span className="text-red-400">⚔️ Guerra</span>}
            {state.worldState.plague && <span className="text-purple-400">☠️ Praga</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0D1117] border-b border-white/4">
        <div className="flex max-w-lg mx-auto">
          {([
            ["story", "📜 História"],
            ["choices", `⚖️ Escolhas${pending.length > 0 ? ` (${pending.length})` : ""}`],
            ["world", "🌍 Mundo"],
            ["prophecies", `🔮 Profecias`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${tab === t ? "text-amber-400 border-b-2 border-amber-500" : "text-gray-600 hover:text-gray-400"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-28">

        {/* Eventos ativos */}
        <AnimatePresence>
          {state.activeEvents.map((ev) => (
            <motion.div key={ev.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="mb-4 bg-[#111827] border border-purple-600/20 rounded-xl overflow-hidden">
              <div className="bg-purple-950/30 px-4 py-2 flex items-center gap-2">
                <span className="text-xl">{ev.emoji}</span>
                <span className="text-purple-300 font-bold text-sm">{ev.title}</span>
                <span className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                  ev.type === "war" ? "bg-red-900/40 text-red-400" :
                  ev.type === "miracle" ? "bg-amber-900/40 text-amber-400" :
                  ev.type === "plague" ? "bg-purple-900/40 text-purple-400" :
                  "bg-white/6 text-gray-400"
                }`}>{ev.type}</span>
              </div>
              <div className="p-4 space-y-1.5">
                {ev.narrative.map((line, i) => (
                  <p key={i} className="text-gray-300 text-sm leading-relaxed">{line}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tab === "story" && <NarratorPanel entries={state.narratorLog} />}
        {tab === "choices" && (
          <div className="space-y-3">
            {state.availableChoices.filter((c) => c.chapter <= state.chapter).length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Nenhuma escolha disponível neste capítulo</p>
            ) : (
              state.availableChoices
                .filter((c) => c.chapter <= state.chapter)
                .map((c) => <ChoiceCard key={c.id} choice={c} onChoose={handleChoose} />)
            )}
          </div>
        )}
        {tab === "world" && <WorldMapTab state={state} />}
        {tab === "prophecies" && <PropheciesTab state={state} />}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080A12]/95 border-t border-white/6 p-3 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          {isLastChapter && pending.length === 0 ? (
            <button onClick={onFinish}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-600 hover:bg-amber-500 transition-all">
              ✦ Ver seu Legado
            </button>
          ) : canAdvance ? (
            <button onClick={() => setState(advanceChronicleChapter(state))}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-amber-700 hover:bg-amber-600 transition-all">
              Avançar para Capítulo {state.chapter + 1} →
            </button>
          ) : (
            <div className="text-center text-gray-600 text-[10px] uppercase tracking-wider">
              {pending.length > 0
                ? `${pending.length} escolha(s) pendente(s) — resolva para avançar`
                : "Explorando o capítulo final..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────
type Screen = "setup" | "game" | "end";

export default function ChroniclePage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [gameState, setGameState] = useState<ChronicleGameState | null>(null);

  const handleStart = (nickname: string, avatar: string, cls: PlayerClass, kingdom: KingdomId) => {
    setGameState(initChronicleGame(nickname, avatar, cls, kingdom));
    setScreen("game");
  };

  const handleFinish = () => setScreen("end");
  const handleRestart = () => { setGameState(null); setScreen("setup"); };

  if (screen === "setup") return <SetupScreen onStart={handleStart} />;
  if (screen === "end" && gameState) return <EndScreen state={gameState} onRestart={handleRestart} />;
  if (screen === "game" && gameState) return (
    <GameScreen state={gameState} setState={setGameState} onFinish={handleFinish} />
  );
  return null;
}
