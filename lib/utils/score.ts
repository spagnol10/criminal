/**
 * Sistema de pontuação e histórico de partidas — persiste no localStorage.
 */

export interface MatchRecord {
  id: string;
  date: string;         // ISO string
  role: string;
  team: "killers" | "innocents";
  winner: "killers" | "innocents" | "draw";
  won: boolean;
  players: number;
}

export interface ScoreStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;       // 0-100
  currentStreak: number;
  bestStreak: number;
  favoriteRole: string;
  history: MatchRecord[];
}

const KEY = "criminal_score";

function load(): MatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(records: MatchRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records.slice(-100))); // mantém últimas 100
}

export function recordMatch(match: Omit<MatchRecord, "id" | "date">) {
  const records = load();
  records.push({
    ...match,
    id: Math.random().toString(36).slice(2),
    date: new Date().toISOString(),
  });
  save(records);
}

export function getStats(): ScoreStats {
  const history = load();

  if (history.length === 0) {
    return { totalGames: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, bestStreak: 0, favoriteRole: "—", history: [] };
  }

  const wins   = history.filter((m) => m.won).length;
  const losses = history.length - wins;

  // Streaks
  let currentStreak = 0;
  let bestStreak    = 0;
  let temp          = 0;
  const lastResult  = history[history.length - 1].won;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].won === lastResult) { temp++; if (i === history.length - currentStreak - 1) currentStreak = temp; }
    else temp = 0;
    bestStreak = Math.max(bestStreak, temp);
  }
  if (!lastResult) currentStreak = 0;

  // Papel favorito
  const roleCounts: Record<string, number> = {};
  history.forEach((m) => { roleCounts[m.role] = (roleCounts[m.role] ?? 0) + 1; });
  const favoriteRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return {
    totalGames: history.length,
    wins,
    losses,
    winRate: Math.round((wins / history.length) * 100),
    currentStreak,
    bestStreak,
    favoriteRole,
    history: history.slice().reverse(), // mais recente primeiro
  };
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
