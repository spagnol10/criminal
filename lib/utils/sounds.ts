/**
 * Sons sintetizados via Web Audio API — zero dependências externas.
 * Todos os efeitos são gerados programaticamente (osciladores + filtros).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function gain(value: number, at: number, ac: AudioContext): GainNode {
  const g = ac.createGain();
  g.gain.setValueAtTime(value, at);
  return g;
}

/* ── Clique / confirmação ── */
export function playClick() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.15, t, ac);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/* ── Erro / negação ── */
export function playError() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.2, t, ac);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

/* ── Jogador entrou na sala ── */
export function playJoin() {
  const ac = getCtx();
  const t = ac.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = gain(0.1, t + i * 0.08, ac);
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.15);
  });
}

/* ── Jogo iniciando / suspense ── */
export function playGameStart() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Bombo
  const osc = ac.createOscillator();
  const g = gain(0.4, t, ac);
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.6);
  // Acorde tenso
  [220, 277, 370].forEach((freq) => {
    const o2 = ac.createOscillator();
    const g2 = gain(0.05, t + 0.3, ac);
    o2.type = "triangle";
    o2.frequency.value = freq;
    g2.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    o2.connect(g2).connect(ac.destination);
    o2.start(t + 0.3);
    o2.stop(t + 1.5);
  });
}

/* ── Fase Noite ── */
export function playNight() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const g = gain(0.15, t, ac);
  filter.type = "lowpass";
  filter.frequency.value = 400;
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 1.5);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  osc.connect(filter).connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 1.8);
}

/* ── Fase Dia ── */
export function playDay() {
  const ac = getCtx();
  const t = ac.currentTime;
  [392, 494, 587].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = gain(0.08, t + i * 0.12, ac);
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
    o.connect(g).connect(ac.destination);
    o.start(t + i * 0.12);
    o.stop(t + i * 0.12 + 0.4);
  });
}

/* ── Eliminação / morte ── */
export function playEliminated() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.25, t, ac);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  // Distorção leve
  const wave = ac.createWaveShaper();
  wave.curve = (() => {
    const n = 256, arr = new Float32Array(n);
    for (let i = 0; i < n; i++) arr[i] = ((2 * i) / n - 1) < 0 ? -1 : 1;
    return arr;
  })();
  osc.connect(wave).connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.9);
}

/* ── Votação ── */
export function playVote() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.12, t, ac);
  osc.type = "square";
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.setValueAtTime(294, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

/* ── Vitória ── */
export function playVictory() {
  const ac = getCtx();
  const t = ac.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = gain(0.12, t + i * 0.15, ac);
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.5);
    o.connect(g).connect(ac.destination);
    o.start(t + i * 0.15);
    o.stop(t + i * 0.15 + 0.5);
  });
}

/* ── Derrota ── */
export function playDefeat() {
  const ac = getCtx();
  const t = ac.currentTime;
  [392, 330, 262, 220].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = gain(0.1, t + i * 0.18, ac);
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.5);
    o.connect(g).connect(ac.destination);
    o.start(t + i * 0.18);
    o.stop(t + i * 0.18 + 0.5);
  });
}

/* ── Timer urgente (< 10s) — tick ── */
export function playTick() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.08, t, ac);
  osc.type = "square";
  osc.frequency.value = 1200;
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.04);
}

/* ── Mensagem recebida ── */
export function playMessage() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = gain(0.06, t, ac);
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}
