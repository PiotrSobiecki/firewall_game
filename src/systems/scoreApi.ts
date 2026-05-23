/**
 * Klient API rankingu (Cloudflare Worker + Neon). Granica systemu (sieć) —
 * sceny używają tych funkcji; logika sortowania jest w czystym [[ranking]].
 */
import { API_BASE } from "../config";
import type { RunResult } from "./ranking";

/** Pobiera globalny TOP 10. Rzuca przy braku sieci/błędzie (caller pokazuje fallback). */
export async function fetchTopScores(): Promise<RunResult[]> {
  const res = await fetch(`${API_BASE}/scores`);
  if (!res.ok) throw new Error(`GET /scores → ${res.status}`);
  const data = (await res.json()) as RunResult[];
  if (!Array.isArray(data)) throw new Error("GET /scores → zła odpowiedź");
  return data;
}

/** Zapisuje wynik rundy do globalnego rankingu. */
export async function submitScore(result: RunResult): Promise<void> {
  const res = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) throw new Error(`POST /scores → ${res.status}`);
}
