/**
 * Czysta logika skalowania trudności w czasie (testowalna bez Phasera, PRD #11).
 * Zwraca mnożniki dla HP i prędkości wrogów (rosną) oraz dla interwału spawnu
 * (maleje = częstsze spawny). Liniowy ramp do DIFFICULTY.rampMs, potem cap.
 */
import { DIFFICULTY } from "../config";

export interface DifficultyLevel {
  hpMult: number;
  speedMult: number;
  spawnMult: number;
}

export function difficultyAt(elapsedMs: number): DifficultyLevel {
  const t = Math.max(0, Math.min(1, elapsedMs / DIFFICULTY.rampMs));
  return {
    hpMult: 1 + t * (DIFFICULTY.maxHpMult - 1),
    speedMult: 1 + t * (DIFFICULTY.maxSpeedMult - 1),
    spawnMult: 1 - t * (1 - DIFFICULTY.minSpawnMult),
  };
}
