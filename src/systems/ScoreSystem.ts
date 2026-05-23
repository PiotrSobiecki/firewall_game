/**
 * Czysta logika punktacji (testowalna bez Phasera).
 * - punkty za typ wroga (tabela ENEMY_POINTS),
 * - combo: kolejne zabójstwa w oknie COMBO.windowMs podnoszą mnożnik do ×3,
 * - bonus za przejście fali,
 * - kara za śmierć (−RESPAWN_PENALTY, nie poniżej 0) + reset combo.
 */
import {
  ENEMY_POINTS,
  TARGET_SCORE,
  RESPAWN_PENALTY,
  COMBO,
  WAVE_BONUS,
  type EnemyType,
} from "../config";

export class ScoreSystem {
  private _score = 0;
  private _combo = 0; // liczba zabójstw w bieżącej serii
  private lastKillAt = -Infinity;

  get score(): number {
    return this._score;
  }

  /** Bieżący mnożnik combo z uwzględnieniem upływu okna względem `now`. */
  multiplierAt(now: number): number {
    if (now - this.lastKillAt > COMBO.windowMs) return 1;
    return Math.min(COMBO.maxMultiplier, Math.max(1, this._combo));
  }

  /** Wielkość serii combo (0, gdy okno wygasło) — do HUD. */
  comboAt(now: number): number {
    return now - this.lastKillAt > COMBO.windowMs ? 0 : this._combo;
  }

  /**
   * Rejestruje eliminację wroga w chwili `now`; nalicza punkty z mnożnikiem
   * combo i zwraca przyznane punkty (po mnożniku).
   */
  addKill(type: EnemyType, now: number): number {
    this._combo = now - this.lastKillAt <= COMBO.windowMs ? this._combo + 1 : 1;
    this.lastKillAt = now;
    const mult = Math.min(COMBO.maxMultiplier, this._combo);
    const points = ENEMY_POINTS[type] * mult;
    this._score += points;
    return points;
  }

  /** Bonus za przejście fali (nie zmienia combo). */
  addWaveBonus(): number {
    this._score += WAVE_BONUS;
    return WAVE_BONUS;
  }

  /** Kara za śmierć (PRD #18): odejmuje punkty (nie poniżej 0) i resetuje combo. */
  onDeath(): void {
    this._score = Math.max(0, this._score - RESPAWN_PENALTY);
    this._combo = 0;
    this.lastKillAt = -Infinity;
  }

  /** Czy osiągnięto próg wygranej (TARGET_SCORE). */
  hasReachedTarget(): boolean {
    return this._score >= TARGET_SCORE;
  }
}
