/**
 * Czysta logika rankingu (PRD #34) — bez I/O, testowalna w `node`.
 * Pojedyncze źródło reguły sortowania dla frontu; serwer (worker) sortuje tak
 * samo w SQL. Dane płyną z API (globalny ranking), nie z localStorage.
 */
import type { EndReason } from "./RunController";
import { LEADERBOARD_SIZE } from "../config";

/** Pojedynczy wpis rankingu (z imieniem gracza). */
export interface RunResult {
  name: string;
  reason: EndReason;
  score: number;
  timeMs: number;
}

/**
 * Wygrane zawsze nad nie-wygranymi; wygrane między sobą po czasie rosnąco
 * (szybciej = wyżej), przy równym czasie więcej punktów wyżej; nie-wygrane po
 * wyniku malejąco.
 */
export function compareEntries(a: RunResult, b: RunResult): number {
  const aWin = a.reason === "win";
  const bWin = b.reason === "win";
  if (aWin !== bWin) return aWin ? -1 : 1;
  if (aWin) return a.timeMs - b.timeMs || b.score - a.score;
  return b.score - a.score;
}

/** Posortowana kopia listy wg reguły rankingu. */
export function sortEntries(list: RunResult[]): RunResult[] {
  return [...list].sort(compareEntries);
}

/** Pierwsze `n` pozycji rankingu. */
export function topEntries(list: RunResult[], n: number = LEADERBOARD_SIZE): RunResult[] {
  return sortEntries(list).slice(0, n);
}

/** Czy `result` wszedłby do TOP `n` względem podanej listy (czy pytać o imię). */
export function qualifies(
  list: RunResult[],
  result: RunResult,
  n: number = LEADERBOARD_SIZE,
): boolean {
  const merged = sortEntries([...list, result]);
  return merged.indexOf(result) < n;
}

/** Najwyższy wynik na liście (0 dla pustej). */
export function highScore(list: RunResult[]): number {
  return list.reduce((max, e) => Math.max(max, e.score), 0);
}

/** Nick lidera (1. miejsce wg reguły rankingu); "" dla pustej listy. */
export function topName(list: RunResult[]): string {
  return sortEntries(list)[0]?.name ?? "";
}

/**
 * Czy dwa wpisy to ta sama runda (np. wpis gracza po zapisie do API).
 * Serwer zaokrągla score/timeMs — porównanie musi być tolerancyjne.
 */
export function isSameRun(a: RunResult, b: RunResult): boolean {
  return (
    a.name === b.name &&
    a.reason === b.reason &&
    Math.abs(Math.round(a.score) - Math.round(b.score)) <= 1 &&
    Math.abs(Math.round(a.timeMs) - Math.round(b.timeMs)) <= 1
  );
}

/** Indeks wpisu gracza na liście TOP (lub -1). */
export function findPlayerIndex(list: RunResult[], mine: RunResult): number {
  return list.findIndex((e) => isSameRun(e, mine));
}
